import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  PiggyBank,
  Plus,
  ReceiptText,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageFrame } from "../components/layout/PageFrame";
import { Badge, Button, Card, EmptyState } from "../components/ui";
import {
  getCurrentMonthValue,
  getMonthLabel,
  getPreviousMonthValue,
} from "../lib/dates";
import { formatCurrency, formatDate } from "../lib/formatters";
import { getDashboardData } from "../services/financeService";
import { useAuth } from "../context/auth/useAuth";
import type { DashboardData } from "../types/finance";

const emptyDashboard: DashboardData = {
  accountCount: 0,
  alerts: [],
  balanceTotal: 0,
  categoryExpenses: [],
  expensesMonth: 0,
  incomeMonth: 0,
  largestExpenses: [],
  monthlyEvolution: [],
  monthResult: 0,
  recentTransactions: [],
  savingsRate: 0,
  transactionCountMonth: 0,
};

const chartColors = ["#0a84ff", "#30d158", "#ff9f0a", "#bf5af2", "#ff375f"];

type MoneyTooltipPayload = {
  color?: string;
  dataKey?: string;
  name?: string;
  value?: number;
};

type BadgeTone = "blue" | "green" | "orange" | "pink" | "neutral";

function MoneyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: MoneyTooltipPayload[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/95 p-3 text-sm text-white shadow-float">
      {payload.map((item) => (
        <p key={item.dataKey ?? item.name} style={{ color: item.color }}>
          {item.name}: {formatCurrency(Number(item.value ?? 0))}
        </p>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card className="min-h-36 animate-pulse" key={index} tone="elevated">
            <div className="h-5 w-24 rounded bg-white/10" />
            <div className="mt-7 h-8 w-36 rounded bg-white/10" />
            <div className="mt-4 h-4 w-28 rounded bg-white/10" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="min-h-80 animate-pulse" tone="elevated" />
        <Card className="min-h-80 animate-pulse" tone="elevated" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(getCurrentMonthValue());
  const [data, setData] = useState<DashboardData>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const currentMonth = getCurrentMonthValue();
  const previousMonth = getPreviousMonthValue(currentMonth);

  const loadDashboard = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      setData(await getDashboardData(user.id, month));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao carregar dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, [month, user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadDashboard]);

  const cards = useMemo(
    () => [
      {
        helper: `${data.accountCount} contas`,
        icon: Landmark,
        label: "Saldo total",
        tone: "blue" as BadgeTone,
        value: formatCurrency(data.balanceTotal),
      },
      {
        helper: "Entradas no período",
        icon: ArrowUpRight,
        label: "Receitas do mês",
        tone: "green" as BadgeTone,
        value: formatCurrency(data.incomeMonth),
      },
      {
        helper: "Saídas no período",
        icon: ArrowDownRight,
        label: "Despesas do mês",
        tone: "pink" as BadgeTone,
        value: formatCurrency(data.expensesMonth),
      },
      {
        helper: data.monthResult >= 0 ? "Superávit mensal" : "Déficit mensal",
        icon: TrendingUp,
        label: "Resultado do mês",
        tone: (data.monthResult >= 0 ? "green" : "orange") as BadgeTone,
        value: formatCurrency(data.monthResult),
      },
      {
        helper: "Resultado sobre receitas",
        icon: PiggyBank,
        label: "Taxa de economia",
        tone: (data.savingsRate >= 0 ? "green" : "orange") as BadgeTone,
        value: `${Math.round(data.savingsRate)}%`,
      },
    ],
    [data],
  );

  return (
    <PageFrame
      actions={
        <Link to="/transacoes">
          <Button icon={<Plus className="h-4 w-4" />}>Nova transação</Button>
        </Link>
      }
      description="Acompanhe saldo, fluxo do mês, evolução recente e alertas simples a partir dos seus dados reais."
      title="Dashboard"
    >
      {message && (
        <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
          {message}
        </p>
      )}

      <Card className="p-3 md:p-4" tone="elevated">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              onClick={() => setMonth(currentMonth)}
              variant={month === currentMonth ? "primary" : "secondary"}
            >
              Mês atual
            </Button>
            <Button
              onClick={() => setMonth(previousMonth)}
              variant={month === previousMonth ? "primary" : "secondary"}
            >
              Mês anterior
            </Button>
          </div>
          <label className="block text-sm font-medium text-zinc-200">
            Mês e ano
            <input
              className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/8 px-4 text-base text-white outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 md:w-56"
              onChange={(event) => setMonth(event.target.value)}
              type="month"
              value={month}
            />
          </label>
        </div>
      </Card>

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <Card key={card.label} tone="elevated">
                  <div className="flex items-center justify-between gap-4">
                    <Badge tone={card.tone}>{card.label}</Badge>
                    <Icon className="h-5 w-5 text-zinc-300" />
                  </div>
                  <p className="mt-5 text-3xl font-semibold text-white">
                    {card.value}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">{card.helper}</p>
                </Card>
              );
            })}
          </section>

          {data.alerts.length > 0 && (
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.alerts.map((alert) => (
                <Card
                  className={`border ${
                    alert.tone === "danger"
                      ? "border-rose-300/30 bg-rose-400/10"
                      : alert.tone === "warning"
                        ? "border-amber-300/30 bg-amber-400/10"
                        : "border-sky-300/30 bg-sky-400/10"
                  }`}
                  key={alert.title}
                  tone="glass"
                >
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-white" />
                    <div>
                      <h2 className="font-semibold text-white">{alert.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-zinc-200">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </section>
          )}

          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="min-h-96" tone="elevated">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">
                  Evolução mensal
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Receitas x despesas nos últimos seis meses.
                </p>
              </div>

              <div className="h-72">
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart data={data.monthlyEvolution}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#30d158" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#30d158" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#ff375f" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#ff375f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="label" stroke="#a1a1aa" tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<MoneyTooltip />} />
                    <Legend />
                    <Area
                      dataKey="income"
                      fill="url(#incomeGradient)"
                      name="Receitas"
                      stroke="#30d158"
                      strokeWidth={3}
                      type="monotone"
                    />
                    <Area
                      dataKey="expenses"
                      fill="url(#expenseGradient)"
                      name="Despesas"
                      stroke="#ff375f"
                      strokeWidth={3}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="min-h-96" tone="elevated">
              <h2 className="text-lg font-semibold text-white">Gastos por categoria</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Distribuição das despesas em {getMonthLabel(month)}.
              </p>

              {data.categoryExpenses.length === 0 ? (
                <EmptyState
                  description="Nenhuma despesa registrada para compor o gráfico."
                  title="Sem gastos por categoria"
                />
              ) : (
                <div className="mt-5 h-72">
                  <ResponsiveContainer height="100%" width="100%">
                    <PieChart>
                      <Pie
                        cx="50%"
                        cy="50%"
                        data={data.categoryExpenses}
                        dataKey="total"
                        innerRadius={58}
                        nameKey="name"
                        outerRadius={94}
                        paddingAngle={3}
                      >
                        {data.categoryExpenses.map((category, index) => (
                          <Cell
                            fill={category.color ?? chartColors[index % chartColors.length]}
                            key={category.name}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<MoneyTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <Card tone="elevated">
              <h2 className="text-lg font-semibold text-white">Ranking de maiores despesas</h2>
              <p className="mt-1 text-sm text-zinc-400">
                As maiores saídas do mês selecionado.
              </p>

              {data.largestExpenses.length === 0 ? (
                <p className="mt-8 rounded-lg border border-white/10 bg-white/8 p-4 text-sm text-zinc-300">
                  Nenhuma despesa registrada neste mês.
                </p>
              ) : (
                <div className="mt-5 h-72">
                  <ResponsiveContainer height="100%" width="100%">
                    <BarChart data={data.largestExpenses} layout="vertical">
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                      <XAxis hide type="number" />
                      <YAxis
                        dataKey="title"
                        stroke="#a1a1aa"
                        tickLine={false}
                        type="category"
                        width={92}
                      />
                      <Tooltip content={<MoneyTooltip />} />
                      <Bar dataKey="amount" fill="#ff9f0a" name="Despesa" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card tone="elevated">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Últimas transações
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {data.transactionCountMonth} movimentações no mês.
                  </p>
                </div>
                <ReceiptText className="h-5 w-5 text-sky-300" />
              </div>

              {data.recentTransactions.length === 0 ? (
                <EmptyState
                  description="Crie uma receita ou despesa para acompanhar a movimentação do mês."
                  title="Sem transações recentes"
                />
              ) : (
                <div className="divide-y divide-white/10">
                  {data.recentTransactions.map((transaction) => (
                    <div
                      className="flex items-center justify-between gap-4 py-3"
                      key={transaction.id}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">
                          {transaction.title}
                        </p>
                        <p className="mt-1 text-sm text-zinc-400">
                          {formatDate(transaction.transaction_date)} ·{" "}
                          {transaction.category?.name ?? "Sem categoria"}
                        </p>
                      </div>
                      <p
                        className={`shrink-0 font-semibold ${
                          transaction.type === "income"
                            ? "text-emerald-300"
                            : "text-rose-300"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(Number(transaction.amount))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>
        </>
      )}
    </PageFrame>
  );
}
