import { Edit2, PiggyBank, Plus, Target, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageFrame } from "../components/layout/PageFrame";
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from "../components/ui";
import { getTodayValue } from "../lib/dates";
import { formatCurrency, formatDate } from "../lib/formatters";
import {
  createGoal,
  createGoalMovement,
  deleteGoal,
  listPlanningData,
  updateEmergencyReserveSettings,
  updateGoal,
} from "../services/planningService";
import { useAuth } from "../context/auth/useAuth";
import type { GoalInput, GoalMovementInput, PlanningDataBundle } from "../types/planning";

const colors = ["#0a84ff", "#30d158", "#ff9f0a", "#bf5af2", "#ff375f"];
const emptyGoal: GoalInput = {
  color: colors[0],
  current_amount: 0,
  icon: "🎯",
  name: "",
  target_amount: 0,
  target_date: "",
};

const emptyPlanning: PlanningDataBundle = {
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

export function GoalsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PlanningDataBundle>(emptyPlanning);
  const [goalForm, setGoalForm] = useState<GoalInput>(emptyGoal);
  const [movementForm, setMovementForm] = useState<GoalMovementInput>({
    amount: 0,
    goal_id: "",
    movement_date: getTodayValue(),
    type: "deposit",
  });
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setData(await listPlanningData(user.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao carregar metas.");
    }
  }, [user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  function openGoal(goalId?: string) {
    const goal = data.goals.find((item) => item.id === goalId);
    setEditingGoalId(goal?.id ?? null);
    setGoalForm(
      goal
        ? {
            color: goal.color ?? colors[0],
            current_amount: Number(goal.current_amount),
            icon: goal.icon ?? "🎯",
            name: goal.name,
            target_amount: Number(goal.target_amount),
            target_date: goal.target_date ?? "",
          }
        : emptyGoal,
    );
    setIsGoalModalOpen(true);
  }

  function openMovement(goalId: string, type: "deposit" | "withdrawal") {
    setMovementForm({
      amount: 0,
      goal_id: goalId,
      movement_date: getTodayValue(),
      type,
    });
    setIsMovementModalOpen(true);
  }

  async function handleGoalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    try {
      if (editingGoalId) await updateGoal(user.id, editingGoalId, goalForm);
      else await createGoal(user.id, goalForm);
      setIsGoalModalOpen(false);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar meta.");
    }
  }

  async function handleMovementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    try {
      await createGoalMovement(user.id, movementForm);
      setIsMovementModalOpen(false);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao movimentar meta.");
    }
  }

  async function handleReserveChange(targetMonths: number, goalId: string) {
    if (!user) return;
    try {
      await updateEmergencyReserveSettings(user.id, {
        linked_goal_id: goalId || null,
        target_months: targetMonths,
      });
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar reserva.");
    }
  }

  return (
    <PageFrame
      actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => openGoal()}>Nova meta</Button>}
      description="Planeje objetivos, acompanhe aportes, retiradas e configure sua reserva de emergência."
      title="Metas"
    >
      {message && <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">{message}</p>}

      <Card tone="elevated">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge tone="green">Reserva de emergência</Badge>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              {formatCurrency(data.emergencyReserve.current_amount)}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Recomendado: {formatCurrency(data.emergencyReserve.recommended_amount)} ·{" "}
              {data.emergencyReserve.months_covered.toFixed(1)} meses cobertos
            </p>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-emerald-300"
                style={{ width: `${Math.min(data.emergencyReserve.progress_percent, 100)}%` }}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Meta em meses"
              onChange={(event) =>
                handleReserveChange(Number(event.target.value), data.emergencyReserve.settings?.linked_goal_id ?? "")
              }
              options={[3, 6, 9, 12].map((value) => ({ label: `${value} meses`, value: String(value) }))}
              value={String(data.emergencyReserve.settings?.target_months ?? 6)}
            />
            <Select
              label="Meta vinculada"
              onChange={(event) =>
                handleReserveChange(data.emergencyReserve.settings?.target_months ?? 6, event.target.value)
              }
              options={[
                { label: "Nenhuma", value: "" },
                ...data.goals.map((goal) => ({ label: goal.name, value: goal.id })),
              ]}
              value={data.emergencyReserve.settings?.linked_goal_id ?? ""}
            />
          </div>
        </div>
      </Card>

      {data.goals.length === 0 ? (
        <EmptyState
          action={<Button onClick={() => openGoal()}>Criar meta</Button>}
          description="Crie uma meta para acompanhar progresso, aportes e retiradas."
          icon={<Target className="h-6 w-6" />}
          title="Nenhuma meta cadastrada"
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.goals.map((goal) => (
            <Card key={goal.id} tone="elevated">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-3xl">{goal.icon ?? "🎯"}</span>
                  <h2 className="mt-3 text-xl font-semibold text-white">{goal.name}</h2>
                </div>
                <div className="flex gap-1">
                  <Button onClick={() => openGoal(goal.id)} size="sm" variant="ghost"><Edit2 className="h-4 w-4" /></Button>
                  <Button onClick={() => user && deleteGoal(user.id, goal.id).then(loadData)} size="sm" variant="ghost"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <p className="mt-5 text-2xl font-semibold text-white">
                {formatCurrency(Number(goal.current_amount))}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Faltam {formatCurrency(goal.missing_amount)} de {formatCurrency(Number(goal.target_amount))}
              </p>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full" style={{ background: goal.color ?? "#0a84ff", width: `${goal.progress_percent}%` }} />
              </div>
              <p className="mt-3 text-sm text-zinc-400">
                Previsão: {goal.forecast_date ? formatDate(goal.forecast_date) : "sem aportes suficientes"}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button onClick={() => openMovement(goal.id, "deposit")} variant="secondary">Aportar</Button>
                <Button onClick={() => openMovement(goal.id, "withdrawal")} variant="ghost">Retirar</Button>
              </div>
              {goal.movements.length > 0 && (
                <div className="mt-5 divide-y divide-white/10">
                  {goal.movements.slice(0, 3).map((movement) => (
                    <div className="flex justify-between py-2 text-sm" key={movement.id}>
                      <span className="text-zinc-400">{movement.type === "deposit" ? "Aporte" : "Retirada"}</span>
                      <span className="text-white">{formatCurrency(Number(movement.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </section>
      )}

      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={editingGoalId ? "Editar meta" : "Nova meta"}>
        <form className="space-y-4" onSubmit={handleGoalSubmit}>
          <Input label="Nome" required value={goalForm.name} onChange={(event) => setGoalForm((current) => ({ ...current, name: event.target.value }))} />
          <Input label="Valor alvo" type="number" step="0.01" value={goalForm.target_amount} onChange={(event) => setGoalForm((current) => ({ ...current, target_amount: Number(event.target.value) }))} />
          <Input label="Valor atual" type="number" step="0.01" value={goalForm.current_amount} onChange={(event) => setGoalForm((current) => ({ ...current, current_amount: Number(event.target.value) }))} />
          <Input label="Data alvo" type="date" value={goalForm.target_date ?? ""} onChange={(event) => setGoalForm((current) => ({ ...current, target_date: event.target.value }))} />
          <Input label="Ícone/emoji" value={goalForm.icon ?? ""} onChange={(event) => setGoalForm((current) => ({ ...current, icon: event.target.value }))} />
          <Button isFullWidth type="submit">Salvar meta</Button>
        </form>
      </Modal>

      <Modal isOpen={isMovementModalOpen} onClose={() => setIsMovementModalOpen(false)} title={movementForm.type === "deposit" ? "Aportar" : "Retirar"}>
        <form className="space-y-4" onSubmit={handleMovementSubmit}>
          <Select label="Conta" options={[{ label: "Sem transação", value: "" }, ...data.accounts.map((account) => ({ label: account.name, value: account.id }))]} value={movementForm.account_id ?? ""} onChange={(event) => setMovementForm((current) => ({ ...current, account_id: event.target.value }))} />
          <Input label="Valor" type="number" step="0.01" value={movementForm.amount} onChange={(event) => setMovementForm((current) => ({ ...current, amount: Number(event.target.value) }))} />
          <Input label="Data" type="date" value={movementForm.movement_date} onChange={(event) => setMovementForm((current) => ({ ...current, movement_date: event.target.value }))} />
          <Button isFullWidth type="submit"><PiggyBank className="h-4 w-4" />Salvar movimento</Button>
        </form>
      </Modal>
    </PageFrame>
  );
}
