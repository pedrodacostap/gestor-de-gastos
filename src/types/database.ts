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
      credit_card_installments: {
        Row: {
          amount: number;
          card_id: string;
          competence_month: string;
          created_at: string;
          id: string;
          installment_number: number;
          purchase_id: string;
          status: "pending" | "paid";
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          card_id: string;
          competence_month: string;
          created_at?: string;
          id?: string;
          installment_number: number;
          purchase_id: string;
          status?: "pending" | "paid";
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          card_id?: string;
          competence_month?: string;
          created_at?: string;
          id?: string;
          installment_number?: number;
          purchase_id?: string;
          status?: "pending" | "paid";
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      credit_card_invoice_payments: {
        Row: {
          account_id: string;
          amount: number;
          card_id: string;
          created_at: string;
          id: string;
          invoice_month: string;
          paid_at: string;
          transaction_id: string | null;
          user_id: string;
        };
        Insert: {
          account_id: string;
          amount: number;
          card_id: string;
          created_at?: string;
          id?: string;
          invoice_month: string;
          paid_at?: string;
          transaction_id?: string | null;
          user_id: string;
        };
        Update: {
          account_id?: string;
          amount?: number;
          card_id?: string;
          created_at?: string;
          id?: string;
          invoice_month?: string;
          paid_at?: string;
          transaction_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      credit_card_purchases: {
        Row: {
          card_id: string;
          category_id: string | null;
          created_at: string;
          description: string;
          id: string;
          installments_count: number;
          notes: string | null;
          purchase_date: string;
          total_amount: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          card_id: string;
          category_id?: string | null;
          created_at?: string;
          description: string;
          id?: string;
          installments_count?: number;
          notes?: string | null;
          purchase_date: string;
          total_amount: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          card_id?: string;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          installments_count?: number;
          notes?: string | null;
          purchase_date?: string;
          total_amount?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      credit_cards: {
        Row: {
          closing_day: number;
          color: string | null;
          created_at: string;
          credit_limit: number;
          due_day: number;
          id: string;
          is_active: boolean;
          issuer: string | null;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          closing_day: number;
          color?: string | null;
          created_at?: string;
          credit_limit?: number;
          due_day: number;
          id?: string;
          is_active?: boolean;
          issuer?: string | null;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          closing_day?: number;
          color?: string | null;
          created_at?: string;
          credit_limit?: number;
          due_day?: number;
          id?: string;
          is_active?: boolean;
          issuer?: string | null;
          name?: string;
          updated_at?: string;
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
export type CreditCard = Database["public"]["Tables"]["credit_cards"]["Row"];
export type CreditCardInstallment =
  Database["public"]["Tables"]["credit_card_installments"]["Row"];
export type CreditCardInvoicePayment =
  Database["public"]["Tables"]["credit_card_invoice_payments"]["Row"];
export type CreditCardPurchase =
  Database["public"]["Tables"]["credit_card_purchases"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
