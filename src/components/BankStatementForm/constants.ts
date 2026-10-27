import type { FormData, IncomeKind, Transaction } from '../../types';

export const INCOME_KINDS: { value: IncomeKind; label: string; prefix: string }[] = [
  { value: 'transfer_from', label: 'Transfer from', prefix: 'Transfer from' },
  { value: 'payment_from', label: 'Payment from', prefix: 'Payment from' },
];

export function buildIncomeDescription(kind: IncomeKind | undefined, counterparty: string | undefined): string {
  const prefix = INCOME_KINDS.find(k => k.value === kind)?.prefix ?? INCOME_KINDS[0].prefix;
  const name = (counterparty ?? '').trim();
  return name ? `${prefix} ${name}` : '';
}

export function inferIncomeFromDescription(
  description: string
): Pick<Transaction, 'type' | 'incomeKind' | 'counterparty'> | null {
  const text = description.trim();
  for (const kind of INCOME_KINDS) {
    if (text.toLowerCase().startsWith(kind.prefix.toLowerCase())) {
      return { type: 'income', incomeKind: kind.value, counterparty: text.slice(kind.prefix.length).trim() };
    }
  }
  return null;
}

export const INITIAL_FORM_DATA: FormData = {
  accountHolderName: '',
  address: '',
  apartment: '',
  postalCode: '',
  city: '',
  country: '',
  iban: '',
  bic: '',
  statementDate: '',
  periodStart: '',
  periodEnd: '',
  openingBalance: '',
  moneyOut: '',
  moneyIn: '',
  closingBalance: '',
  transactions: [],
  contactPhone: '',
  currency: 'EUR',
  storageDays: '7'
};

export const INITIAL_TRANSACTION: Transaction = {
  date: '',
  description: '',
  moneyOut: '',
  moneyIn: '',
  balance: '',
  reference: '',
  recipient: '',
  type: 'expense',
  incomeKind: 'transfer_from',
  counterparty: ''
};

export const PLACEHOLDERS = {
  accountHolderName: 'Dmytro Kostin',
  address: 'Moschou 4',
  apartment: 'App 44',
  postalCode: '3091',
  city: 'Limassol',
  country: 'Cyprus',
  iban: 'LT023250019100215325',
  bic: 'REVOLT21',
  openingBalance: '56782.90',
  moneyOut: '8815.04',
  moneyIn: '19367.78',
  closingBalance: '67338.64',
  contactPhone: '+370 5 214 3608',
  transactionDescription: 'Transfer to MARIA NTIMPIZIDOU',
  transactionMoneyOut: '6197.00',
  transactionMoneyIn: '1000.00',
  transactionBalance: '67338.64',
  transactionReference: 'To Maria N',
  transactionRecipient: '1234567890123456',
  transactionCounterparty: 'JOHN SMITH',
};
