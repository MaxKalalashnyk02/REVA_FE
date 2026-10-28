import type { Transaction } from '../types';

const toCents = (value: string | undefined) => Math.round((parseFloat(value ?? '') || 0) * 100);
const fromCents = (cents: number) => (cents / 100).toFixed(2);

export function sumAmounts(transactions: Transaction[], field: 'moneyIn' | 'moneyOut'): string {
  return fromCents(transactions.reduce((sum, t) => sum + toCents(t[field]), 0));
}

export function withRunningBalances(transactions: Transaction[], openingBalance: string): Transaction[] {
  let running = toCents(openingBalance);
  return transactions.map(t => {
    running += toCents(t.moneyIn) - toCents(t.moneyOut);
    return { ...t, balance: fromCents(running) };
  });
}

export function balanceBefore(transaction: Transaction): string {
  return fromCents(toCents(transaction.balance) - toCents(transaction.moneyIn) + toCents(transaction.moneyOut));
}
