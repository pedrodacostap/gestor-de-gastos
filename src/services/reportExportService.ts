import type { Cell, SheetData } from "write-excel-file/browser";
import { formatCurrency, formatDate } from "../lib/formatters";
import type { FinancialReportData } from "../types/insights";

const headerCell = (value: string): Cell => ({
  backgroundColor: "#0a84ff",
  fontWeight: "bold",
  textColor: "#ffffff",
  value,
});

const moneyCell = (value: number): Cell => ({
  format: "R$ #,##0.00",
  type: Number,
  value,
});

function reportFileName(extension: "pdf" | "xlsx", data: FinancialReportData) {
  return `relatorio-financeiro-${data.startDate}-a-${data.endDate}.${extension}`;
}

export async function exportReportToExcel(data: FinancialReportData) {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const summary: SheetData = [
    [headerCell("Relatório financeiro"), null],
    ["Período", `${formatDate(data.startDate)} a ${formatDate(data.endDate)}`],
    ["Receitas", moneyCell(data.income)],
    ["Despesas", moneyCell(data.expenses)],
    ["Resultado", moneyCell(data.result)],
    ["Taxa de economia", `${data.savingsRate.toFixed(1)}%`],
    [],
    [headerCell("Evolução mensal"), headerCell("Receitas"), headerCell("Despesas"), headerCell("Resultado")],
    ...data.monthlyEvolution.map((month) => [
      month.label,
      moneyCell(month.income),
      moneyCell(month.expenses),
      moneyCell(month.result),
    ]),
    [],
    [headerCell("Despesas por categoria"), headerCell("Total"), headerCell("Participação")],
    ...data.categoryExpenses.map((category) => [
      category.name,
      moneyCell(category.total),
      `${category.percent.toFixed(1)}%`,
    ]),
  ];
  const transactions: SheetData = [
    [
      headerCell("Data"),
      headerCell("Descrição"),
      headerCell("Tipo"),
      headerCell("Conta"),
      headerCell("Categoria"),
      headerCell("Valor"),
      headerCell("Observações"),
    ],
    ...data.transactions.map((transaction) => [
      formatDate(transaction.transaction_date),
      transaction.title,
      transaction.type === "income" ? "Receita" : "Despesa",
      transaction.account?.name ?? "Conta",
      transaction.category?.name ?? "Sem categoria",
      moneyCell(Number(transaction.amount)),
      transaction.notes ?? "",
    ]),
  ];

  await writeExcelFile([
    {
      columns: [{ width: 28 }, { width: 20 }, { width: 18 }, { width: 18 }],
      data: summary,
      sheet: "Resumo",
    },
    {
      columns: [
        { width: 14 },
        { width: 34 },
        { width: 14 },
        { width: 24 },
        { width: 24 },
        { width: 18 },
        { width: 42 },
      ],
      data: transactions,
      sheet: "Transações",
    },
  ]).toFile(reportFileName("xlsx", data));
}

export async function exportReportToPdf(data: FinancialReportData) {
  const { jsPDF } = await import("jspdf");
  const document = new jsPDF({ format: "a4", unit: "mm" });
  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();
  const margin = 14;
  let y = 18;

  function addPageIfNeeded(height: number) {
    if (y + height <= pageHeight - margin) return;
    document.addPage();
    y = 18;
  }

  document.setFillColor(10, 132, 255);
  document.roundedRect(margin, y, pageWidth - margin * 2, 28, 3, 3, "F");
  document.setTextColor(255, 255, 255);
  document.setFont("helvetica", "bold");
  document.setFontSize(18);
  document.text("Gestor de Gastos", margin + 6, y + 11);
  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  document.text(
    `Relatório de ${formatDate(data.startDate)} a ${formatDate(data.endDate)}`,
    margin + 6,
    y + 20,
  );
  y += 36;

  const cardWidth = (pageWidth - margin * 2 - 6) / 2;
  const summaries = [
    ["Receitas", formatCurrency(data.income), [16, 185, 129]],
    ["Despesas", formatCurrency(data.expenses), [244, 63, 94]],
    ["Resultado", formatCurrency(data.result), data.result >= 0 ? [10, 132, 255] : [244, 63, 94]],
    ["Taxa de economia", `${data.savingsRate.toFixed(1)}%`, [124, 58, 237]],
  ] as const;

  summaries.forEach(([label, value, color], index) => {
    const x = margin + (index % 2) * (cardWidth + 6);
    const cardY = y + Math.floor(index / 2) * 24;
    document.setFillColor(245, 247, 250);
    document.roundedRect(x, cardY, cardWidth, 19, 2, 2, "F");
    document.setTextColor(82, 82, 91);
    document.setFont("helvetica", "normal");
    document.setFontSize(9);
    document.text(label, x + 4, cardY + 6);
    document.setTextColor(color[0], color[1], color[2]);
    document.setFont("helvetica", "bold");
    document.setFontSize(13);
    document.text(value, x + 4, cardY + 14);
  });
  y += 54;

  document.setTextColor(24, 24, 27);
  document.setFont("helvetica", "bold");
  document.setFontSize(13);
  document.text("Despesas por categoria", margin, y);
  y += 7;

  if (data.categoryExpenses.length === 0) {
    document.setFont("helvetica", "normal");
    document.setFontSize(10);
    document.setTextColor(82, 82, 91);
    document.text("Nenhuma despesa no período.", margin, y);
    y += 9;
  } else {
    data.categoryExpenses.slice(0, 8).forEach((category) => {
      addPageIfNeeded(8);
      document.setFont("helvetica", "normal");
      document.setFontSize(10);
      document.setTextColor(39, 39, 42);
      document.text(category.name, margin, y);
      document.text(
        `${formatCurrency(category.total)} (${category.percent.toFixed(1)}%)`,
        pageWidth - margin,
        y,
        { align: "right" },
      );
      y += 7;
    });
  }

  y += 5;
  addPageIfNeeded(18);
  document.setFont("helvetica", "bold");
  document.setFontSize(13);
  document.setTextColor(24, 24, 27);
  document.text("Movimentações", margin, y);
  y += 8;

  data.transactions.forEach((transaction) => {
    addPageIfNeeded(15);
    document.setFont("helvetica", "bold");
    document.setFontSize(10);
    document.setTextColor(39, 39, 42);
    const title = document.splitTextToSize(transaction.title, 100)[0];
    document.text(title, margin, y);
    document.setTextColor(
      transaction.type === "income" ? 16 : 244,
      transaction.type === "income" ? 155 : 63,
      transaction.type === "income" ? 100 : 94,
    );
    document.text(
      `${transaction.type === "income" ? "+" : "-"}${formatCurrency(Number(transaction.amount))}`,
      pageWidth - margin,
      y,
      { align: "right" },
    );
    document.setFont("helvetica", "normal");
    document.setFontSize(8.5);
    document.setTextColor(113, 113, 122);
    document.text(
      `${formatDate(transaction.transaction_date)} · ${transaction.account?.name ?? "Conta"} · ${transaction.category?.name ?? "Sem categoria"}`,
      margin,
      y + 5,
    );
    y += 12;
  });

  const pages = document.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    document.setPage(page);
    document.setFont("helvetica", "normal");
    document.setFontSize(8);
    document.setTextColor(161, 161, 170);
    document.text(
      `Gerado pelo Gestor de Gastos · Página ${page} de ${pages}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: "center" },
    );
  }

  document.save(reportFileName("pdf", data));
}
