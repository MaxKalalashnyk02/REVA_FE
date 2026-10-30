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

export function TransactionList({
  transactions,
  onRemove,
  currency = 'EUR',
  periodStart,
  periodEnd,
  parseDateFromString
}: TransactionListProps) {
  const currencySymbol = currency === 'USD' ? '$' : '€';

  const isOutOfPeriod = (tx: Transaction) => {
    if (!periodStart || !periodEnd || !parseDateFromString) return false;
    const txDate = parseDateFromString(tx.date);
    if (!txDate || isNaN(txDate.getTime())) return false;
    const txTime = txDate.getTime();
    return txTime < periodStart.getTime() || txTime > periodEnd.getTime();
  };

  if (!transactions.length) {
    return (
      <p className="text-slate-500 text-sm py-4 text-center">
        No transactions
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx, index) => {
        const outOfPeriod = isOutOfPeriod(tx);
        return (
        <div
          key={index}
          className={`grid grid-cols-1 md:grid-cols-6 gap-2 md:gap-4 p-3 bg-slate-900 rounded-md border items-center ${
            outOfPeriod ? 'border-amber-700 opacity-50' : 'border-slate-700'
          }`}
          title={outOfPeriod ? 'Outside the selected period — will not be included in the PDF' : undefined}
        >
          <div>
            <span className="text-slate-300 text-sm">{tx.date}</span>
            {outOfPeriod && <div className="text-amber-400 text-xs mt-0.5">Out of period</div>}
          </div>
          <div className="md:col-span-2">
            <div className="text-slate-300 text-sm">{tx.description}</div>
            {(tx.reference || tx.recipient || tx.paymentReference) && (
              <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                {tx.reference
                  ? <div>To: {tx.reference}</div>
                  : tx.paymentReference && <div>Reference: {tx.paymentReference}</div>}
                {tx.recipient && <div>Card: {tx.recipient}</div>}
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
              Delete
            </Button>
          </div>
        </div>
        );
      })}
    </div>
  );
}

