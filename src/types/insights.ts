import type {
  Account,
  Category,
  FinancialReminder,
  RecurringTransaction,
  RecurringTransactionOccurrence,
  Transaction,
  TransactionType,
} from "./database";
import type { AccountWithBalance, TransactionWithRelations } from "./finance";

export type RecurringFrequency = "weekly" | "monthly" | "yearly";

export type RecurringTransactionInput = {
  account_id: string;
  amount: number;
  category_id?: string | null;
  end_date?: string | null;
  frequency: RecurringFrequency;
  interval_count: number;
  is_active: boolean;
  next_due_date: string;
  notes?: string | null;
  payment_method?: string | null;
  start_date: string;
  title: string;
  type: TransactionType;
};

export type RecurringTransactionWithRelations = RecurringTransaction & {
  account?: Account | null;
  category?: Category | null;
};

export type RecurringOccurrenceWithRelations = RecurringTransactionOccurrence & {
  recurring?: RecurringTransaction | null;
  transaction?: Transaction | null;
};

export type FinancialReminderInput = {
  amount?: number | null;
  due_date: string;
  kind: FinancialReminder["kind"];
  notes?: string | null;
  title: string;
};

export type ForecastPoint = {
  balance: number;
  date: string;
  expenses: number;
  income: number;
  label: string;
};

export type PlanningInsightsData = {
  accounts: AccountWithBalance[];
  categories: Category[];
  forecast: ForecastPoint[];
  occurrences: RecurringOccurrenceWithRelations[];
  recurringTransactions: RecurringTransactionWithRelations[];
  reminders: FinancialReminder[];
};

export type ReportCategoryTotal = {
  color: string | null;
  name: string;
  percent: number;
  total: number;
};

export type ReportPeriodTotal = {
  expenses: number;
  income: number;
  label: string;
  month: string;
  result: number;
};

export type FinancialReportData = {
  accounts: Account[];
  categories: Category[];
  categoryExpenses: ReportCategoryTotal[];
  endDate: string;
  expenses: number;
  income: number;
  monthlyEvolution: ReportPeriodTotal[];
  result: number;
  savingsRate: number;
  startDate: string;
  transactions: TransactionWithRelations[];
};
