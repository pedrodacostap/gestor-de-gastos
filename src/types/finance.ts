import type { Account, Category, Transaction, TransactionType } from "./database";

export type AccountWithBalance = Account & {
  current_balance: number;
  transaction_count: number;
};

export type TransactionWithRelations = Transaction & {
  account?: Account | null;
  category?: Category | null;
};

export type AccountInput = {
  bank?: string | null;
  color?: string | null;
  initial_balance: number;
  name: string;
  type: string;
};

export type CategoryInput = {
  color?: string | null;
  icon?: string | null;
  name: string;
  type: TransactionType;
};

export type TransactionInput = {
  account_id: string;
  amount: number;
  category_id?: string | null;
  notes?: string | null;
  payment_method?: string | null;
  title: string;
  transaction_date: string;
  type: TransactionType;
};

export type TransactionFilters = {
  accountId?: string;
  categoryId?: string;
  month: string;
  query?: string;
  type?: "all" | TransactionType;
};

export type DashboardData = {
  balanceTotal: number;
  categoryExpenses: Array<{
    color: string | null;
    name: string;
    total: number;
  }>;
  expensesMonth: number;
  incomeMonth: number;
  monthResult: number;
  recentTransactions: TransactionWithRelations[];
};
