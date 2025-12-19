import { useState, useEffect } from 'react';
import { getUserDocuments } from '../api/documentService';
import { generatePdfFromDocument, downloadBlob } from '../api/pdfService';
import { supabase } from '../lib/supabase';
import { Button, Loader } from './ui';

interface Document {
  id: string;
  created_at: string;
  expires_at: string | null;
  storage_days: number | null;
  period_start: string;
  period_end: string;
  opening_balance: number | null;
  closing_balance: number | null;
}

interface DocumentHistoryProps {
  onEdit: (documentId: string) => void;
  onBack: () => void;
}

export function DocumentHistory({ onEdit, onBack }: DocumentHistoryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await getUserDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      alert('Помилка завантаження документів');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (documentId: string) => {
    try {
      const blob = await generatePdfFromDocument(documentId);
      const filename = `statement-${documentId.slice(0, 8)}.pdf`;
      downloadBlob(blob, filename);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Помилка завантаження PDF');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Видалити цей документ?')) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(docs => docs.filter(d => d.id !== documentId));
      alert('Документ видалено');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Помилка видалення документа');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        Немає збережених документів
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors"
          aria-label="Назад"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-slate-200">Історія документів</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left text-slate-400 text-sm font-medium py-3 px-4">Період</th>
              <th className="text-left text-slate-400 text-sm font-medium py-3 px-4">Створено</th>
              <th className="text-left text-slate-400 text-sm font-medium py-3 px-4">Термін зберігання</th>
              <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">Дії</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b border-slate-800 hover:bg-slate-900/50">
                <td className="py-3 px-4 text-slate-200 text-sm">
                  {formatDate(doc.period_start)} - {formatDate(doc.period_end)}
                </td>
                <td className="py-3 px-4 text-slate-300 text-sm">
                  {formatDate(doc.created_at)}
                </td>
                <td className="py-3 px-4 text-slate-300 text-sm">
                  {doc.storage_days ? `${doc.storage_days} днів` : '-'}
                  {doc.expires_at && (
                    <div className="text-xs text-slate-500">
                      до {formatDate(doc.expires_at)}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="primary"
                      onClick={() => onEdit(doc.id)}
                      className="text-xs px-3 py-1"
                    >
                      Редагувати
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleDownload(doc.id)}
                      className="text-xs px-3 py-1"
                    >
                      Скачати
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(doc.id)}
                      className="text-xs px-3 py-1"
                    >
                      Видалити
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
