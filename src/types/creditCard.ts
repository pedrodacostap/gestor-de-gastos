import type {
  Account,
  Category,
  CreditCard,
  CreditCardInstallment,
  CreditCardInvoicePayment,
  CreditCardPurchase,
  Transaction,
} from "./database";

export type CreditCardInput = {
  closing_day: number;
  color?: string | null;
  credit_limit: number;
  due_day: number;
  is_active: boolean;
  issuer?: string | null;
  name: string;
};

export type CreditCardPurchaseInput = {
  card_id: string;
  category_id?: string | null;
  description: string;
  installments_count: number;
  notes?: string | null;
  purchase_date: string;
  total_amount: number;
};

export type CreditCardWithSummary = CreditCard & {
  available_limit: number;
  open_invoice_total: number;
  pending_total: number;
  used_limit_percent: number;
};

export type CreditCardPurchaseWithRelations = CreditCardPurchase & {
  category?: Category | null;
  installments: CreditCardInstallment[];
};

export type InvoiceInstallment = CreditCardInstallment & {
  purchase?: CreditCardPurchase | null;
  category?: Category | null;
};

export type CreditCardInvoice = {
  due_date: string;
  installments: InvoiceInstallment[];
  is_paid: boolean;
  month: string;
  payment?: CreditCardInvoicePayment | null;
  status: "open" | "future" | "paid";
  total: number;
};

export type PayInvoiceInput = {
  account_id: string;
  card_id: string;
  invoice_month: string;
  paid_at: string;
  total: number;
};

export type CreditCardDashboardSummary = {
  limit_used: number;
  next_due_date: string | null;
  open_invoices_total: number;
  total_limit: number;
  used_limit_percent: number;
};

export type CreditCardDataBundle = {
  accounts: Account[];
  cards: CreditCardWithSummary[];
  categories: Category[];
  invoicesByCard: Record<string, CreditCardInvoice[]>;
  purchases: CreditCardPurchaseWithRelations[];
  transactions: Transaction[];
};
