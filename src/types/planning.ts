import type {
  Account,
  Debt,
  DebtPayment,
  EmergencyReserveSettings,
  Goal,
  GoalMovement,
} from "./database";

export type GoalInput = {
  color?: string | null;
  current_amount: number;
  icon?: string | null;
  name: string;
  target_amount: number;
  target_date?: string | null;
};

export type GoalMovementInput = {
  account_id?: string | null;
  amount: number;
  goal_id: string;
  movement_date: string;
  notes?: string | null;
  type: "deposit" | "withdrawal";
};

export type GoalWithSummary = Goal & {
  forecast_date: string | null;
  missing_amount: number;
  movements: GoalMovement[];
  progress_percent: number;
};

export type DebtInput = {
  creditor?: string | null;
  due_day: number;
  installment_amount: number;
  installments_count: number;
  monthly_interest_rate: number;
  name: string;
  original_amount: number;
  remaining_balance: number;
};

export type DebtPaymentInput = {
  account_id: string;
  amount: number;
  debt_id: string;
  notes?: string | null;
  payment_date: string;
};

export type DebtWithSummary = Debt & {
  high_interest: boolean;
  next_due_date: string;
  paid_amount: number;
  payments: DebtPayment[];
  progress_percent: number;
};

export type EmergencyReserveInput = {
  linked_goal_id?: string | null;
  target_months: number;
};

export type EmergencyReserveSummary = {
  current_amount: number;
  linked_goal?: Goal | null;
  monthly_expense_average: number;
  months_covered: number;
  progress_percent: number;
  recommended_amount: number;
  settings: EmergencyReserveSettings | null;
};

export type PlanningDashboardSummary = {
  debt_alerts: Array<{ description: string; title: string }>;
  emergency_reserve: EmergencyReserveSummary;
  top_goals: GoalWithSummary[];
  total_debt: number;
};

export type PlanningDataBundle = {
  accounts: Account[];
  debts: DebtWithSummary[];
  emergencyReserve: EmergencyReserveSummary;
  goals: GoalWithSummary[];
};
