import { useState, type ChangeEvent } from 'react';
import type { Transaction } from '../../types';
import { InputSmall, DatePickerSmall, Button } from '../ui';
import { formatDate } from '../../utils/date';
import { PLACEHOLDERS } from './constants';

interface AddTransactionFormProps {
  transaction: Transaction;
  onChange: (transaction: Transaction) => void;
  onAdd: () => void;
  currency: 'EUR' | 'USD';
  openingBalance: string;
  lastTransactionBalance: string;
}

export function AddTransactionForm({ transaction, onChange, onAdd, currency, openingBalance, lastTransactionBalance }: AddTransactionFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const currencySymbol = currency === 'USD' ? '$' : '€';
  
  const previousBalance = lastTransactionBalance 
    ? parseFloat(lastTransactionBalance) || 0
    : parseFloat(openingBalance) || 0;
  
  const moneyIn = parseFloat(transaction.moneyIn) || 0;
  const moneyOut = parseFloat(transaction.moneyOut) || 0;
  const previewBalance = previousBalance + moneyIn - moneyOut;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...transaction, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      onChange({ ...transaction, date: formatDate(date) });
    } else {
      onChange({ ...transaction, date: '' });
    }
  };

  const handleAdd = () => {
    onAdd();
    setSelectedDate(null);
  };

  return (
    <div className="mt-4 p-4 bg-slate-900 rounded-md border border-slate-700">
      <h3 className="text-slate-300 font-medium mb-3">Add transaction</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
        <DatePickerSmall
          label="Date:"
          selected={selectedDate}
          onChange={handleDateChange}
          placeholderText="Select..."
        />
        <div className="col-span-2 lg:col-span-2">
          <InputSmall
            label="Description:"
            name="description"
            value={transaction.description}
            onChange={handleChange}
            placeholder={PLACEHOLDERS.transactionDescription}
          />
        </div>
        <InputSmall
          label="Reference:"
          name="reference"
          value={transaction.reference ?? ''}
          onChange={handleChange}
          placeholder={PLACEHOLDERS.transactionReference}
        />
        <InputSmall
          label="To:"
          name="recipient"
          value={transaction.recipient ?? ''}
          onChange={handleChange}
          placeholder={PLACEHOLDERS.transactionRecipient}
        />
        <InputSmall
          label={`Money out (${currencySymbol}):`}
          type="number"
          step="0.01"
          name="moneyOut"
          value={transaction.moneyOut}
          onChange={handleChange}
          placeholder={PLACEHOLDERS.transactionMoneyOut}
        />
        <InputSmall
          label={`Money in (${currencySymbol}):`}
          type="number"
          step="0.01"
          name="moneyIn"
          value={transaction.moneyIn}
          onChange={handleChange}
          placeholder={PLACEHOLDERS.transactionMoneyIn}
        />
        <div>
          <label className="block text-slate-400 text-xs font-medium mb-1">
            Balance ({currencySymbol}):
          </label>
          <div className="px-2 py-2 bg-slate-800 border border-slate-700 rounded text-emerald-400 text-sm font-medium">
            {previewBalance.toFixed(2)}
          </div>
        </div>
      </div>

      <Button variant="success" onClick={handleAdd} className="mt-3">
        Add
      </Button>
    </div>
  );
}
