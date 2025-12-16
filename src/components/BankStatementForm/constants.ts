import type { FormData, Transaction } from '../../types';

export const INITIAL_FORM_DATA: FormData = {
  accountHolderName: '',
  address: '',
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
  currency: 'EUR'
};

export const INITIAL_TRANSACTION: Transaction = {
  date: '',
  description: '',
  moneyOut: '',
  moneyIn: '',
  balance: '',
  reference: '',
  recipient: ''
};

export const PLACEHOLDERS = {
  accountHolderName: 'Dmytro Kostin',
  address: 'Moschou 4',
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
  transactionRecipient: 'MARIA NTIMPIZIDOU',
};
