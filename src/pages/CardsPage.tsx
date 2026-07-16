import {
  CheckCircle2,
  CreditCard,
  Edit2,
  Plus,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { PageFrame } from "../components/layout/PageFrame";
import {
  Badge,
  Button,
  Card as UiCard,
  EmptyState,
  Input,
  Modal,
  Select,
} from "../components/ui";
import {
  createCreditCard,
  createCreditCardPurchase,
  deleteCreditCard,
  deleteCreditCardPurchase,
  listCreditCardData,
  payCreditCardInvoice,
  reverseCreditCardInvoicePayment,
  updateCreditCard,
  updateCreditCardPurchase,
} from "../services/creditCardService";
import { useAuth } from "../context/auth/useAuth";
import { getCurrentMonthValue, getTodayValue } from "../lib/dates";
import { formatCurrency, formatDate } from "../lib/formatters";
import type { CreditCard as CreditCardRow, CreditCardPurchase } from "../types/database";
import type {
  CreditCardDataBundle,
  CreditCardInput,
  CreditCardInvoice,
  CreditCardPurchaseInput,
  CreditCardPurchaseWithRelations,
  CreditCardWithSummary,
} from "../types/creditCard";

const colors = ["#0a84ff", "#30d158", "#ff9f0a", "#bf5af2", "#ff375f"];

const emptyCardForm: CreditCardInput = {
  closing_day: 5,
  color: colors[0],
  credit_limit: 0,
  due_day: 12,
  is_active: true,
  issuer: "",
  name: "",
};

function emptyPurchaseForm(cardId = ""): CreditCardPurchaseInput {
  return {
    card_id: cardId,
    category_id: "",
    description: "",
    installments_count: 1,
    notes: "",
    purchase_date: getTodayValue(),
    total_amount: 0,
  };
}

const emptyData: CreditCardDataBundle = {
  accounts: [],
  cards: [],
  categories: [],
  invoicesByCard: {},
  purchases: [],
  transactions: [],
};

function getInvoiceLabel(invoice: CreditCardInvoice) {
  const [year, month] = invoice.month.split("-");
  return `${month}/${year}`;
}

export function CardsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<CreditCardDataBundle>(emptyData);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [invoiceView, setInvoiceView] = useState<"current" | "future" | "history">(
    "current",
  );
  const [editingCard, setEditingCard] = useState<CreditCardWithSummary | null>(null);
  const [editingPurchase, setEditingPurchase] =
    useState<CreditCardPurchaseWithRelations | null>(null);
  const [cardForm, setCardForm] = useState<CreditCardInput>(emptyCardForm);
  const [purchaseForm, setPurchaseForm] = useState<CreditCardPurchaseInput>(
    emptyPurchaseForm(),
  );
  const [payInvoice, setPayInvoice] = useState<CreditCardInvoice | null>(null);
  const [payAccountId, setPayAccountId] = useState("");
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const selectedCard = useMemo(
    () => data.cards.find((card) => card.id === selectedCardId) ?? data.cards[0],
    [data.cards, selectedCardId],
  );
  const selectedInvoices = selectedCard
    ? data.invoicesByCard[selectedCard.id] ?? []
    : [];
  const currentMonth = getCurrentMonthValue();
  const currentInvoice =
    selectedInvoices.find((invoice) => invoice.month === currentMonth) ??
    selectedInvoices.find((invoice) => invoice.status === "open") ??
    selectedInvoices[0];
  const visibleInvoices = selectedInvoices.filter((invoice) => {
    if (invoiceView === "current") {
      return invoice.month === currentInvoice?.month;
    }

    if (invoiceView === "future") {
      return invoice.status === "future";
    }

    return invoice.status === "paid";
  });
  const cardPurchases = selectedCard
    ? data.purchases.filter((purchase) => purchase.card_id === selectedCard.id)
    : [];
  const expenseCategories = data.categories.filter(
    (category) => category.type === "expense",
  );

  const loadCards = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const nextData = await listCreditCardData(user.id);
      setData(nextData);
      setSelectedCardId((current) => current || nextData.cards[0]?.id || "");
      setPayAccountId((current) => current || nextData.accounts[0]?.id || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao carregar cartões.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadCards();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadCards]);

  function openCreateCard() {
    setEditingCard(null);
    setCardForm(emptyCardForm);
    setIsCardModalOpen(true);
  }

  function openEditCard(card: CreditCardWithSummary) {
    setEditingCard(card);
    setCardForm({
      closing_day: card.closing_day,
      color: card.color ?? colors[0],
      credit_limit: Number(card.credit_limit),
      due_day: card.due_day,
      is_active: card.is_active,
      issuer: card.issuer ?? "",
      name: card.name,
    });
    setIsCardModalOpen(true);
  }

  function openCreatePurchase(card?: CreditCardRow) {
    setEditingPurchase(null);
    setPurchaseForm(emptyPurchaseForm(card?.id ?? selectedCard?.id ?? ""));
    setIsPurchaseModalOpen(true);
  }

  function openEditPurchase(purchase: CreditCardPurchaseWithRelations) {
    setEditingPurchase(purchase);
    setPurchaseForm({
      card_id: purchase.card_id,
      category_id: purchase.category_id ?? "",
      description: purchase.description,
      installments_count: purchase.installments_count,
      notes: purchase.notes ?? "",
      purchase_date: purchase.purchase_date,
      total_amount: Number(purchase.total_amount),
    });
    setIsPurchaseModalOpen(true);
  }

  function openPayInvoice(invoice: CreditCardInvoice) {
    setPayInvoice(invoice);
    setPayAccountId(data.accounts[0]?.id ?? "");
    setIsPayModalOpen(true);
  }

  async function handleCardSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    try {
      if (editingCard) {
        await updateCreditCard(editingCard.id, cardForm);
      } else {
        await createCreditCard(user.id, cardForm);
      }

      setIsCardModalOpen(false);
      await loadCards();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar cartão.");
    }
  }

  async function handleDeleteCard(card: CreditCardWithSummary) {
    try {
      await deleteCreditCard(card.id);
      setSelectedCardId("");
      await loadCards();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao excluir cartão.");
    }
  }

  async function handlePurchaseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    try {
      if (editingPurchase) {
        await updateCreditCardPurchase(editingPurchase.id, user.id, purchaseForm);
      } else {
        await createCreditCardPurchase(user.id, purchaseForm);
      }

      setIsPurchaseModalOpen(false);
      await loadCards();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar compra.");
    }
  }

  async function handleDeletePurchase(purchase: CreditCardPurchase) {
    try {
      await deleteCreditCardPurchase(purchase.id);
      await loadCards();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao excluir compra.");
    }
  }

  async function handlePayInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !selectedCard || !payInvoice) {
      return;
    }

    try {
      await payCreditCardInvoice(user.id, {
        account_id: payAccountId,
        card_id: selectedCard.id,
        invoice_month: payInvoice.month,
        paid_at: new Date().toISOString(),
        total: payInvoice.total,
      });
      setIsPayModalOpen(false);
      setPayInvoice(null);
      await loadCards();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao pagar fatura.");
    }
  }

  async function handleReverseInvoicePayment(paymentId: string) {
    if (!window.confirm("Desfazer este pagamento e devolver o valor ao saldo da conta?")) {
      return;
    }

    try {
      await reverseCreditCardInvoicePayment(paymentId);
      await loadCards();
      setMessage("Pagamento desfeito. A fatura voltou a ficar aberta.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao desfazer pagamento.");
    }
  }

  return (
    <PageFrame
      actions={
        <>
          <Button onClick={openCreateCard} variant="secondary">
            Novo cartão
          </Button>
          <Button
            disabled={!selectedCard}
            icon={<Plus className="h-4 w-4" />}
            onClick={() => openCreatePurchase()}
          >
            Nova compra
          </Button>
        </>
      }
      description="Controle cartões de crédito, limite, compras parceladas e faturas sem afetar o saldo bancário até o pagamento."
      title="Cartões"
    >
      {message && (
        <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
          {message}
        </p>
      )}

      {isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <UiCard className="min-h-52 animate-pulse" key={index} tone="elevated" />
          ))}
        </section>
      ) : data.cards.length === 0 ? (
        <EmptyState
          action={<Button onClick={openCreateCard}>Criar primeiro cartão</Button>}
          description="Cadastre um cartão para controlar limite, compras à vista, parcelamentos e faturas."
          icon={<CreditCard className="h-6 w-6" />}
          title="Nenhum cartão cadastrado"
        />
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="grid gap-4">
              {data.cards.map((card) => (
                <button
                  className="text-left"
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  type="button"
                >
                  <UiCard
                    className={`overflow-hidden p-0 ${
                      selectedCard?.id === card.id ? "ring-2 ring-white/40" : ""
                    }`}
                    tone="glass"
                  >
                    <div
                      className="min-h-52 p-5 text-white"
                      style={{
                        background: `linear-gradient(135deg, ${card.color ?? "#0a84ff"}, #111113)`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-white/70">{card.issuer || "Emissor"}</p>
                          <h2 className="mt-2 text-2xl font-semibold">{card.name}</h2>
                        </div>
                        <Badge tone={card.is_active ? "green" : "neutral"}>
                          {card.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="mt-10">
                        <p className="text-sm text-white/70">Limite disponível</p>
                        <p className="mt-1 text-3xl font-semibold">
                          {formatCurrency(card.available_limit)}
                        </p>
                        <div className="mt-4 h-2 rounded-full bg-white/20">
                          <div
                            className="h-2 rounded-full bg-white"
                            style={{
                              width: `${Math.min(card.used_limit_percent, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-white/70">
                          {Math.round(card.used_limit_percent)}% usado de{" "}
                          {formatCurrency(Number(card.credit_limit))}
                        </p>
                      </div>
                    </div>
                  </UiCard>
                </button>
              ))}
            </div>

            {selectedCard && (
              <div className="space-y-4">
                <UiCard tone="elevated">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <Badge tone="blue">Detalhe do cartão</Badge>
                      <h2 className="mt-4 text-2xl font-semibold text-white">
                        {selectedCard.name}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-400">
                        Fecha dia {selectedCard.closing_day} · vence dia{" "}
                        {selectedCard.due_day}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => openEditCard(selectedCard)} variant="secondary">
                        <Edit2 className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button onClick={() => handleDeleteCard(selectedCard)} variant="ghost">
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </UiCard>

                <UiCard tone="elevated">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Faturas</h2>
                      <p className="text-sm text-zinc-400">
                        Atual, futuras e histórico de pagamentos.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Atual", value: "current" },
                        { label: "Futuras", value: "future" },
                        { label: "Histórico", value: "history" },
                      ].map((item) => (
                        <Button
                          key={item.value}
                          onClick={() =>
                            setInvoiceView(item.value as "current" | "future" | "history")
                          }
                          size="sm"
                          variant={invoiceView === item.value ? "primary" : "secondary"}
                        >
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {visibleInvoices.length === 0 ? (
                      <p className="rounded-lg border border-white/10 bg-white/8 p-4 text-sm text-zinc-300">
                        Nenhuma fatura para esta visão.
                      </p>
                    ) : (
                      visibleInvoices.map((invoice) => (
                        <div
                          className="rounded-lg border border-white/10 bg-white/6 p-4"
                          key={invoice.month}
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold text-white">
                                  Fatura {getInvoiceLabel(invoice)}
                                </h3>
                                <Badge tone={invoice.is_paid ? "green" : "orange"}>
                                  {invoice.is_paid ? "Paga" : "Aberta"}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-zinc-400">
                                Vencimento {formatDate(invoice.due_date)}
                              </p>
                            </div>
                            <div className="text-left md:text-right">
                              <p className="text-2xl font-semibold text-white">
                                {formatCurrency(invoice.total)}
                              </p>
                              {!invoice.is_paid && invoice.total > 0 && (
                                <Button
                                  className="mt-3"
                                  onClick={() => openPayInvoice(invoice)}
                                  size="sm"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Pagar fatura
                                </Button>
                              )}
                              {invoice.is_paid && invoice.payment && (
                                <Button
                                  className="mt-3"
                                  onClick={() => handleReverseInvoicePayment(invoice.payment!.id)}
                                  size="sm"
                                  variant="danger"
                                >
                                  Desfazer pagamento
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 divide-y divide-white/10">
                            {invoice.installments.length === 0 ? (
                              <p className="py-3 text-sm text-zinc-400">
                                Nenhuma parcela nesta fatura.
                              </p>
                            ) : (
                              invoice.installments.map((installment) => (
                                <div
                                  className="flex items-center justify-between gap-4 py-3"
                                  key={installment.id}
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-white">
                                      {installment.purchase?.description ?? "Compra"}
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-400">
                                      Parcela {installment.installment_number} ·{" "}
                                      {installment.category?.name ?? "Sem categoria"}
                                    </p>
                                  </div>
                                  <p className="shrink-0 text-sm font-semibold text-white">
                                    {formatCurrency(Number(installment.amount))}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </UiCard>
              </div>
            )}
          </section>

          {selectedCard && (
            <UiCard tone="elevated">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Compras do cartão</h2>
                  <p className="text-sm text-zinc-400">
                    Compras à vista e parceladas geram parcelas mensais.
                  </p>
                </div>
                <Button onClick={() => openCreatePurchase(selectedCard)}>
                  <Plus className="h-4 w-4" />
                  Nova compra
                </Button>
              </div>

              {cardPurchases.length === 0 ? (
                <EmptyState
                  description="Crie uma compra no crédito para gerar a fatura e acompanhar o limite."
                  icon={<ReceiptText className="h-6 w-6" />}
                  title="Nenhuma compra neste cartão"
                />
              ) : (
                <div className="grid gap-3">
                  {cardPurchases.map((purchase) => (
                    <div
                      className="rounded-lg border border-white/10 bg-white/6 p-4"
                      key={purchase.id}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{purchase.description}</h3>
                          <p className="mt-1 text-sm text-zinc-400">
                            {formatDate(purchase.purchase_date)} ·{" "}
                            {purchase.installments_count}x ·{" "}
                            {purchase.category?.name ?? "Sem categoria"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="mr-2 text-lg font-semibold text-white">
                            {formatCurrency(Number(purchase.total_amount))}
                          </p>
                          <Button onClick={() => openEditPurchase(purchase)} size="sm" variant="ghost">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => handleDeletePurchase(purchase)} size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </UiCard>
          )}
        </>
      )}

      <Modal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        title={editingCard ? "Editar cartão" : "Novo cartão"}
      >
        <form className="space-y-4" onSubmit={handleCardSubmit}>
          <Input
            label="Nome"
            onChange={(event) => setCardForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Black, Platinum, Mercado Pago..."
            required
            value={cardForm.name}
          />
          <Input
            label="Banco/emissor"
            onChange={(event) => setCardForm((current) => ({ ...current, issuer: event.target.value }))}
            placeholder="Nubank, Itaú, Inter..."
            value={cardForm.issuer ?? ""}
          />
          <Input
            label="Limite total"
            min="0"
            onChange={(event) =>
              setCardForm((current) => ({
                ...current,
                credit_limit: Number(event.target.value),
              }))
            }
            required
            step="0.01"
            type="number"
            value={cardForm.credit_limit}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Dia de fechamento"
              max="31"
              min="1"
              onChange={(event) =>
                setCardForm((current) => ({
                  ...current,
                  closing_day: Number(event.target.value),
                }))
              }
              required
              type="number"
              value={cardForm.closing_day}
            />
            <Input
              label="Dia de vencimento"
              max="31"
              min="1"
              onChange={(event) =>
                setCardForm((current) => ({
                  ...current,
                  due_day: Number(event.target.value),
                }))
              }
              required
              type="number"
              value={cardForm.due_day}
            />
          </div>
          <label className="flex items-center gap-3 text-sm font-medium text-zinc-200">
            <input
              checked={cardForm.is_active}
              className="h-5 w-5 accent-sky-400"
              onChange={(event) =>
                setCardForm((current) => ({
                  ...current,
                  is_active: event.target.checked,
                }))
              }
              type="checkbox"
            />
            Cartão ativo
          </label>
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Cor</p>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  aria-label={`Selecionar cor ${color}`}
                  className={`h-9 w-9 rounded-lg border ${
                    cardForm.color === color ? "border-white" : "border-white/10"
                  }`}
                  key={color}
                  onClick={() => setCardForm((current) => ({ ...current, color }))}
                  style={{ background: color }}
                  type="button"
                />
              ))}
            </div>
          </div>
          <Button isFullWidth type="submit">
            Salvar cartão
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title={editingPurchase ? "Editar compra" : "Nova compra no crédito"}
      >
        <form className="space-y-4" onSubmit={handlePurchaseSubmit}>
          <Select
            label="Cartão"
            onChange={(event) =>
              setPurchaseForm((current) => ({ ...current, card_id: event.target.value }))
            }
            options={data.cards.map((card) => ({ label: card.name, value: card.id }))}
            value={purchaseForm.card_id}
          />
          <Input
            label="Descrição"
            onChange={(event) =>
              setPurchaseForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Notebook, supermercado..."
            required
            value={purchaseForm.description}
          />
          <Input
            label="Valor total"
            min="0"
            onChange={(event) =>
              setPurchaseForm((current) => ({
                ...current,
                total_amount: Number(event.target.value),
              }))
            }
            required
            step="0.01"
            type="number"
            value={purchaseForm.total_amount}
          />
          <Select
            label="Categoria"
            onChange={(event) =>
              setPurchaseForm((current) => ({
                ...current,
                category_id: event.target.value,
              }))
            }
            options={[
              { label: "Sem categoria", value: "" },
              ...expenseCategories.map((category) => ({
                label: category.name,
                value: category.id,
              })),
            ]}
            value={purchaseForm.category_id ?? ""}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Data da compra"
              onChange={(event) =>
                setPurchaseForm((current) => ({
                  ...current,
                  purchase_date: event.target.value,
                }))
              }
              max={getTodayValue()}
              required
              type="date"
              value={purchaseForm.purchase_date}
            />
            <Input
              label="Parcelas"
              min="1"
              onChange={(event) =>
                setPurchaseForm((current) => ({
                  ...current,
                  installments_count: Number(event.target.value),
                }))
              }
              required
              type="number"
              value={purchaseForm.installments_count}
            />
          </div>
          <textarea
            className="min-h-24 w-full rounded-lg border border-white/10 bg-white/8 px-4 py-3 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20"
            onChange={(event) =>
              setPurchaseForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Observação"
            value={purchaseForm.notes ?? ""}
          />
          <Button isFullWidth type="submit">
            Salvar compra
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Pagar fatura"
      >
        <form className="space-y-4" onSubmit={handlePayInvoice}>
          <p className="rounded-lg border border-white/10 bg-white/8 p-4 text-sm text-zinc-200">
            O pagamento da fatura vai criar uma transação de despesa na conta
            escolhida e marcar as parcelas desta fatura como pagas.
          </p>
          <Select
            label="Conta de pagamento"
            onChange={(event) => setPayAccountId(event.target.value)}
            options={data.accounts.map((account) => ({
              label: account.name,
              value: account.id,
            }))}
            value={payAccountId}
          />
          <Button disabled={!payAccountId || !payInvoice?.total} isFullWidth type="submit">
            Pagar {payInvoice ? formatCurrency(payInvoice.total) : "fatura"}
          </Button>
        </form>
      </Modal>
    </PageFrame>
  );
}
