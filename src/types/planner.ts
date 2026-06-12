import type {
  Account,
  Budget,
  Category,
  Subscription,
  SubscriptionCharge,
} from "./database";

export type CalendarEventKind =
  | "income"
  | "expense"
  | "invoice"
  | "installment"
  | "goal"
  | "debt"
  | "subscription";

export type CalendarEvent = {
  amount?: number;
  date: string;
  description?: string;
  id: string;
  kind: CalendarEventKind;
  title: string;
};

export type SubscriptionInput = {
  account_id?: string | null;
  amount: number;
  billing_day: number;
  category_id?: string | null;
  is_active: boolean;
  name: string;
  recurrence: "monthly" | "quarterly" | "yearly";
};

export type SubscriptionWithSummary = Subscription & {
  category?: Category | null;
  next_charge_date: string;
  renewal_alert: boolean;
};

export type BudgetInput = {
  amount: number;
  category_id: string;
  month: string;
};

export type BudgetWithUsage = Budget & {
  category?: Category | null;
  percent: number;
  remaining: number;
  status: "ok" | "warning" | "reached" | "exceeded";
  used: number;
};

export type PlannerData = {
  accounts: Account[];
  budgetSummary: {
    percent: number;
    remaining: number;
    total: number;
    used: number;
  };
  budgets: BudgetWithUsage[];
  calendarEvents: CalendarEvent[];
  categories: Category[];
  nextCharges: SubscriptionWithSummary[];
  nextDueEvents: CalendarEvent[];
  subscriptions: SubscriptionWithSummary[];
  subscriptionCharges: SubscriptionCharge[];
};
