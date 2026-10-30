export type TransactionType = 'expense' | 'income';

export type IncomeKind = 'transfer_from' | 'payment_from' | 'top_up';

export interface Transaction {
  date: string;
  description: string;
  moneyOut: string;
  moneyIn: string;
  balance: string;
  reference?: string;
  recipient?: string;
  paymentReference?: string;
  type?: TransactionType;
  incomeKind?: IncomeKind;
  counterparty?: string;
}

export interface FormData {
  accountHolderName: string;
  address: string;
  apartment: string;
  postalCode: string;
  city: string;
  country: string;
  iban: string;
  bic: string;
  statementDate: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: string;
  moneyOut: string;
  moneyIn: string;
  closingBalance: string;
  transactions: Transaction[];
  contactPhone: string;
  currency: 'EUR' | 'USD';
  storageDays: string;
}

export interface TransactionPayload {
  date: string;
  description: string;
  moneyOut: number | null;
  moneyIn: number | null;
  balance: number;
}

export interface PdfPayload {
  templateId: string;
  data: {
    accountHolderName: string;
    address: string;
    apartment: string;
    postalCode: string;
    city: string;
    country: string;
    iban: string;
    bic: string;
    statementDate: string;
    periodStart: string;
    periodEnd: string;
    openingBalance: number;
    moneyOut: number;
    moneyIn: number;
    closingBalance: number;
    transactions: TransactionPayload[];
    contactPhone: string;
  };
}

