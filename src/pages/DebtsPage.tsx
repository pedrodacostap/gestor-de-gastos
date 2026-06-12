import { AlertTriangle, Edit2, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageFrame } from "../components/layout/PageFrame";
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from "../components/ui";
import { getTodayValue } from "../lib/dates";
import { formatCurrency, formatDate } from "../lib/formatters";
import {
  createDebt,
  createDebtPayment,
  deleteDebt,
  listPlanningData,
  updateDebt,
} from "../services/planningService";
import { useAuth } from "../context/auth/useAuth";
import type { DebtInput, DebtPaymentInput, PlanningDataBundle } from "../types/planning";

const emptyDebt: DebtInput = {
  creditor: "",
  due_day: 10,
  installment_amount: 0,
  installments_count: 1,
  monthly_interest_rate: 0,
  name: "",
  original_amount: 0,
  remaining_balance: 0,
};

const emptyData: PlanningDataBundle = {
  accounts: [],
  debts: [],
  emergencyReserve: {
    current_amount: 0,
    linked_goal: null,
    monthly_expense_average: 0,
    months_covered: 0,
    progress_percent: 0,
    recommended_amount: 0,
    settings: null,
  },
  goals: [],
};

export function DebtsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PlanningDataBundle>(emptyData);
  const [debtForm, setDebtForm] = useState<DebtInput>(emptyDebt);
  const [paymentForm, setPaymentForm] = useState<DebtPaymentInput>({
    account_id: "",
    amount: 0,
    debt_id: "",
    payment_date: getTodayValue(),
  });
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [message, setMessage] = useState("");

  const totalDebt = data.debts.reduce(
    (sum, debt) => sum + Number(debt.remaining_balance),
    0,
  );

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setData(await listPlanningData(user.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao carregar dívidas.");
    }
  }, [user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  function openDebt(debtId?: string) {
    const debt = data.debts.find((item) => item.id === debtId);
    setEditingDebtId(debt?.id ?? null);
    setDebtForm(
      debt
        ? {
            creditor: debt.creditor ?? "",
            due_day: debt.due_day,
            installment_amount: Number(debt.installment_amount),
            installments_count: debt.installments_count,
            monthly_interest_rate: Number(debt.monthly_interest_rate),
            name: debt.name,
            original_amount: Number(debt.original_amount),
            remaining_balance: Number(debt.remaining_balance),
          }
        : emptyDebt,
    );
    setIsDebtModalOpen(true);
  }

  function openPayment(debtId: string) {
    const debt = data.debts.find((item) => item.id === debtId);
    setPaymentForm({
      account_id: data.accounts[0]?.id ?? "",
      amount: Number(debt?.installment_amount ?? 0),
      debt_id: debtId,
      payment_date: getTodayValue(),
    });
    setIsPaymentModalOpen(true);
  }

  async function handleDebtSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    try {
      if (editingDebtId) await updateDebt(editingDebtId, debtForm);
      else await createDebt(user.id, debtForm);
      setIsDebtModalOpen(false);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar dívida.");
    }
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    try {
      await createDebtPayment(user.id, paymentForm);
      setIsPaymentModalOpen(false);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao pagar dívida.");
    }
  }

  return (
    <PageFrame
      actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => openDebt()}>Nova dívida</Button>}
      description="Acompanhe dívidas, parcelas, juros e pagamentos parciais com impacto direto nas contas."
      title="Dívidas"
    >
      {message && <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">{message}</p>}

      <Card tone="elevated">
        <p className="text-sm text-zinc-400">Total em dívidas</p>
        <p className="mt-2 text-4xl font-semibold text-white">{formatCurrency(totalDebt)}</p>
      </Card>

      {data.debts.length === 0 ? (
        <EmptyState
          action={<Button onClick={() => openDebt()}>Criar dívida</Button>}
          description="Registre financiamentos, empréstimos ou parcelamentos para acompanhar a quitação."
          icon={<ShieldAlert className="h-6 w-6" />}
          title="Nenhuma dívida cadastrada"
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.debts.map((debt) => (
            <Card key={debt.id} tone="elevated">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={debt.high_interest ? "orange" : "blue"}>
                      {debt.high_interest ? "Juros altos" : "Em dia"}
                    </Badge>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-white">{debt.name}</h2>
                  <p className="text-sm text-zinc-400">{debt.creditor || "Sem credor"}</p>
                </div>
                <div className="flex gap-1">
                  <Button onClick={() => openDebt(debt.id)} size="sm" variant="ghost"><Edit2 className="h-4 w-4" /></Button>
                  <Button onClick={() => deleteDebt(debt.id).then(loadData)} size="sm" variant="ghost"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              {debt.high_interest && (
                <p className="mt-4 flex gap-2 rounded-lg bg-amber-400/10 p-3 text-sm text-amber-100">
                  <AlertTriangle className="h-4 w-4" />
                  Juros de {Number(debt.monthly_interest_rate).toFixed(2)}% ao mês.
                </p>
              )}
              <p className="mt-5 text-2xl font-semibold text-white">
                {formatCurrency(Number(debt.remaining_balance))}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Pago {formatCurrency(debt.paid_amount)} de {formatCurrency(Number(debt.original_amount))}
              </p>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-sky-300" style={{ width: `${debt.progress_percent}%` }} />
              </div>
              <p className="mt-3 text-sm text-zinc-400">
                Próxima parcela: {formatCurrency(Number(debt.installment_amount))} em {formatDate(debt.next_due_date)}
              </p>
              <Button className="mt-5" isFullWidth onClick={() => openPayment(debt.id)}>Pagar parcela</Button>
              {debt.payments.length > 0 && (
                <div className="mt-5 divide-y divide-white/10">
                  {debt.payments.slice(0, 3).map((payment) => (
                    <div className="flex justify-between py-2 text-sm" key={payment.id}>
                      <span className="text-zinc-400">{formatDate(payment.payment_date)}</span>
                      <span className="text-white">{formatCurrency(Number(payment.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </section>
      )}

      <Modal isOpen={isDebtModalOpen} onClose={() => setIsDebtModalOpen(false)} title={editingDebtId ? "Editar dívida" : "Nova dívida"}>
        <form className="space-y-4" onSubmit={handleDebtSubmit}>
          <Input label="Nome" required value={debtForm.name} onChange={(event) => setDebtForm((current) => ({ ...current, name: event.target.value }))} />
          <Input label="Credor" value={debtForm.creditor ?? ""} onChange={(event) => setDebtForm((current) => ({ ...current, creditor: event.target.value }))} />
          <Input label="Valor original" type="number" step="0.01" value={debtForm.original_amount} onChange={(event) => setDebtForm((current) => ({ ...current, original_amount: Number(event.target.value) }))} />
          <Input label="Saldo restante" type="number" step="0.01" value={debtForm.remaining_balance} onChange={(event) => setDebtForm((current) => ({ ...current, remaining_balance: Number(event.target.value) }))} />
          <Input label="Juros ao mês (%)" type="number" step="0.01" value={debtForm.monthly_interest_rate} onChange={(event) => setDebtForm((current) => ({ ...current, monthly_interest_rate: Number(event.target.value) }))} />
          <Input label="Valor da parcela" type="number" step="0.01" value={debtForm.installment_amount} onChange={(event) => setDebtForm((current) => ({ ...current, installment_amount: Number(event.target.value) }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Dia de vencimento" type="number" min="1" max="31" value={debtForm.due_day} onChange={(event) => setDebtForm((current) => ({ ...current, due_day: Number(event.target.value) }))} />
            <Input label="Quantidade de parcelas" type="number" min="1" value={debtForm.installments_count} onChange={(event) => setDebtForm((current) => ({ ...current, installments_count: Number(event.target.value) }))} />
          </div>
          <Button isFullWidth type="submit">Salvar dívida</Button>
        </form>
      </Modal>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Pagamento parcial">
        <form className="space-y-4" onSubmit={handlePaymentSubmit}>
          <Select label="Conta" options={data.accounts.map((account) => ({ label: account.name, value: account.id }))} value={paymentForm.account_id} onChange={(event) => setPaymentForm((current) => ({ ...current, account_id: event.target.value }))} />
          <Input label="Valor" type="number" step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm((current) => ({ ...current, amount: Number(event.target.value) }))} />
          <Input label="Data" type="date" value={paymentForm.payment_date} onChange={(event) => setPaymentForm((current) => ({ ...current, payment_date: event.target.value }))} />
          <Button disabled={!paymentForm.account_id} isFullWidth type="submit">Registrar pagamento</Button>
        </form>
      </Modal>
    </PageFrame>
  );
}
