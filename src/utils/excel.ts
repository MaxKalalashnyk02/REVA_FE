import * as XLSX from 'xlsx';
import type { Transaction } from '../types';

export function downloadTransactionsTemplate() {
  const template = [
    {
      'Date': '26 Nov 2024',
      'Description': 'Transfer to MARIA NTIMPIZIDOU',
      'Reference': 'To Maria N',
      'To': 'MARIA NTIMPIZIDOU',
      'Money Out': '6197.00',
      'Money In': '',
      'Balance': ''
    },
    {
      'Date': '27 Nov 2024',
      'Description': 'Payment received',
      'Reference': '',
      'To': '',
      'Money Out': '',
      'Money In': '1000.00',
      'Balance': ''
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 35 },
    { wch: 20 },
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 }
  ];

  XLSX.writeFile(workbook, 'reva-transactions-template.xlsx');
}

export function parseTransactionsFromExcel(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const transactions: Transaction[] = jsonData
          .filter(row => row['Date'] && row['Description'])
          .map(row => ({
            date: String(row['Date'] || '').trim(),
            description: String(row['Description'] || '').trim(),
            reference: String(row['Reference'] || '').trim(),
            recipient: String(row['To'] || '').trim(),
            moneyOut: String(row['Money Out'] || '').trim(),
            moneyIn: String(row['Money In'] || '').trim(),
            balance: String(row['Balance'] || '').trim()
          }));

        resolve(transactions);
      } catch (error) {
        reject(new Error('Помилка при читанні Excel файлу. Перевірте формат.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Помилка при завантаженні файлу'));
    };

    reader.readAsBinaryString(file);
  });
}

export function exportTransactionsToExcel(transactions: Transaction[]) {
  const data = transactions.map(t => ({
    'Date': t.date,
    'Description': t.description,
    'Reference': t.reference || '',
    'To': t.recipient || '',
    'Money Out': t.moneyOut || '',
    'Money In': t.moneyIn || '',
    'Balance': t.balance || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 35 },
    { wch: 20 },
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 }
  ];

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `reva-transactions-${timestamp}.xlsx`);
}
