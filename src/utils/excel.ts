import * as XLSX from 'xlsx';
import type { Transaction } from '../types';
import { formatDate, getTodayFormatted } from './date';
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

const MASKED_CARD = /^\d{4,6}[*xX•]{4,}\d{4}$/;

function toValidDate(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day ? formatDate(date) : '';
}

function toDateString(value: unknown): string {
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    return parsed ? formatDate(new Date(parsed.y, parsed.m - 1, parsed.d)) : '';
  }
  const str = String(value ?? '').trim().replace(/[ T]\d{1,2}:\d{2}(:\d{2})?.*$/, '');
  if (!str) return '';

  if (/^\d{1,2} [A-Za-z]{3} \d{4}$/.test(str)) return str;

  const dmy = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4}|\d{2})\.?$/);
  if (dmy) {
    const year = Number(dmy[3]) < 100 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    return toValidDate(year, Number(dmy[2]), Number(dmy[1]));
  }

  const ymd = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})\.?$/);
  if (ymd) {
    return toValidDate(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]));
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? '' : formatDate(parsed);
}

function toAmountString(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') return Math.abs(value).toFixed(2);
  let text = String(value).replace(/[\s €$]/g, '');
  if (text.includes(',') && text.includes('.')) {
    text = text.lastIndexOf(',') > text.lastIndexOf('.')
      ? text.replace(/\./g, '').replace(',', '.')
      : text.replace(/,/g, '');
  } else {
    text = text.replace(',', '.');
  }
  const num = parseFloat(text);
  return isNaN(num) ? '' : Math.abs(num).toFixed(2);
}

function rowToTransaction(row: Record<string, unknown>): Transaction | null {
  const isBlank = (v: unknown) => String(v ?? '').trim() === '';
  if ([row.description, row.from, row.moneyout, row.moneyin].every(isBlank)) return null;

  const from = String(row.from ?? '').trim();
  const description = String(row.description ?? '').trim();
  let reference = String(row.reference ?? '').trim();
  let recipient = String(row.recipient ?? '').replace(/\s/g, '');
  if (!recipient && MASKED_CARD.test(reference.replace(/\s/g, ''))) {
    recipient = reference.replace(/\s/g, '').replace(/[xX•]/g, '*');
    reference = '';
  }

  const base: Transaction = {
    date: toDateString(row.date),
    description: description || from,
    moneyOut: toAmountString(row.moneyout),
    moneyIn: toAmountString(row.moneyin),
    balance: toAmountString(row.balance),
    reference,
    recipient,
    type: 'expense'
  };

  const kind = parseTypeColumn(row.type);
  if (kind) {
    return {
      ...base,
      type: 'income',
      incomeKind: kind.value,
      counterparty: from,
      description: description || buildIncomeDescription(kind.value, from),
      recipient: '',
    };
  }
  const inferred = inferIncomeFromDescription(base.description);
  if (inferred) return { ...base, ...inferred };
  if (base.moneyIn && !base.moneyOut) {
    return {
      ...base,
      type: 'income',
      incomeKind: INCOME_KINDS[0].value,
      counterparty: from || base.description,
      recipient: '',
    };
  }
  return base;
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

export async function parseTransactionsFromExcel(
  file: File
): Promise<{ transactions: Transaction[]; filledDates: string[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('The Excel file contains no sheets');
  }

  const sheet = workbook.Sheets[sheetName];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', blankrows: true });
  const firstRowNumber = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1').s.r + 1;

  const headerIndex = grid.findIndex(cells =>
    cells.some(c => ['description', 'moneyout', 'moneyin'].includes(normalizeHeader(String(c))))
  );
  if (headerIndex === -1) {
    throw new Error('No header row found. The file needs Description, Money Out and Money In columns.');
  }
  const headers = grid[headerIndex].map(c => normalizeHeader(String(c)));

  const transactions: Transaction[] = [];
  const dateErrors: string[] = [];
  const emptyDates: { index: number; rowNumber: number }[] = [];
  for (let i = headerIndex + 1; i < grid.length; i++) {
    const row: Record<string, unknown> = {};
    headers.forEach((header, col) => {
      if (header) row[header] = grid[i][col];
    });
    const transaction = rowToTransaction(row);
    if (!transaction) continue;
    if (!transaction.date) {
      const raw = String(row.date ?? '').trim();
      if (raw) {
        dateErrors.push(`row ${firstRowNumber + i}: "${raw}"`);
      } else {
        emptyDates.push({ index: transactions.length, rowNumber: firstRowNumber + i });
      }
    }
    transactions.push(transaction);
  }

  if (transactions.length === 0) {
    throw new Error('No transactions found. Make sure the file uses the template columns.');
  }
  if (dateErrors.length > 0) {
    throw new Error(
      `Unrecognized date (${dateErrors.join('; ')}). ` +
      'Use a date like 15.07.2026 in the Date column and import again.'
    );
  }

  const filledDates = emptyDates.map(({ index, rowNumber }) => {
    transactions[index].date = nearbyDate(transactions, index);
    return `row ${rowNumber} → ${transactions[index].date}`;
  });

  return { transactions, filledDates };
}

function nearbyDate(transactions: Transaction[], index: number): string {
  for (let i = index - 1; i >= 0; i--) {
    if (transactions[i].date) return transactions[i].date;
  }
  for (let i = index + 1; i < transactions.length; i++) {
    if (transactions[i].date) return transactions[i].date;
  }
  return getTodayFormatted();
}
