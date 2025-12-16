export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string | null;
          postal_code: string | null;
          city: string | null;
          country: string | null;
          iban: string | null;
          bic: string | null;
          contact_phone: string | null;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address?: string | null;
          postal_code?: string | null;
          city?: string | null;
          country?: string | null;
          iban?: string | null;
          bic?: string | null;
          contact_phone?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          address?: string | null;
          postal_code?: string | null;
          city?: string | null;
          country?: string | null;
          iban?: string | null;
          bic?: string | null;
          contact_phone?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          template_id: string;
          period_start: string;
          period_end: string;
          opening_balance: number | null;
          closing_balance: number | null;
          money_in: number | null;
          money_out: number | null;
          pdf_url: string | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          template_id?: string;
          period_start: string;
          period_end: string;
          opening_balance?: number | null;
          closing_balance?: number | null;
          money_in?: number | null;
          money_out?: number | null;
          pdf_url?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          template_id?: string;
          period_start?: string;
          period_end?: string;
          opening_balance?: number | null;
          closing_balance?: number | null;
          money_in?: number | null;
          money_out?: number | null;
          pdf_url?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          document_id: string;
          date: string;
          description: string;
          money_out: number | null;
          money_in: number | null;
          balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          date: string;
          description: string;
          money_out?: number | null;
          money_in?: number | null;
          balance: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          date?: string;
          description?: string;
          money_out?: number | null;
          money_in?: number | null;
          balance?: number;
          created_at?: string;
        };
      };
    };
  };
}

// Типи для зручності
export type Company = Database['public']['Tables']['companies']['Row'];
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];

export type Document = Database['public']['Tables']['documents']['Row'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];

export type TransactionRow = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

