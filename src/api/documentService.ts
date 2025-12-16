import { supabase } from '../lib/supabase';
import type { FormData } from '../types';
import type { Document } from '../types/database';

function parseNumber(value: string): number | null {
  if (!value) return null;
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function parseDateForDb(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function saveStatementForCurrentUser(
  formData: FormData,
  periodStartDate: Date | null,
  periodEndDate: Date | null
) {
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('Authentication error:', sessionError);
    if (sessionError) {
      await supabase.auth.signOut();
    }
    throw new Error('User not authenticated. Please log in again.');
  }

  const userId = session.user.id;

  const { data: existingCompanies, error: companySelectError } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', userId)
    .eq('name', formData.accountHolderName)
    .limit(1) as any;

  if (companySelectError) {
    console.error('Error selecting company:', companySelectError);
    throw new Error(`Failed to find company: ${companySelectError.message}`);
  }

  let companyId: string;

  if (existingCompanies && existingCompanies.length > 0) {
    companyId = existingCompanies[0].id;
  } else {
    const { data: newCompany, error: companyInsertError } =
      await (supabase as any)
        .from('companies')
        .insert({
          user_id: userId,
          name: formData.accountHolderName || 'Default company',
          address: formData.address,
          postal_code: formData.postalCode,
          city: formData.city,
          country: formData.country,
          iban: formData.iban,
          bic: formData.bic,
          contact_phone: formData.contactPhone,
        })
        .select('id')
        .single();

    if (companyInsertError || !newCompany) {
      console.error('Error inserting company:', companyInsertError);
      throw new Error(`Failed to create company: ${companyInsertError?.message || 'Unknown error'}`);
    }

    companyId = newCompany.id;
  }

  const periodStartDb = periodStartDate
    ? periodStartDate.toISOString().slice(0, 10)
    : parseDateForDb(formData.periodStart) ?? new Date().toISOString().slice(0, 10);
  const periodEndDb = periodEndDate
    ? periodEndDate.toISOString().slice(0, 10)
    : parseDateForDb(formData.periodEnd) ?? new Date().toISOString().slice(0, 10);

  const { data: document, error: documentError } =
    await (supabase as any)
      .from('documents')
      .insert({
        user_id: userId,
        company_id: companyId,
        template_id: 'revolut-statement',
        period_start: periodStartDb,
        period_end: periodEndDb,
        opening_balance: parseNumber(formData.openingBalance),
        closing_balance: parseNumber(formData.closingBalance),
        money_in: parseNumber(formData.moneyIn),
        money_out: parseNumber(formData.moneyOut),
        pdf_url: null,
        expires_at: null,
      })
      .select('id')
      .single();

  if (documentError || !document) {
    console.error('Error inserting document:', documentError);
    throw new Error(`Failed to create document: ${documentError?.message || 'Unknown error'}`);
  }

  const documentId = document.id;

  if (!formData.transactions.length) return documentId;

  const txPayload = formData.transactions
    .filter(tx => tx.description || tx.date)
    .map(tx => ({
      document_id: documentId,
      date: parseDateForDb(tx.date) ?? new Date().toISOString().slice(0, 10),
      description: tx.description,
      money_out: parseNumber(tx.moneyOut),
      money_in: parseNumber(tx.moneyIn),
      balance: parseNumber(tx.balance) ?? 0,
      reference: tx.reference || null,
      recipient: tx.recipient || null,
    }));

  if (!txPayload.length) return documentId;

  const { error: txError } = await (supabase as any)
    .from('transactions')
    .insert(txPayload);

  if (txError) {
    console.error('Error inserting transactions:', txError);
  }

  return documentId;
}

export async function getUserDocuments(): Promise<Document[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      companies (
        name,
        iban
      )
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false }) as any;

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return data || [];
}

export async function getDocumentById(documentId: string): Promise<Document | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      companies (
        name,
        address,
        postal_code,
        city,
        country,
        iban,
        bic,
        contact_phone
      )
    `)
    .eq('id', documentId)
    .eq('user_id', session.user.id)
    .single() as any;

  if (error) {
    throw new Error(`Failed to fetch document: ${error.message}`);
  }

  return data;
}


