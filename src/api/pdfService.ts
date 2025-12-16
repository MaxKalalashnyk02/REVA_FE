import type { FormData, PdfPayload } from '../types';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const CLEAN_API_URL = RAW_API_URL.replace(/\/+$/, '');
export async function generateStatementPdf(formData: FormData): Promise<Blob> {
  const payload: PdfPayload = {
    templateId: 'revolut-statement',
    data: {
      accountHolderName: formData.accountHolderName,
      address: formData.address,
      postalCode: formData.postalCode,
      city: formData.city,
      country: formData.country,
      iban: formData.iban,
      bic: formData.bic,
      statementDate: formData.statementDate,
      periodStart: formData.periodStart,
      periodEnd: formData.periodEnd,
      openingBalance: parseFloat(formData.openingBalance) || 0,
      moneyOut: parseFloat(formData.moneyOut) || 0,
      moneyIn: parseFloat(formData.moneyIn) || 0,
      closingBalance: parseFloat(formData.closingBalance) || 0,
      transactions: formData.transactions.map(t => ({
        date: t.date,
        description: t.description,
        moneyOut: t.moneyOut ? parseFloat(t.moneyOut) : null,
        moneyIn: t.moneyIn ? parseFloat(t.moneyIn) : null,
        balance: parseFloat(t.balance) || 0
      })),
      contactPhone: formData.contactPhone
    }
  };

  return await generatePdfRequest(payload);
}

export async function generatePdfFromDocument(documentId: string): Promise<Blob> {
  const payload = {
    templateId: 'revolut-statement',
    documentId: documentId
  };

  return await generatePdfRequest(payload);
}

async function generatePdfRequest(payload: any): Promise<Blob> {
  const url = CLEAN_API_URL.endsWith('/api')
    ? `${CLEAN_API_URL}/generate-pdf`
    : `${CLEAN_API_URL}/api/generate-pdf`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error: ${response.status}`);
  }

  return response.blob();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

