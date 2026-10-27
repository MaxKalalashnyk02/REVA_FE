import { useState, type ChangeEvent } from 'react';
import type { IncomeKind, Transaction } from '../../types';
import { InputSmall, SelectSmall, DatePickerSmall, Button } from '../ui';
import { formatDate } from '../../utils/date';
import { PLACEHOLDERS, INCOME_KINDS, buildIncomeDescription } from './constants';
import { CARD_NUMBER_LENGTH, isValidCardNumber, sanitizeCardNumber } from '../../utils/card';

interface AddTransactionFormProps {
  transaction: Transaction;
  onChange: (transaction: Transaction) => void;
  onAdd: () => boolean;
  currency: 'EUR' | 'USD';
  openingBalance: string;
  lastTransactionBalance: string;
  remainingMoneyIn: string;
  remainingMoneyOut: string;
}

export function AddTransactionForm({
  transaction,
  onChange,
  onAdd,
  currency,
  openingBalance,
  lastTransactionBalance,
  remainingMoneyIn,
  remainingMoneyOut
}: AddTransactionFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const currencySymbol = currency === 'USD' ? '$' : '€';

  const prevBalance = parseFloat(lastTransactionBalance || openingBalance) || 0;
  const calculatedBalance = (
    prevBalance +
    (parseFloat(transaction.moneyIn) || 0) -
    (parseFloat(transaction.moneyOut) || 0)
  ).toFixed(2);

  const moneyInExceeded = (parseFloat(transaction.moneyIn) || 0) > parseFloat(remainingMoneyIn);
  const moneyOutExceeded = (parseFloat(transaction.moneyOut) || 0) > parseFloat(remainingMoneyOut);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'moneyIn' || name === 'moneyOut') {
      const remaining = Math.max(0, parseFloat(name === 'moneyIn' ? remainingMoneyIn : remainingMoneyOut) || 0);
      if (value !== '' && parseFloat(value) > remaining) {
        onChange({ ...transaction, [name]: remaining.toFixed(2) });
        return;
      }
    }

    onChange({ ...transaction, [name]: value });
  };

  const isIncome = transaction.type === 'income';

  const isAutoDescription = (tx: Transaction) =>
    tx.description === '' || tx.description === buildIncomeDescription(tx.incomeKind, tx.counterparty);

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value === 'income' ? 'income' : 'expense';
    onChange({
      ...transaction,
      type,
      moneyIn: '',
      moneyOut: '',
      reference: '',
      recipient: '',
      counterparty: '',
      description: isIncome && isAutoDescription(transaction) ? '' : transaction.description,
    });
  };

  const updateIncome = (patch: Pick<Transaction, 'incomeKind'> | Pick<Transaction, 'counterparty'>) => {
    const next = { ...transaction, ...patch };
    if (isAutoDescription(transaction)) {
      next.description = buildIncomeDescription(next.incomeKind, next.counterparty);
    }
    onChange(next);
  };

  const cardNumber = transaction.recipient ?? '';
  const cardInvalid = cardNumber !== '' && !isValidCardNumber(cardNumber);

  const handleCardChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...transaction, recipient: sanitizeCardNumber(e.target.value) });
  };

  const handleDateChange =(date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      onChange({ ...transaction, date: formatDate(date) });
    } else {
      onChange({ ...transaction, date: '' });
    }
  };

  const handleAdd = () => {
    if (!onAdd()) return;
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
        <SelectSmall label="Type:" value={transaction.type ?? 'expense'} onChange={handleTypeChange}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </SelectSmall>

        {isIncome ? (
          <>
            <SelectSmall
              label="Income type:"
              value={transaction.incomeKind ?? 'transfer_from'}
              onChange={e => updateIncome({ incomeKind: e.target.value as IncomeKind })}
              title={INCOME_KINDS.find(k => k.value === transaction.incomeKind)?.label}
            >
              {INCOME_KINDS.map(kind => (
                <option key={kind.value} value={kind.value}>{kind.label}</option>
              ))}
            </SelectSmall>
            <InputSmall
              label="From:"
              name="counterparty"
              value={transaction.counterparty ?? ''}
              onChange={e => updateIncome({ counterparty: e.target.value })}
              placeholder={PLACEHOLDERS.transactionCounterparty}
            />
          </>
        ) : (
          <>
            <InputSmall
              label="To:"
              name="reference"
              value={transaction.reference ?? ''}
              onChange={handleChange}
              placeholder={PLACEHOLDERS.transactionReference}
            />
            <div>
              <InputSmall
                label="Card:"
                name="recipient"
                inputMode="numeric"
                maxLength={CARD_NUMBER_LENGTH}
                value={transaction.recipient ?? ''}
                onChange={handleCardChange}
                placeholder={PLACEHOLDERS.transactionRecipient}
                className={cardInvalid ? 'border-red-500' : ''}
              />
              {cardInvalid && (
                <p className="text-red-400 text-xs mt-1">
                  {cardNumber.length}/{CARD_NUMBER_LENGTH} digits
                </p>
              )}
            </div>
          </>
        )}

        <div className="col-span-2 lg:col-span-2">
          <InputSmall
            label="Description:"
            name="description"
            value={transaction.description}
            onChange={handleChange}
            placeholder={isIncome ? 'Transfer from JOHN SMITH' : PLACEHOLDERS.transactionDescription}
          />
        </div>

        {isIncome ? (
          <div>
            <InputSmall
              label={`Money in (${currencySymbol}):`}
              type="number"
              step="0.01"
              min="0"
              max={remainingMoneyIn}
              name="moneyIn"
              value={transaction.moneyIn}
              onChange={handleChange}
              placeholder={PLACEHOLDERS.transactionMoneyIn}
              className={moneyInExceeded ? 'border-red-500' : ''}
            />
          </div>
        ) : (
          <div>
            <InputSmall
              label={`Money out (${currencySymbol}):`}
              type="number"
              step="0.01"
              min="0"
              max={remainingMoneyOut}
              name="moneyOut"
              value={transaction.moneyOut}
              onChange={handleChange}
              placeholder={PLACEHOLDERS.transactionMoneyOut}
              className={moneyOutExceeded ? 'border-red-500' : ''}
            />
          </div>
        )}
        <InputSmall
          label={`Balance (${currencySymbol}):`}
          type="number"
          name="balance"
          value={calculatedBalance}
          readOnly
          title="Calculated automatically from the previous balance"
        />
      </div>

      <Button variant="success" onClick={handleAdd} className="mt-3">
        Add
      </Button>
    </div>
  );
}
