import { useState, type ChangeEvent } from 'react';
import { Input, DatePicker, Section, Button } from '../ui';
import { TransactionList } from './TransactionList';
import { AddTransactionForm } from './AddTransactionForm';
import { INITIAL_FORM_DATA, INITIAL_TRANSACTION, PLACEHOLDERS } from './constants';
import { generatePdfFromDocument, downloadBlob } from '../../api/pdfService';
import { saveStatementForCurrentUser } from '../../api/documentService';
import { getTodayFormatted, formatDateLong } from '../../utils/date';
import type { FormData, Transaction } from '../../types';

export default function BankStatementForm() {
  const [periodStart, setPeriodStart] = useState<Date | null>(null);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    ...INITIAL_FORM_DATA,
    statementDate: getTodayFormatted(),
  });
  const [newTransaction, setNewTransaction] = useState<Transaction>(INITIAL_TRANSACTION);
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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

  const addTransaction = () => {
    if (!newTransaction.date || !newTransaction.description) return;
    
    setFormData(prev => ({
      ...prev,
      transactions: [...prev.transactions, newTransaction]
    }));
    setNewTransaction(INITIAL_TRANSACTION);
  };

  const removeTransaction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      transactions: prev.transactions.filter((_, i) => i !== index)
    }));
  };

  const handleCurrencyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'USD' ? 'USD' : 'EUR';
    setFormData(prev => ({ ...prev, currency: value }));
  };

  const currencySymbol = formData.currency === 'USD' ? '$' : '€';

  const handleGeneratePdf = async () => {
    setIsLoading(true);
    
    try {
      const documentId = await saveStatementForCurrentUser(formData, periodStart, periodEnd);
      console.log('Document saved with ID:', documentId);

      if (!documentId) {
        throw new Error('Failed to save document to database');
      }

      const blob = await generatePdfFromDocument(documentId);
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
          <Input label="IBAN:" name="iban" value={formData.iban} onChange={updateField} placeholder={PLACEHOLDERS.iban} />
          <Input label="BIC:" name="bic" value={formData.bic} onChange={updateField} placeholder={PLACEHOLDERS.bic} />
        </div>
      </Section>

      <Section title="Період виписки">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input label={`Початковий баланс (${currencySymbol}):`} type="number" step="0.01" name="openingBalance" value={formData.openingBalance} onChange={updateField} placeholder={PLACEHOLDERS.openingBalance} />
          <Input label={`Витрачено (${currencySymbol}):`} type="number" step="0.01" name="moneyOut" value={formData.moneyOut} onChange={updateField} placeholder={PLACEHOLDERS.moneyOut} />
          <Input label={`Надійшло (${currencySymbol}):`} type="number" step="0.01" name="moneyIn" value={formData.moneyIn} onChange={updateField} placeholder={PLACEHOLDERS.moneyIn} />
          <Input label={`Кінцевий баланс (${currencySymbol}):`} type="number" step="0.01" name="closingBalance" value={formData.closingBalance} onChange={updateField} placeholder={PLACEHOLDERS.closingBalance} />
        </div>
      </Section>

      <Section title="Транзакції">
        <TransactionList transactions={formData.transactions} onRemove={removeTransaction} />
        <AddTransactionForm
          transaction={newTransaction}
          onChange={setNewTransaction}
          onAdd={addTransaction}
          currency={formData.currency}
        />
      </Section>

      <Section title="Контактна інформація">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Контактний телефон:" name="contactPhone" value={formData.contactPhone} onChange={updateField} placeholder={PLACEHOLDERS.contactPhone} />
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
            Генерується
            <span className="loading-dots"></span>
          </span>
        ) : (
          'Згенерувати PDF'
        )}
      </Button>
    </div>
  );
}
