export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TransactionType = "income" | "expense";

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          bank: string | null;
          color: string | null;
          created_at: string;
          id: string;
          initial_balance: number;
          name: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          bank?: string | null;
          color?: string | null;
          created_at?: string;
          id?: string;
          initial_balance?: number;
          name: string;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          bank?: string | null;
          color?: string | null;
          created_at?: string;
          id?: string;
          initial_balance?: number;
          name?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          color: string | null;
          created_at: string;
          icon: string | null;
          id: string;
          name: string;
          type: TransactionType;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          name: string;
          type: TransactionType;
          user_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          type?: TransactionType;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          account_id: string;
          amount: number;
          category_id: string | null;
          created_at: string;
          id: string;
          notes: string | null;
          payment_method: string | null;
          title: string;
          transaction_date: string;
          type: TransactionType;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id: string;
          amount: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          payment_method?: string | null;
          title: string;
          transaction_date: string;
          type: TransactionType;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string;
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          notes?: string | null;
          payment_method?: string | null;
          title?: string;
          transaction_date?: string;
          type?: TransactionType;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
