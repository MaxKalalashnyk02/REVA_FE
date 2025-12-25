import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { Input, DatePicker, Section, Button, Loader } from '../ui';
import { TransactionList } from './TransactionList';
import { AddTransactionForm } from './AddTransactionForm';
import { INITIAL_FORM_DATA, INITIAL_TRANSACTION, PLACEHOLDERS } from './constants';
import { generatePdfFromDocument, downloadBlob } from '../../api/pdfService';
import { saveStatementForCurrentUser, getDocumentById } from '../../api/documentService';
import { getTodayFormatted, formatDateLong } from '../../utils/date';
import { downloadTransactionsTemplate, parseTransactionsFromExcel, exportTransactionsToExcel } from '../../utils/excel';
import type { FormData, Transaction } from '../../types';
import { supabase } from '../../lib/supabase';

interface BankStatementFormProps {
  documentId?: string | null;
}

export default function BankStatementForm({ documentId }: BankStatementFormProps) {
  const [periodStart, setPeriodStart] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    ...INITIAL_FORM_DATA,
    statementDate: getTodayFormatted(),
  });
  const [newTransaction, setNewTransaction] = useState<Transaction>(INITIAL_TRANSACTION);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    } else {
      setFormData({
        ...INITIAL_FORM_DATA,
        statementDate: getTodayFormatted(),
      });
      setPeriodStart(null);
      setPeriodEnd(null);
    }
  }, [documentId]);

  const loadDocument = async (docId: string) => {
    setIsLoadingDocument(true);
    try {
      const doc = await getDocumentById(docId);
      if (!doc) {
        alert('Документ не знайдено');
        return;
      }

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('document_id', docId)
        .order('created_at', { ascending: true });

      const docData = doc as any;
      const company = docData.companies || {};

      setFormData({
        accountHolderName: company.name || '',
        address: company.address || '',
        postalCode: company.postal_code || '',
        city: company.city || '',
        country: company.country || '',
        iban: company.iban || '',
        bic: company.bic || '',
        statementDate: getTodayFormatted(),
        periodStart: formatDateLong(new Date(doc.period_start)),
        periodEnd: formatDateLong(new Date(doc.period_end)),
        openingBalance: doc.opening_balance?.toString() || '',
        moneyOut: doc.money_out?.toString() || '',
        moneyIn: doc.money_in?.toString() || '',
        closingBalance: doc.closing_balance?.toString() || '',
        contactPhone: company.contact_phone || '',
        currency: 'EUR',
        storageDays: doc.storage_days?.toString() || '7',
        transactions: ((transactions || []) as any[]).map((t: any) => ({
          date: formatDateLong(new Date(t.date)),
          description: t.description || '',
          moneyOut: t.money_out?.toString() || '',
          moneyIn: t.money_in?.toString() || '',
          balance: t.balance?.toString() || '',
          reference: t.reference || '',
          recipient: t.recipient || '',
        })),
      });

      setPeriodStart(new Date(doc.period_start));
      setPeriodEnd(new Date(doc.period_end));
    } catch (error) {
      console.error('Error loading document:', error);
      alert('Помилка завантаження документа');
    } finally {
      setIsLoadingDocument(false);
    }
  };

  const updateField = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'iban') {
      const alphanumeric = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (alphanumeric.length <= 34) {
        setFormData(prev => ({ ...prev, [name]: alphanumeric }));
      }
      return;
    }
    
    if (name === 'bic') {
      const alphanumeric = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (alphanumeric.length <= 11) {
        setFormData(prev => ({ ...prev, [name]: alphanumeric }));
      }
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePeriodStartChange = (date: Date | null) => {
    setPeriodStart(date);
    if (date) {
      setFormData(prev => ({ ...prev, periodStart: formatDateLong(date) }));
    }
  };

  const handlePeriodEndChange = (date: Date | null) => {
    setPeriodEnd(date);
    if (date) {
      setFormData(prev => ({ ...prev, periodEnd: formatDateLong(date) }));
    }
  };

  const parseDateFromString = (dateStr: string): Date | null => {
    try {
      const parts = dateStr.trim().split(' ');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const monthMap: { [key: string]: number } = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        const month = monthMap[parts[1]];
        const year = parseInt(parts[2]);
        if (!isNaN(day) && month !== undefined && !isNaN(year)) {
          return new Date(year, month, day);
        }
      }
      return new Date(dateStr);
    } catch {
      return null;
    }
  };

  const updatePeriodDatesFromTransactions = (transactions: Transaction[]) => {
    if (transactions.length === 0) return;

    const dates = transactions
      .map(t => parseDateFromString(t.date))
      .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length > 0) {
      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];
      
      setPeriodStart(firstDate);
      setPeriodEnd(lastDate);
      setFormData(prev => ({
        ...prev,
        periodStart: formatDateLong(firstDate),
        periodEnd: formatDateLong(lastDate)
      }));
    }
  };

  const addTransaction = () => {
    if (!newTransaction.date || !newTransaction.description) {
      alert('Будь ласка, заповніть дату та опис');
      return;
    }

    const prevBalance = formData.transactions.length > 0
      ? parseFloat(formData.transactions[formData.transactions.length - 1].balance) || 0
      : parseFloat(formData.openingBalance) || 0;

    const moneyIn = parseFloat(newTransaction.moneyIn) || 0;
    const moneyOut = parseFloat(newTransaction.moneyOut) || 0;
    const calculatedBalance = (prevBalance + moneyIn - moneyOut).toFixed(2);

    const transactionWithBalance = {
      ...newTransaction,
      balance: calculatedBalance
    };

    const updatedTransactions = [...formData.transactions, transactionWithBalance];
    
    updatePeriodDatesFromTransactions(updatedTransactions);

    setFormData(prev => ({
      ...prev,
      transactions: updatedTransactions
    }));
    setNewTransaction(INITIAL_TRANSACTION);
  };

  const removeTransaction = (index: number) => {
    const updatedTransactions = formData.transactions.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      transactions: updatedTransactions
    }));
  };

  const handleCurrencyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'USD' ? 'USD' : 'EUR';
    setFormData(prev => ({ ...prev, currency: value }));
  };

  const currencySymbol = formData.currency === 'USD' ? '$' : '€';

  const calculatedClosingBalance = (
    (parseFloat(formData.openingBalance) || 0) +
    (parseFloat(formData.moneyIn) || 0) -
    (parseFloat(formData.moneyOut) || 0)
  ).toFixed(2);

  const processExcelFile = async (file: File) => {
    try {
      const transactions = await parseTransactionsFromExcel(file);
      const updatedTransactions = [...formData.transactions, ...transactions];
      
      if (!periodStart || !periodEnd) {
        updatePeriodDatesFromTransactions(updatedTransactions);
      }
      
      setFormData(prev => ({
        ...prev,
        transactions: updatedTransactions
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Помилка імпорту');
    }
  };

  const handleImportExcel = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processExcelFile(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    const file = files[0];
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Будь ласка, завантажте файл Excel (.xlsx або .xls)');
      return;
    }
    
    await processExcelFile(file);
  };

  const handleGeneratePdf = async () => {
    if (!formData.contactPhone || formData.contactPhone.trim() === '') {
      alert('Будь ласка, заповніть контактний телефон');
      return;
    }

    setIsLoading(true);
    
    try {
      let filteredTransactions = formData.transactions;

      if (periodStart && periodEnd) {
        filteredTransactions = formData.transactions.filter(transaction => {
          const transactionDate = parseDateFromString(transaction.date);
          if (!transactionDate || isNaN(transactionDate.getTime())) {
            return true;
          }
          
          const startTime = periodStart.getTime();
          const endTime = periodEnd.getTime();
          const txTime = transactionDate.getTime();
          
          return txTime >= startTime && txTime <= endTime;
        });
      }

      const updatedFormData = {
        ...formData,
        transactions: filteredTransactions,
        closingBalance: calculatedClosingBalance
      };
      const documentId = await saveStatementForCurrentUser(updatedFormData, periodStart, periodEnd);
      console.log('Document saved with ID:', documentId);

      if (!documentId) {
        throw new Error('Failed to save document to database');
      }

      const blob = await generatePdfFromDocument(documentId, {
        iban: formData.iban,
        bic: formData.bic
      });
      const filename = `revolut-statement-${formData.statementDate.replace(/\s/g, '-')}.pdf`;
      downloadBlob(blob, filename);
    } catch (error) {
      console.error('PDF generation error:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('not authenticated')) {
          errorMessage = 'Сесія закінчилася. Будь ласка, увійдіть знову.';
        } else if (error.message.includes('socket hang up')) {
          errorMessage = 'Помилка з\'єднання з сервером. Спробуйте ще раз.';
        } else if (error.message.includes('Document not found')) {
          errorMessage = 'Документ не знайдено в базі даних.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`Помилка: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingDocument) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <Loader text="Завантаження документа..." />
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 rounded-xl p-4 md:p-6 border border-slate-800">
      
      <Section title="Інформація про власника рахунку">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input label="Ім'я:" name="accountHolderName" value={formData.accountHolderName} onChange={updateField} placeholder={PLACEHOLDERS.accountHolderName} />
          <Input label="Адреса:" name="address" value={formData.address} onChange={updateField} placeholder={PLACEHOLDERS.address} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Поштовий індекс:" name="postalCode" value={formData.postalCode} onChange={updateField} placeholder={PLACEHOLDERS.postalCode} />
          <Input label="Місто:" name="city" value={formData.city} onChange={updateField} placeholder={PLACEHOLDERS.city} />
          <Input label="Країна:" name="country" value={formData.country} onChange={updateField} placeholder={PLACEHOLDERS.country} />
        </div>
      </Section>

      <Section title="Банківські реквізити">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input label="IBAN:" name="iban" value={formData.iban} onChange={updateField} placeholder={PLACEHOLDERS.iban} maxLength={34} />
            <p className="text-slate-500 text-xs mt-1">Максимум 34 символи ({formData.iban.length}/34)</p>
          </div>
          <div>
            <Input label="BIC:" name="bic" value={formData.bic} onChange={updateField} placeholder={PLACEHOLDERS.bic} maxLength={11} />
            <p className="text-slate-500 text-xs mt-1">8 або 11 символів ({formData.bic.length}/11)</p>
          </div>
        </div>
      </Section>

      <Section title="Баланс">
        <div className="flex justify-end mb-2">
          <label className="text-slate-300 text-sm flex items-center gap-2">
            Валюта:
            <select
              value={formData.currency}
              onChange={handleCurrencyChange}
              className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input label={`Початковий баланс (${currencySymbol}):`} type="number" step="0.01" name="openingBalance" value={formData.openingBalance} onChange={updateField} placeholder={PLACEHOLDERS.openingBalance} />
          <Input label={`Витрачено (${currencySymbol}):`} type="number" step="0.01" name="moneyOut" value={formData.moneyOut} onChange={updateField} placeholder={PLACEHOLDERS.moneyOut} />
          <Input label={`Надійшло (${currencySymbol}):`} type="number" step="0.01" name="moneyIn" value={formData.moneyIn} onChange={updateField} placeholder={PLACEHOLDERS.moneyIn} />
          <div>
            <label className="block text-slate-400 text-sm font-medium mb-1.5">
              Кінцевий баланс ({currencySymbol}):
            </label>
            <div className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-md text-emerald-400 font-semibold text-lg">
              {calculatedClosingBalance}
            </div>
          </div>
          <Input 
            label="Термін зберігання (днів):" 
            type="number" 
            min="1" 
            max="31" 
            name="storageDays" 
            value={formData.storageDays} 
            onChange={updateField} 
            placeholder="7" 
          />
        </div>
      </Section>

      <Section title="Період транзакцій">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1.5">Дата генерації:</p>
            <p className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200">
              {formData.statementDate}
            </p>
            <p className="text-slate-500 text-xs mt-1">Автоматично — сьогодні</p>
          </div>
          <DatePicker 
            label="Початок періоду:" 
            selected={periodStart}
            onChange={handlePeriodStartChange}
            placeholderText="Оберіть дату..."
          />
          <DatePicker 
            label="Кінець періоду:" 
            selected={periodEnd}
            onChange={handlePeriodEndChange}
            placeholderText="Оберіть дату..."
          />
        </div>
        {(formData.periodStart || formData.periodEnd) && (
          <p className="text-slate-500 text-xs mt-3">
            Період: <span className="text-slate-300">{formData.periodStart || '—'}</span> — <span className="text-slate-300">{formData.periodEnd || '—'}</span>
          </p>
        )}
      </Section>

      <Section title="Транзакції">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={downloadTransactionsTemplate}
            className="text-sm"
          >
            Скачати шаблон Excel
          </Button>
          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm"
          >
            Імпортувати з Excel
          </Button>
          {formData.transactions.length > 0 && (
            <Button
              variant="primary"
              onClick={() => exportTransactionsToExcel(formData.transactions)}
              className="text-sm"
            >
              Експортувати в Excel
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImportExcel}
          className="hidden"
        />
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-700 rounded-lg p-4 mb-4 transition-colors hover:border-sky-500 hover:bg-slate-800/50"
        >
          <p className="text-slate-400 text-sm text-center">
            Перетягніть Excel файл сюди або використайте кнопку "Імпортувати з Excel"
          </p>
        </div>
        <TransactionList 
          key={`${periodStart?.getTime()}-${periodEnd?.getTime()}`}
          transactions={formData.transactions} 
          onRemove={removeTransaction}
          currency={formData.currency}
          periodStart={periodStart}
          periodEnd={periodEnd}
          parseDateFromString={parseDateFromString}
        />
        <AddTransactionForm
          transaction={newTransaction}
          onChange={setNewTransaction}
          onAdd={addTransaction}
          currency={formData.currency}
          openingBalance={formData.openingBalance}
          lastTransactionBalance={
            formData.transactions.length > 0
              ? formData.transactions[formData.transactions.length - 1].balance
              : ''
          }
        />
      </Section>

      <Section title="Контактна інформація">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Контактний телефон:" name="contactPhone" value={formData.contactPhone} onChange={updateField} placeholder={PLACEHOLDERS.contactPhone} required />
        </div>
      </Section>

      <Button
        variant="primary"
        onClick={handleGeneratePdf}
        disabled={isLoading}
        className="w-full py-3 text-lg font-semibold rounded-lg"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-1">
            {documentId ? 'Оновлюється' : 'Генерується'}
            <span className="loading-dots"></span>
          </span>
        ) : (
          documentId ? 'Оновити документ' : 'Згенерувати PDF'
        )}
      </Button>
    </div>
  );
}
