import {
  addMonths,
  getCurrentMonthValue,
  getInvoiceDueDate,
  getInvoiceMonth,
  getInvoiceMonthDate,
} from "../lib/dates";
import { supabase } from "../lib/supabase/client";
import type {
  Category,
  CreditCard,
  CreditCardInstallment,
  CreditCardInvoicePayment,
  CreditCardPurchase,
} from "../types/database";
import type {
  CreditCardDashboardSummary,
  CreditCardDataBundle,
  CreditCardInput,
  CreditCardInvoice,
  CreditCardPurchaseInput,
  CreditCardPurchaseWithRelations,
  CreditCardWithSummary,
  InvoiceInstallment,
  PayInvoiceInput,
} from "../types/creditCard";

function assertNoError(error: unknown) {
  if (!error) {
    return;
  }

  if (error instanceof Error) {
    throw error;
  }

  if (typeof error === "object" && "message" in error) {
    throw new Error(String(error.message));
  }

  throw new Error("Não foi possível concluir a operação.");
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeMonth(monthDate: string) {
  return monthDate.slice(0, 7);
}

function buildInstallments(
  userId: string,
  purchaseId: string,
  input: CreditCardPurchaseInput,
  card: Pick<CreditCard, "closing_day">,
) {
  const count = Math.max(1, input.installments_count);
  const baseAmount = roundMoney(input.total_amount / count);
  const firstMonth = getInvoiceMonth(input.purchase_date, card.closing_day);

  return Array.from({ length: count }, (_, index) => {
    const amount =
      index === count - 1
        ? roundMoney(input.total_amount - baseAmount * (count - 1))
        : baseAmount;

    return {
      amount,
      card_id: input.card_id,
      competence_month: getInvoiceMonthDate(addMonths(firstMonth, index)),
      installment_number: index + 1,
      purchase_id: purchaseId,
      status: "pending" as const,
      user_id: userId,
    };
  });
}

function attachPurchaseRelations(
  purchases: CreditCardPurchase[],
  installments: CreditCardInstallment[],
  categories: Category[],
): CreditCardPurchaseWithRelations[] {
  return purchases.map((purchase) => ({
    ...purchase,
    category:
      categories.find((category) => category.id === purchase.category_id) ?? null,
    installments: installments.filter(
      (installment) => installment.purchase_id === purchase.id,
    ),
  }));
}

function buildInvoices(
  card: CreditCard,
  purchases: CreditCardPurchase[],
  installments: CreditCardInstallment[],
  categories: Category[],
  payments: CreditCardInvoicePayment[],
) {
  const months = new Set<string>();
  const currentMonth = getCurrentMonthValue();

  months.add(currentMonth);
  for (let index = 1; index <= 6; index += 1) {
    months.add(addMonths(currentMonth, index));
  }

  installments
    .filter((installment) => installment.card_id === card.id)
    .forEach((installment) => months.add(normalizeMonth(installment.competence_month)));

  payments
    .filter((payment) => payment.card_id === card.id)
    .forEach((payment) => months.add(normalizeMonth(payment.invoice_month)));

  return Array.from(months)
    .sort()
    .map<CreditCardInvoice>((month) => {
      const invoiceInstallments = installments
        .filter(
          (installment) =>
            installment.card_id === card.id &&
            normalizeMonth(installment.competence_month) === month,
        )
        .map<InvoiceInstallment>((installment) => {
          const purchase =
            purchases.find((item) => item.id === installment.purchase_id) ?? null;

          return {
            ...installment,
            category:
              categories.find((category) => category.id === purchase?.category_id) ??
              null,
            purchase,
          };
        });

      const payment =
        payments.find(
          (item) =>
            item.card_id === card.id && normalizeMonth(item.invoice_month) === month,
        ) ?? null;
      const total = invoiceInstallments.reduce(
        (sum, installment) => sum + Number(installment.amount),
        0,
      );
      const isPaid = Boolean(payment);

      return {
        due_date: getInvoiceDueDate(month, card.due_day),
        installments: invoiceInstallments,
        is_paid: isPaid,
        month,
        payment,
        status: isPaid ? "paid" : month > currentMonth ? "future" : "open",
        total,
      };
    });
}

function summarizeCards(
  cards: CreditCard[],
  installments: CreditCardInstallment[],
): CreditCardWithSummary[] {
  const currentMonth = getCurrentMonthValue();

  return cards.map((card) => {
    const cardInstallments = installments.filter(
      (installment) => installment.card_id === card.id,
    );
    const pendingTotal = cardInstallments
      .filter((installment) => installment.status !== "paid")
      .reduce((sum, installment) => sum + Number(installment.amount), 0);
    const openInvoiceTotal = cardInstallments
      .filter(
        (installment) =>
          installment.status !== "paid" &&
          normalizeMonth(installment.competence_month) <= currentMonth,
      )
      .reduce((sum, installment) => sum + Number(installment.amount), 0);
    const creditLimit = Number(card.credit_limit);

    return {
      ...card,
      available_limit: creditLimit - pendingTotal,
      open_invoice_total: openInvoiceTotal,
      pending_total: pendingTotal,
      used_limit_percent: creditLimit > 0 ? (pendingTotal / creditLimit) * 100 : 0,
    };
  });
}

export async function listCreditCardData(userId: string): Promise<CreditCardDataBundle> {
  const [
    { data: cards, error: cardsError },
    { data: purchases, error: purchasesError },
    { data: installments, error: installmentsError },
    { data: payments, error: paymentsError },
    { data: categories, error: categoriesError },
    { data: accounts, error: accountsError },
    { data: transactions, error: transactionsError },
  ] = await Promise.all([
    supabase.from("credit_cards").select("*").eq("user_id", userId).order("created_at"),
    supabase
      .from("credit_card_purchases")
      .select("*")
      .eq("user_id", userId)
      .order("purchase_date", { ascending: false }),
    supabase.from("credit_card_installments").select("*").eq("user_id", userId),
    supabase
      .from("credit_card_invoice_payments")
      .select("*")
      .eq("user_id", userId),
    supabase.from("categories").select("*").eq("user_id", userId),
    supabase.from("accounts").select("*").eq("user_id", userId),
    supabase.from("transactions").select("*").eq("user_id", userId),
  ]);

  assertNoError(cardsError);
  assertNoError(purchasesError);
  assertNoError(installmentsError);
  assertNoError(paymentsError);
  assertNoError(categoriesError);
  assertNoError(accountsError);
  assertNoError(transactionsError);

  const safeCards = cards ?? [];
  const safePurchases = purchases ?? [];
  const safeInstallments = installments ?? [];
  const safePayments = payments ?? [];
  const safeCategories = categories ?? [];

  return {
    accounts: accounts ?? [],
    cards: summarizeCards(safeCards, safeInstallments),
    categories: safeCategories,
    invoicesByCard: safeCards.reduce<Record<string, CreditCardInvoice[]>>(
      (invoices, card) => ({
        ...invoices,
        [card.id]: buildInvoices(
          card,
          safePurchases,
          safeInstallments,
          safeCategories,
          safePayments,
        ),
      }),
      {},
    ),
    purchases: attachPurchaseRelations(safePurchases, safeInstallments, safeCategories),
    transactions: transactions ?? [],
  };
}

export async function createCreditCard(userId: string, input: CreditCardInput) {
  const { error } = await supabase.from("credit_cards").insert({
    ...input,
    color: input.color || null,
    issuer: input.issuer || null,
    user_id: userId,
  });

  assertNoError(error);
}

export async function updateCreditCard(cardId: string, input: CreditCardInput) {
  const { error } = await supabase
    .from("credit_cards")
    .update({
      ...input,
      color: input.color || null,
      issuer: input.issuer || null,
    })
    .eq("id", cardId);

  assertNoError(error);
}

export async function deleteCreditCard(cardId: string) {
  const { count, error: countError } = await supabase
    .from("credit_card_purchases")
    .select("id", { count: "exact", head: true })
    .eq("card_id", cardId);

  assertNoError(countError);

  if ((count ?? 0) > 0) {
    throw new Error("Exclua as compras vinculadas antes de remover este cartão.");
  }

  const { error } = await supabase.from("credit_cards").delete().eq("id", cardId);
  assertNoError(error);
}

export async function createCreditCardPurchase(
  userId: string,
  input: CreditCardPurchaseInput,
) {
  const { data: card, error: cardError } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("id", input.card_id)
    .single();

  assertNoError(cardError);

  const { data: purchase, error } = await supabase
    .from("credit_card_purchases")
    .insert({
      ...input,
      category_id: input.category_id || null,
      notes: input.notes || null,
      user_id: userId,
    })
    .select("*")
    .single();

  assertNoError(error);

  if (!purchase || !card) {
    throw new Error("Não foi possível criar a compra.");
  }

  const { error: installmentError } = await supabase
    .from("credit_card_installments")
    .insert(buildInstallments(userId, purchase.id, input, card));

  assertNoError(installmentError);
}

export async function updateCreditCardPurchase(
  purchaseId: string,
  userId: string,
  input: CreditCardPurchaseInput,
) {
  const { data: existingInstallments, error: installmentReadError } = await supabase
    .from("credit_card_installments")
    .select("*")
    .eq("purchase_id", purchaseId);

  assertNoError(installmentReadError);

  if ((existingInstallments ?? []).some((installment) => installment.status === "paid")) {
    throw new Error("Esta compra tem parcelas pagas. Exclua o pagamento antes de editar.");
  }

  const { data: card, error: cardError } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("id", input.card_id)
    .single();

  assertNoError(cardError);

  const { error } = await supabase
    .from("credit_card_purchases")
    .update({
      ...input,
      category_id: input.category_id || null,
      notes: input.notes || null,
    })
    .eq("id", purchaseId);

  assertNoError(error);

  const { error: deleteInstallmentsError } = await supabase
    .from("credit_card_installments")
    .delete()
    .eq("purchase_id", purchaseId);

  assertNoError(deleteInstallmentsError);

  if (!card) {
    throw new Error("Cartão não encontrado.");
  }

  const { error: insertInstallmentsError } = await supabase
    .from("credit_card_installments")
    .insert(buildInstallments(userId, purchaseId, input, card));

  assertNoError(insertInstallmentsError);
}

export async function deleteCreditCardPurchase(purchaseId: string) {
  const { data: installments, error: installmentReadError } = await supabase
    .from("credit_card_installments")
    .select("*")
    .eq("purchase_id", purchaseId);

  assertNoError(installmentReadError);

  if ((installments ?? []).some((installment) => installment.status === "paid")) {
    throw new Error("Esta compra tem parcelas pagas. Remova o pagamento antes de excluir.");
  }

  const { error } = await supabase
    .from("credit_card_purchases")
    .delete()
    .eq("id", purchaseId);

  assertNoError(error);
}

export async function payCreditCardInvoice(userId: string, input: PayInvoiceInput) {
  const { data: existingPayment, error: existingPaymentError } = await supabase
    .from("credit_card_invoice_payments")
    .select("*")
    .eq("card_id", input.card_id)
    .eq("invoice_month", getInvoiceMonthDate(input.invoice_month))
    .maybeSingle();

  assertNoError(existingPaymentError);

  if (existingPayment) {
    throw new Error("Esta fatura já foi paga.");
  }

  const { data: card, error: cardError } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("id", input.card_id)
    .single();

  assertNoError(cardError);

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .insert({
      account_id: input.account_id,
      amount: input.total,
      category_id: null,
      notes: `Pagamento da fatura ${input.invoice_month}`,
      payment_method: "credit_card_invoice",
      title: `Fatura ${card?.name ?? "cartão"} ${input.invoice_month}`,
      transaction_date: input.paid_at.slice(0, 10),
      type: "expense",
      user_id: userId,
    })
    .select("*")
    .single();

  assertNoError(transactionError);

  const { error: paymentError } = await supabase
    .from("credit_card_invoice_payments")
    .insert({
      account_id: input.account_id,
      amount: input.total,
      card_id: input.card_id,
      invoice_month: getInvoiceMonthDate(input.invoice_month),
      paid_at: input.paid_at,
      transaction_id: transaction?.id ?? null,
      user_id: userId,
    });

  assertNoError(paymentError);

  const { error: installmentsError } = await supabase
    .from("credit_card_installments")
    .update({ status: "paid" })
    .eq("card_id", input.card_id)
    .eq("competence_month", getInvoiceMonthDate(input.invoice_month));

  assertNoError(installmentsError);
}

export async function getCreditCardDashboardSummary(
  userId: string,
): Promise<CreditCardDashboardSummary> {
  const { data, error } = await supabase
    .from("credit_card_installments")
    .select("*, credit_cards!inner(user_id, credit_limit, due_day)")
    .eq("user_id", userId);

  assertNoError(error);

  const installments = (data ?? []) as Array<
    CreditCardInstallment & {
      credit_cards?: Pick<CreditCard, "credit_limit" | "due_day" | "user_id">;
    }
  >;
  const pending = installments.filter((installment) => installment.status !== "paid");
  const currentMonth = getCurrentMonthValue();
  const openInvoicesTotal = pending
    .filter((installment) => normalizeMonth(installment.competence_month) <= currentMonth)
    .reduce((sum, installment) => sum + Number(installment.amount), 0);
  const limitUsed = pending.reduce(
    (sum, installment) => sum + Number(installment.amount),
    0,
  );
  const totalLimit = Array.from(
    new Map(
      installments
        .filter((installment) => installment.credit_cards)
        .map((installment) => [
          installment.card_id,
          Number(installment.credit_cards?.credit_limit ?? 0),
        ]),
    ).values(),
  ).reduce((sum, value) => sum + value, 0);
  const nextInstallment = pending
    .slice()
    .sort((a, b) => a.competence_month.localeCompare(b.competence_month))[0];
  const nextDueDate =
    nextInstallment && nextInstallment.credit_cards
      ? getInvoiceDueDate(
          normalizeMonth(nextInstallment.competence_month),
          nextInstallment.credit_cards.due_day,
        )
      : null;

  return {
    limit_used: limitUsed,
    next_due_date: nextDueDate,
    open_invoices_total: openInvoicesTotal,
    total_limit: totalLimit,
    used_limit_percent: totalLimit > 0 ? (limitUsed / totalLimit) * 100 : 0,
  };
}
