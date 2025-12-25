import type { Transaction } from '../../types';
import { Button } from '../ui';

interface TransactionListProps {
  transactions: Transaction[];
  onRemove: (index: number) => void;
  currency?: 'EUR' | 'USD';
  periodStart?: Date | null;
  periodEnd?: Date | null;
  parseDateFromString?: (dateStr: string) => Date | null;
}

export function TransactionList({ transactions, onRemove, currency = 'EUR', periodStart, periodEnd, parseDateFromString }: TransactionListProps) {
  const currencySymbol = currency === 'USD' ? '$' : '€';
  
  const isTransactionInRange = (transaction: Transaction): boolean => {
    if (!periodStart || !periodEnd || !parseDateFromString) {
      return true;
    }
    
    const transactionDate = parseDateFromString(transaction.date);
    if (!transactionDate || isNaN(transactionDate.getTime())) {
      return true;
    }
    
    const startTime = periodStart.getTime();
    const endTime = periodEnd.getTime();
    const txTime = transactionDate.getTime();
    
    return txTime >= startTime && txTime <= endTime;
  };
  
  if (!transactions.length) {
    return (
      <p className="text-slate-500 text-sm py-4 text-center">
        Немає транзакцій
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx, index) => {
        const inRange = isTransactionInRange(tx);
        const borderClass = inRange ? 'border-slate-700' : 'border-red-500';
        
        return (
          <div
            key={index}
            className={`grid grid-cols-1 md:grid-cols-6 gap-2 md:gap-4 p-3 bg-slate-900 rounded-md border ${borderClass} items-center`}
          >
          <span className="text-slate-300 text-sm">{tx.date}</span>
          <div className="md:col-span-2">
            <div className="text-slate-300 text-sm">{tx.description}</div>
            {(tx.reference || tx.recipient) && (
              <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                {tx.reference && <div>Reference: {tx.reference}</div>}
                {tx.recipient && <div>To: {tx.recipient}</div>}
              </div>
            )}
          </div>
          <span className="text-red-400 text-sm font-medium">
            {tx.moneyOut ? `-${currencySymbol}${tx.moneyOut}` : ''}
          </span>
          <span className="text-emerald-400 text-sm font-medium">
            {tx.moneyIn ? `+${currencySymbol}${tx.moneyIn}` : ''}
          </span>
          <div className="flex items-center justify-between md:justify-end gap-2">
            <span className="text-slate-200 font-medium text-sm">{currencySymbol}{tx.balance}</span>
            <Button variant="danger" onClick={() => onRemove(index)} className="px-3 py-1 text-sm">
              Видалити
            </Button>
          </div>
        </div>
        );
      })}
    </div>
  );
}

