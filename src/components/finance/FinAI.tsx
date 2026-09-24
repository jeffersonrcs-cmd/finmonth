function FinAiChart({
  mode,
  monthKey,
  year,
  state,
}: {
  mode: Exclude<ChartMode, null>;
  monthKey: string;
  year: number;
  state: ReturnType<typeof useFinanceState>;
}) {
  const monthData = useMonthData(monthKey);
  const monthTotals = computeTotals(monthData, monthKey);
  const previousKey = previousMonthKey(monthKey);
  const previousData = state.months[previousKey] ?? { incomes: [], bills: [], savings: [] };
  const previousTotals = computeTotals(previousData, previousKey);
  const annualRows = useHistoryRows(12, year);
  const historyRows = useHistoryRows(6);
  const annualTotals = useAnnualTotals(year);

  const data = useMemo(() => {
    if (mode === "month") return [
      { label: "Receitas", value: monthTotals.totalIncomes },
      { label: "Contas", value: monthTotals.totalBills },
      { label: "Guardado", value: monthTotals.totalSaved },
    ];
    if (mode === "compare") return [
      { label: "Receitas", atual: monthTotals.totalIncomes, anterior: previousTotals.totalIncomes },
      { label: "Contas", atual: monthTotals.totalBills, anterior: previousTotals.totalBills },
      { label: "Guardado", atual: monthTotals.totalSaved, anterior: previousTotals.totalSaved },
    ];
    if (mode === "topBills") return [...monthData.bills].sort((a, b) => b.amount - a.amount).slice(0, 6).map((bill) => ({ label: bill.description, value: bill.amount }));
    if (mode === "balance") return historyRows.map((row) => ({ label: row.label, value: row.saldo }));
    if (mode === "savings") return historyRows.map((row) => ({ label: row.label, value: row.guardado }));
    if (mode === "history") return historyRows.map((row) => ({ label: row.label, Receitas: row.receitas, Contas: row.despesas, Guardado: row.guardado }));
    return annualRows.map((row) => ({ label: row.label, Receitas: row.receitas, Contas: row.despesas, Guardado: row.guardado }));
  }, [annualRows, historyRows, mode, monthData.bills, monthTotals, previousTotals]);

  const title = mode === "month" ? monthLabel(monthKey)
    : mode === "compare" ? "Mês atual × anterior"
    : mode === "history" ? "Últimos 6 meses"
    : mode === "balance" ? "Evolução do saldo"
    : mode === "savings" ? "Evolução do valor guardado"
    : mode === "topBills" ? "Maiores contas"
    : `Ano ${year}`;

  return (
    <div className="mt-3 rounded-2xl border border-border/60 bg-background/30 p-3">
      <div className="mb-2 flex items-center gap-2">
        <BarChart3 className="size-3.5 text-brand" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-mut">{title}</span>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          {mode === "balance" || mode === "savings" ? (
            <LineChart data={data}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 11 }} formatter={(value: number) => formatCurrency(value)} />
              <Line type="monotone" dataKey="value" name={mode === "balance" ? "Saldo" : "Guardado"} stroke="var(--brand)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--brand)" }} />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 11 }} formatter={(value: number) => formatCurrency(value)} />
              {mode === "compare" ? (
                <>
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 5 }} />
                  <Bar dataKey="anterior" name="Anterior" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="atual" name="Atual" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                </>
              ) : mode === "year" || mode === "history" ? (
                <>
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 5 }} />
                  <Bar dataKey="Receitas" name="Receitas" fill="var(--pos)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Contas" name="Contas" fill="var(--neg)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Guardado" name="Guardado" fill="var(--econ)" radius={[4, 4, 0, 0]} />
                </>
              ) : (
                <Bar dataKey="value" name={mode === "topBills" ? "Valor" : "Total"} fill="var(--brand)" radius={[5, 5, 0, 0]} />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      {mode === "year" && annualTotals.totalIncomes + annualTotals.totalBills + annualTotals.totalSaved === 0 && (
        <p className="mt-2 text-center text-[10px] text-mut">Ainda não há dados registrados para este ano.</p>
      )}
    </div>
  );
}import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BarChart3, Send, Sparkles } from "lucide-react";
import {
  computeTotals,
  formatCurrency,
  monthLabel,
  previousMonthKey,
  useFinanceState,
  useMonthData,
} from "@/lib/finance";
import { useHistoryRows, useAnnualTotals } from "@/components/finance/HistoryChart";
import { supabase } from "@/lib/supabase";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

type ChartMode = "month" | "compare" | "year" | "history" | "balance" | "savings" | "topBills" | null;

type AiReply = {
  title: string;
  text: string;
  chart: ChartMode;
};

const DAILY_LIMIT = 20;

const suggestions = [
  "Como foi meu mês?",
  "Quanto recebi este mês?",
  "Quanto gastei este mês?",
  "Quanto consegui guardar?",
  "Quais contas estão pendentes?",
  "Quais foram minhas maiores contas?",
  "Meu saldo está melhorando?",
  "Compare com o mês passado",
  "Compare meus últimos 6 meses",
  "Mostre a evolução do saldo",
  "Mostre a evolução do que guardei",
  "Gerar gráfico do mês",
  "Gerar gráfico do ano",
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildReply(prompt: string, monthKey: string, year: number, state: ReturnType<typeof useFinanceState>): AiReply {
  const query = normalize(prompt);
  const data = state.months[monthKey] ?? { incomes: [], bills: [], savings: [] };
  const totals = computeTotals(data, monthKey);
  const previousKey = previousMonthKey(monthKey);
  const previousData = state.months[previousKey] ?? { incomes: [], bills: [], savings: [] };
  const previousTotals = computeTotals(previousData, previousKey);
  const paidBills = data.bills.filter((bill) => bill.paid);
  const pendingBills = data.bills.filter((bill) => !bill.paid);
  const incomeCount = data.incomes.length;
  const billCount = data.bills.length;
  const savingCount = data.savings.length;

  if (query.includes("ultimos 6") || query.includes("6 meses")) {
    return { title: "Últimos 6 meses", text: "Aqui está a evolução das suas receitas, contas e valores guardados nos últimos seis meses com dados disponíveis.", chart: "history" };
  }

  if (query.includes("ano") || query.includes("anual")) {
    return { title: "Gráfico anual", text: `Aqui está a evolução de receitas, contas e valores guardados em ${year}, mês a mês.`, chart: "year" };
  }

  if (query.includes("saldo") && (query.includes("evol") || query.includes("melhor") || query.includes("histor") || query.includes("graf"))) {
    return { title: "Evolução do saldo", text: "Veja como o saldo mensal evoluiu ao longo dos últimos meses.", chart: "balance" };
  }

  if ((query.includes("guard") || query.includes("econom")) && (query.includes("evol") || query.includes("histor") || query.includes("graf"))) {
    return { title: "Evolução do valor guardado", text: "Veja quanto você conseguiu guardar mês a mês.", chart: "savings" };
  }

  if (query.includes("maiores") && (query.includes("conta") || query.includes("gasto") || query.includes("despes"))) {
    return { title: "Maiores contas", text: data.bills.length ? "Estas são as contas de maior valor registradas neste mês." : "Ainda não há contas registradas neste mês.", chart: "topBills" };
  }

  if (query.includes("compar") || query.includes("mes passado") || query.includes("mes anterior")) {
    const incomeChange = previousTotals.totalIncomes === 0 ? null : ((totals.totalIncomes - previousTotals.totalIncomes) / Math.abs(previousTotals.totalIncomes)) * 100;
    const billChange = previousTotals.totalBills === 0 ? null : ((totals.totalBills - previousTotals.totalBills) / Math.abs(previousTotals.totalBills)) * 100;
    const incomeText = incomeChange === null ? "não havia receitas registradas" : `${incomeChange >= 0 ? "subiram" : "caíram"} ${Math.abs(Math.round(incomeChange))}%`;
    const billText = billChange === null ? "não havia contas registradas" : `${billChange >= 0 ? "subiram" : "caíram"} ${Math.abs(Math.round(billChange))}%`;
    return { title: "Comparação mensal", text: `Em relação a ${monthLabel(previousKey)}, suas receitas ${incomeText} e suas contas ${billText}.`, chart: "compare" };
  }

  if (query.includes("pendente") || query.includes("a pagar") || query.includes("nao pag") || query.includes("não pag")) {
    const details = pendingBills.length
      ? pendingBills.slice().sort((a, b) => b.amount - a.amount).map((bill) => `${bill.description}: ${formatCurrency(bill.amount)}`).join(" • ")
      : "Não há contas pendentes registradas neste mês.";
    return { title: "Contas pendentes", text: details, chart: pendingBills.length > 0 ? "topBills" : null };
  }

  if (query.includes("pag") && query.includes("conta")) {
    return { title: "Contas pagas", text: paidBills.length ? `${paidBills.length} de ${billCount} contas estão marcadas como pagas, totalizando ${formatCurrency(paidBills.reduce((sum, bill) => sum + bill.amount, 0))}.` : "Nenhuma conta está marcada como paga neste mês.", chart: null };
  }

  if (query.includes("receit") || query.includes("recebi") || query.includes("entrada")) {
    return { title: "Receitas do mês", text: `Você registrou ${formatCurrency(totals.totalIncomes)} em receitas em ${monthLabel(monthKey)}, distribuídas em ${incomeCount} lançamento(s).`, chart: "month" };
  }

  if (query.includes("gastei") || query.includes("gast") || query.includes("despes")) {
    const topBills = [...data.bills].sort((a, b) => b.amount - a.amount).slice(0, 3);
    const details = topBills.length
      ? topBills.map((bill, index) => `${index + 1}. ${bill.description}: ${formatCurrency(bill.amount)}`).join(" • ")
      : "Ainda não há contas registradas neste mês.";
    return { title: "Gastos do mês", text: `Suas contas somam ${formatCurrency(totals.totalBills)} neste mês. ${details}`, chart: "topBills" };
  }

  if (query.includes("guardar") || query.includes("guardado") || query.includes("economiz")) {
    return { title: "Seu valor guardado", text: `Neste mês, você registrou ${formatCurrency(totals.totalSaved)} como valor guardado em ${savingCount} lançamento(s). O saldo disponível, depois do valor guardado, está em ${formatCurrency(totals.availableBalance)}.`, chart: "savings" };
  }

  if (query.includes("anal") || query.includes("como foi") || query.includes("minhas financ") || query.includes("resumo")) {
    const status = totals.availableBalance >= 0 ? "positivo" : "negativo";
    return { title: "Análise do mês", text: `Seu saldo disponível está ${status} em ${formatCurrency(totals.availableBalance)}. Você registrou ${formatCurrency(totals.totalIncomes)} em receitas, ${formatCurrency(totals.totalBills)} em contas e ${formatCurrency(totals.totalSaved)} guardados. Há ${pendingBills.length} conta(s) pendente(s) e ${paidBills.length} paga(s).`, chart: "month" };
  }

  if (query.includes("grafico") || query.includes("evolucao") || query.includes("mes")) {
    return { title: "Gráfico do mês", text: `Em ${monthLabel(monthKey)}, você registrou ${formatCurrency(totals.totalIncomes)} em receitas, ${formatCurrency(totals.totalBills)} em contas e ${formatCurrency(totals.totalSaved)} guardados.`, chart: "month" };
  }

  return {
    title: "Posso analisar seus dados",
    text: "Experimente perguntar sobre receitas, gastos, contas pagas ou pendentes, saldo, valor guardado, comparações e evolução dos seus dados. Também posso mostrar gráficos mensais, anuais, históricos, de saldo, de economia e das maiores contas.",
    chart: null,
  };
}
