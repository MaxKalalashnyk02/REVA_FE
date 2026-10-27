import * as XLSX from 'xlsx';
import type { Transaction } from '../types';
import { formatDate } from './date';
import {
  INCOME_KINDS,
  buildIncomeDescription,
  inferIncomeFromDescription,
} from '../components/BankStatementForm/constants';

const HEADERS = ['Date', 'Type', 'From', 'Description', 'Money Out', 'Money In', 'Balance', 'Reference', 'Recipient'] as const;

const COLUMN_WIDTHS = [
  { wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 20 },
];

function typeLabel(t: Transaction): string {
  if (t.type !== 'income') return 'Expense';
  return INCOME_KINDS.find(k => k.value === t.incomeKind)?.prefix ?? INCOME_KINDS[0].prefix;
}

function parseTypeColumn(value: unknown) {
  const text = normalizeHeader(String(value ?? ''));
  if (!text) return undefined;
  return INCOME_KINDS.find(k => normalizeHeader(k.prefix).startsWith(text) || text.startsWith(normalizeHeader(k.prefix)));
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, '');
}

function toDateString(value: unknown): string {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return formatDate(value);
  }
  const str = String(value ?? '').trim();
  if (!str) return '';

  if (/^\d{1,2} [A-Za-z]{3} \d{4}$/.test(str)) return str;

  const dmy = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) {
    return formatDate(new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])));
  }

  const ymd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymd) {
    return formatDate(new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])));
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? str : formatDate(parsed);
}

function toAmountString(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') return value.toFixed(2);
  const num = parseFloat(String(value).replace(/\s/g, '').replace(',', '.'));
  return isNaN(num) ? '' : num.toFixed(2);
}

function toNumberOrEmpty(value: string): number | string {
  const num = parseFloat(value);
  return isNaN(num) ? '' : num;
}

function downloadWorkbook(rows: (string | number)[][], fileName: string) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = COLUMN_WIDTHS;
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Transactions');
  XLSX.writeFile(workbook, fileName);
}

export function downloadTransactionsTemplate() {
  downloadWorkbook(
    [
      [...HEADERS],
      [formatDate(new Date()), 'Expense', '', 'Example payment', 25.5, '', '', 'REF123', ''],
      [formatDate(new Date()), 'Transfer from', 'JOHN SMITH', '', '', 100, '', '', ''],
      [formatDate(new Date()), 'Payment from', 'ACME LTD', '', '', 250, '', '', '']
    ],
    'transactions_template.xlsx'
  );
}

export function exportTransactionsToExcel(transactions: Transaction[]) {
  const rows = transactions.map(t => [
    t.date,
    typeLabel(t),
    t.type === 'income' ? t.counterparty ?? '' : '',
    t.description,
    toNumberOrEmpty(t.moneyOut),
    toNumberOrEmpty(t.moneyIn),
    toNumberOrEmpty(t.balance),
    t.reference ?? '',
    t.recipient ?? ''
  ]);
  downloadWorkbook([[...HEADERS], ...rows], 'transactions.xlsx');
}

export async function parseTransactionsFromExcel(file: File): Promise<Transaction[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('The Excel file contains no sheets');
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: ''
  });

  const transactions = rawRows
    .map(raw => {
      const row: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(raw)) {
        row[normalizeHeader(key)] = value;
      }
      const base: Transaction = {
        date: toDateString(row.date),
        description: String(row.description ?? '').trim(),
        moneyOut: toAmountString(row.moneyout),
        moneyIn: toAmountString(row.moneyin),
        balance: toAmountString(row.balance),
        reference: String(row.reference ?? '').trim(),
        recipient: String(row.recipient ?? '').replace(/\s/g, ''),
        type: 'expense'
      };

      const kind = parseTypeColumn(row.type);
      const from = String(row.from ?? '').trim();
      if (kind) {
        return {
          ...base,
          type: 'income' as const,
          incomeKind: kind.value,
          counterparty: from,
          description: base.description || buildIncomeDescription(kind.value, from),
          reference: '',
          recipient: '',
        };
      }
      const inferred = inferIncomeFromDescription(base.description);
      return inferred ? { ...base, ...inferred } : base;
    })
    .filter(t => t.date || t.description);

  if (transactions.length === 0) {
    throw new Error('No transactions found. Make sure the file uses the template columns.');
  }

  return transactions;
}
