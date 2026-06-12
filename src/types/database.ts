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
      budget_history: {
        Row: {
          budget_amount: number;
          budget_id: string | null;
          category_id: string | null;
          created_at: string;
          id: string;
          month: string;
          used_amount: number;
          user_id: string;
        };
        Insert: {
          budget_amount: number;
          budget_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          month: string;
          used_amount?: number;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["budget_history"]["Insert"]>;
        Relationships: [];
      };
      budgets: {
        Row: {
          amount: number;
          category_id: string;
          created_at: string;
          id: string;
          month: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category_id: string;
          created_at?: string;
          id?: string;
          month: string;
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["budgets"]["Insert"]>;
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
      debts: {
        Row: {
          created_at: string;
          creditor: string | null;
          due_day: number;
          id: string;
          installment_amount: number;
          installments_count: number;
          monthly_interest_rate: number;
          name: string;
          original_amount: number;
          remaining_balance: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          creditor?: string | null;
          due_day: number;
          id?: string;
          installment_amount?: number;
          installments_count?: number;
          monthly_interest_rate?: number;
          name: string;
          original_amount?: number;
          remaining_balance?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["debts"]["Insert"]>;
        Relationships: [];
      };
      debt_payments: {
        Row: {
          account_id: string | null;
          amount: number;
          created_at: string;
          debt_id: string;
          id: string;
          notes: string | null;
          payment_date: string;
          transaction_id: string | null;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount: number;
          created_at?: string;
          debt_id: string;
          id?: string;
          notes?: string | null;
          payment_date?: string;
          transaction_id?: string | null;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["debt_payments"]["Insert"]>;
        Relationships: [];
      };
      emergency_reserve_settings: {
        Row: {
          created_at: string;
          id: string;
          linked_goal_id: string | null;
          target_months: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          linked_goal_id?: string | null;
          target_months?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["emergency_reserve_settings"]["Insert"]>;
        Relationships: [];
      };
      goal_movements: {
        Row: {
          account_id: string | null;
          amount: number;
          created_at: string;
          goal_id: string;
          id: string;
          movement_date: string;
          notes: string | null;
          transaction_id: string | null;
          type: "deposit" | "withdrawal";
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount: number;
          created_at?: string;
          goal_id: string;
          id?: string;
          movement_date?: string;
          notes?: string | null;
          transaction_id?: string | null;
          type: "deposit" | "withdrawal";
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["goal_movements"]["Insert"]>;
        Relationships: [];
      };
      goals: {
        Row: {
          color: string | null;
          created_at: string;
          current_amount: number;
          icon: string | null;
          id: string;
          name: string;
          target_amount: number;
          target_date: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          current_amount?: number;
          icon?: string | null;
          id?: string;
          name: string;
          target_amount?: number;
          target_date?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Insert"]>;
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
      subscription_charges: {
        Row: {
          account_id: string | null;
          amount: number;
          category_id: string | null;
          charge_date: string;
          created_at: string;
          id: string;
          status: "pending" | "paid" | "cancelled";
          subscription_id: string;
          transaction_id: string | null;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount: number;
          category_id?: string | null;
          charge_date: string;
          created_at?: string;
          id?: string;
          status?: "pending" | "paid" | "cancelled";
          subscription_id: string;
          transaction_id?: string | null;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscription_charges"]["Insert"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          account_id: string | null;
          amount: number;
          billing_day: number;
          category_id: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          recurrence: "monthly" | "quarterly" | "yearly";
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount: number;
          billing_day: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          recurrence?: "monthly" | "quarterly" | "yearly";
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
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
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type BudgetHistory = Database["public"]["Tables"]["budget_history"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CreditCard = Database["public"]["Tables"]["credit_cards"]["Row"];
export type CreditCardInstallment =
  Database["public"]["Tables"]["credit_card_installments"]["Row"];
export type CreditCardInvoicePayment =
  Database["public"]["Tables"]["credit_card_invoice_payments"]["Row"];
export type CreditCardPurchase =
  Database["public"]["Tables"]["credit_card_purchases"]["Row"];
export type Debt = Database["public"]["Tables"]["debts"]["Row"];
export type DebtPayment = Database["public"]["Tables"]["debt_payments"]["Row"];
export type EmergencyReserveSettings =
  Database["public"]["Tables"]["emergency_reserve_settings"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
export type GoalMovement = Database["public"]["Tables"]["goal_movements"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type SubscriptionCharge =
  Database["public"]["Tables"]["subscription_charges"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
