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
}

export function AddTransactionForm({ transaction, onChange, onAdd, currency }: AddTransactionFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const currencySymbol = currency === 'USD' ? '$' : '€';

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
      <h3 className="text-slate-300 font-medium mb-3">Додати транзакцію</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
        <DatePickerSmall
          label="Дата:"
          selected={selectedDate}
          onChange={handleDateChange}
          placeholderText="Оберіть..."
        />
        <div className="col-span-2 lg:col-span-2">
          <InputSmall
            label="Опис:"
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
          label={`Витрачено (${currencySymbol}):`}
          type="number"
          step="0.01"
          name="moneyOut"
          value={transaction.moneyOut}
          onChange={handleChange}
          placeholder={PLACEHOLDERS.transactionMoneyOut}
        />
        <InputSmall
          label={`Надійшло (${currencySymbol}):`}
          type="number"
          step="0.01"
          name="moneyIn"
          value={transaction.moneyIn}
          onChange={handleChange}
          placeholder={PLACEHOLDERS.transactionMoneyIn}
        />
        <InputSmall
          label={`Баланс (${currencySymbol}):`}
          type="number"
          step="0.01"
          name="balance"
          value={transaction.balance}
          onChange={handleChange}
          placeholder={PLACEHOLDERS.transactionBalance}
        />
      </div>

      <Button variant="success" onClick={handleAdd} className="mt-3">
        Додати
      </Button>
    </div>
  );
}
