import {
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  FileText,
  ReceiptText,
  Scale,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
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
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  LoadingState,
  Select,
} from "../components/ui";
import { useAuth } from "../context/auth/useAuth";
import {
  addMonths,
  getCurrentMonthValue,
  getMonthRange,
  getTodayValue,
} from "../lib/dates";
import { formatCurrency, formatDate } from "../lib/formatters";
import { buildReportSummary } from "../lib/insightRules";
import { getFinancialReport } from "../services/insightsService";
import {
  exportReportToExcel,
  exportReportToPdf,
} from "../services/reportExportService";
import type { FinancialReportData } from "../types/insights";

const chartColors = ["#0a84ff", "#30d158", "#ff9f0a", "#bf5af2", "#ff375f", "#64d2ff"];

function MoneyTooltip({ active, payload, label }: { active?: boolean; label?: string; payload?: Array<{ color?: string; name?: string; value?: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/95 p-3 text-sm shadow-float">
      {label && <p className="mb-2 font-medium text-white">{label}</p>}
      {payload.map((item) => (
        <p key={item.name} style={{ color: item.color ?? "white" }}>
          {item.name}: {formatCurrency(Number(item.value ?? 0))}
        </p>
      ))}
    </div>
  );
}

function getPresetRange(preset: "month" | "quarter" | "year" | "twelve") {
  const currentMonth = getCurrentMonthValue();
  const today = getTodayValue();
  if (preset === "month") return getMonthRange(currentMonth);
  if (preset === "quarter") {
    return {
      endDate: today,
      startDate: getMonthRange(addMonths(currentMonth, -2)).startDate,
    };
  }
  if (preset === "year") {
    return { endDate: today, startDate: `${today.slice(0, 4)}-01-01` };
  }
  return {
    endDate: today,
    startDate: getMonthRange(addMonths(currentMonth, -11)).startDate,
  };
}

export function ReportsPage() {
  const { user } = useAuth();
  const initialRange = getPresetRange("month");
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [data, setData] = useState<FinancialReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [message, setMessage] = useState("");

  const loadReport = useCallback(async () => {
    if (!user) return;
    if (startDate > endDate) {
      setMessage("A data inicial precisa ser anterior à data final.");
      return;
    }
    setIsLoading(true);
    setMessage("");
    try {
      setData(await getFinancialReport(user.id, startDate, endDate));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao carregar relatório.");
    } finally {
      setIsLoading(false);
    }
  }, [endDate, startDate, user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadReport(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadReport]);

  const filteredData = useMemo(() => {
    if (!data) return null;
    const transactions = data.transactions.filter(
      (transaction) =>
        (!accountId || transaction.account_id === accountId) &&
        (!categoryId || transaction.category_id === categoryId),
    );
    const summary = buildReportSummary(
      transactions,
      data.categories,
      data.startDate,
      data.endDate,
    );
    return { ...data, ...summary, transactions };
  }, [accountId, categoryId, data]);

  async function handleExport(type: "pdf" | "excel") {
    if (!filteredData) return;
    setExporting(type);
    setMessage("");
    try {
      if (type === "pdf") {
        await exportReportToPdf(filteredData);
      } else {
        await exportReportToExcel(filteredData);
      }
      setMessage(`Relatório ${type === "pdf" ? "PDF" : "Excel"} gerado com sucesso.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao gerar arquivo.");
    } finally {
      setExporting(null);
    }
  }

  function applyPreset(preset: "month" | "quarter" | "year" | "twelve") {
    const range = getPresetRange(preset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  }

  return (
    <PageFrame
      actions={
        <>
          <Button disabled={!filteredData || exporting !== null} icon={<FileText className="h-4 w-4" />} onClick={() => handleExport("pdf")} variant="secondary">
            {exporting === "pdf" ? "Gerando..." : "Exportar PDF"}
          </Button>
          <Button disabled={!filteredData || exporting !== null} icon={<FileSpreadsheet className="h-4 w-4" />} onClick={() => handleExport("excel")}>
            {exporting === "excel" ? "Gerando..." : "Exportar Excel"}
          </Button>
        </>
      }
      description="Analise receitas, despesas e categorias em qualquer período e gere arquivos prontos para guardar ou compartilhar."
      title="Relatórios"
    >
      {message && (
        <p className="rounded-lg border border-sky-300/20 bg-sky-300/10 p-3 text-sm text-sky-100" role="status">
          {message}
        </p>
      )}

      <Card tone="elevated">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button onClick={() => applyPreset("month")} size="sm" variant="ghost">Este mês</Button>
          <Button onClick={() => applyPreset("quarter")} size="sm" variant="ghost">Últimos 3 meses</Button>
          <Button onClick={() => applyPreset("year")} size="sm" variant="ghost">Este ano</Button>
          <Button onClick={() => applyPreset("twelve")} size="sm" variant="ghost">Últimos 12 meses</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          <Input label="Data inicial" onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
          <Input label="Data final" min={startDate} onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
          <Select label="Conta" onChange={(event) => setAccountId(event.target.value)} options={[{ label: "Todas", value: "" }, ...(data?.accounts ?? []).map((account) => ({ label: account.name, value: account.id }))]} value={accountId} />
          <Select label="Categoria" onChange={(event) => setCategoryId(event.target.value)} options={[{ label: "Todas", value: "" }, ...(data?.categories ?? []).map((category) => ({ label: category.name, value: category.id }))]} value={categoryId} />
          <div className="flex items-end">
            <Button isFullWidth onClick={loadReport} variant="secondary">Atualizar relatório</Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingState label="Montando relatório" />
      ) : filteredData ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card tone="elevated">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-400">Receitas</p>
                <ArrowUpRight className="h-5 w-5 text-emerald-300" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-emerald-300">{formatCurrency(filteredData.income)}</p>
            </Card>
            <Card tone="elevated">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-400">Despesas</p>
                <ArrowDownRight className="h-5 w-5 text-rose-300" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-rose-300">{formatCurrency(filteredData.expenses)}</p>
            </Card>
            <Card tone="elevated">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-400">Resultado</p>
                <Scale className="h-5 w-5 text-sky-300" />
              </div>
              <p className={`mt-3 text-2xl font-semibold ${filteredData.result >= 0 ? "text-sky-200" : "text-rose-300"}`}>{formatCurrency(filteredData.result)}</p>
            </Card>
            <Card tone="elevated">
              <p className="text-sm text-zinc-400">Taxa de economia</p>
              <p className={`mt-3 text-2xl font-semibold ${filteredData.savingsRate >= 0 ? "text-violet-200" : "text-rose-300"}`}>{filteredData.savingsRate.toFixed(1)}%</p>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <Card tone="elevated">
              <h2 className="text-lg font-semibold text-white">Evolução no período</h2>
              <p className="mt-1 text-sm text-zinc-400">Comparação mensal entre entradas e saídas.</p>
              <div className="mt-5 h-80">
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart data={filteredData.monthlyEvolution}>
                    <defs>
                      <linearGradient id="reportIncome" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#30d158" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#30d158" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="reportExpense" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#ff375f" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ff375f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="label" stroke="#a1a1aa" tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<MoneyTooltip />} />
                    <Legend />
                    <Area dataKey="income" fill="url(#reportIncome)" name="Receitas" stroke="#30d158" strokeWidth={3} type="monotone" />
                    <Area dataKey="expenses" fill="url(#reportExpense)" name="Despesas" stroke="#ff375f" strokeWidth={3} type="monotone" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card tone="elevated">
              <h2 className="text-lg font-semibold text-white">Despesas por categoria</h2>
              <p className="mt-1 text-sm text-zinc-400">Participação de cada categoria.</p>
              {filteredData.categoryExpenses.length === 0 ? (
                <div className="mt-5"><EmptyState description="Não há despesas no período selecionado." title="Sem dados" /></div>
              ) : (
                <>
                  <div className="mt-4 h-56">
                    <ResponsiveContainer height="100%" width="100%">
                      <PieChart>
                        <Pie data={filteredData.categoryExpenses} dataKey="total" innerRadius={48} nameKey="name" outerRadius={78} paddingAngle={3}>
                          {filteredData.categoryExpenses.map((category, index) => (
                            <Cell fill={category.color ?? chartColors[index % chartColors.length]} key={category.name} />
                          ))}
                        </Pie>
                        <Tooltip content={<MoneyTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {filteredData.categoryExpenses.slice(0, 5).map((category) => (
                      <div className="flex items-center justify-between gap-3 text-sm" key={category.name}>
                        <span className="truncate text-zinc-300">{category.name}</span>
                        <span className="shrink-0 font-medium text-white">{formatCurrency(category.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </section>

          {filteredData.transactions.length === 0 ? (
            <EmptyState description="Ajuste o período ou os filtros para localizar movimentações." icon={<ReceiptText className="h-6 w-6" />} title="Nenhuma movimentação encontrada" />
          ) : (
            <Card tone="elevated">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Movimentações</h2>
                  <p className="mt-1 text-sm text-zinc-400">{filteredData.transactions.length} registro{filteredData.transactions.length === 1 ? "" : "s"} no relatório.</p>
                </div>
                <Badge tone="blue">{formatDate(filteredData.startDate)} a {formatDate(filteredData.endDate)}</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-white/10 text-zinc-400">
                    <tr>
                      <th className="px-2 py-3 font-medium">Data</th>
                      <th className="px-2 py-3 font-medium">Descrição</th>
                      <th className="px-2 py-3 font-medium">Conta</th>
                      <th className="px-2 py-3 font-medium">Categoria</th>
                      <th className="px-2 py-3 text-right font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {filteredData.transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-2 py-3 text-zinc-400">{formatDate(transaction.transaction_date)}</td>
                        <td className="px-2 py-3 font-medium text-white">{transaction.title}</td>
                        <td className="px-2 py-3 text-zinc-300">{transaction.account?.name ?? "Conta"}</td>
                        <td className="px-2 py-3 text-zinc-300">{transaction.category?.name ?? "Sem categoria"}</td>
                        <td className={`px-2 py-3 text-right font-semibold ${transaction.type === "income" ? "text-emerald-300" : "text-rose-300"}`}>
                          {transaction.type === "income" ? "+" : "-"}{formatCurrency(Number(transaction.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      ) : null}
    </PageFrame>
  );
}
