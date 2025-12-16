export interface Transaction {
  date: string;
  description: string;
  moneyOut: string;
  moneyIn: string;
  balance: string;
  reference?: string;
  recipient?: string;
}

export interface FormData {
  accountHolderName: string;
  address: string;
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

