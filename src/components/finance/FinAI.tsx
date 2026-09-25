import { FormEvent, useEffect, useMemo, useState } from "react";
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
import { useLanguage } from "@/lib/i18n";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

type ChartMode =
  | "month"
  | "compare"
  | "year"
  | "history"
  | "balance"
  | "savings"
  | "topBills"
  | "cashflow"
  | "incomeBreakdown"
  | "billStatus"
  | "dailyFlow"
  | "recurring"
  | null;

type AiReply = {
  title: string;
  text: string;
  chart: ChartMode;
};

const DAILY_LIMIT = 20;
// Mantido no código para ativação futura quando a IA real/Gemini estiver conectada.
const FIN_AI_QUOTA_ENABLED = false;

/**
 * Diretrizes centrais da FinAI.
 * Mantidas como contrato da camada de inteligência para a futura integração
 * com um modelo real, enquanto o protótipo local usa as mesmas regras.
 */
export const FINAI_INSTRUCTIONS = `
Você é FinAI, um assistente financeiro inteligente.

Sua função é ajudar o usuário a compreender sua vida financeira utilizando exclusivamente os dados armazenados no aplicativo.

Regras obrigatórias:
- Nunca invente valores.
- Nunca estime dados inexistentes.
- Sempre utilize os registros financeiros disponíveis.
- Informe quando não houver dados suficientes.
- Responda de forma clara, objetiva e amigável.
- Realize cálculos financeiros quando necessário.
- Identifique tendências, médias, aumentos e reduções de gastos.
- Compare períodos sempre que solicitado.
- Gere insights úteis para ajudar o usuário a economizar dinheiro.
- Ao responder análises, destaque maior gasto, menor gasto, média, tendência e percentual de variação quando houver dados suficientes.

Quando o usuário solicitar gráficos:
- Retorne dados estruturados para geração visual.
- Organize os dados cronologicamente.
- Destaque tendências importantes.

Objetivo principal:
Transformar dados financeiros em respostas simples, inteligentes e acionáveis para o usuário.
`;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildReply(
  prompt: string,
  monthKey: string,
  year: number,
  state: ReturnType<typeof useFinanceState>,
): AiReply {
  const query = normalize(prompt);
  // A FinAI só responde com fatos calculados a partir do estado financeiro atual.
  // Categorias não existem no modelo de dados atual; portanto, nunca são inferidas.
  const data = state.months[monthKey] ?? { incomes: [], bills: [], savings: [] };
  const totals = computeTotals(data, monthKey);
  const previousKey = previousMonthKey(monthKey);
  const previousData = state.months[previousKey] ?? { incomes: [], bills: [], savings: [] };
  const previousTotals = computeTotals(previousData, previousKey);
  const paidBills = data.bills.filter((bill) => bill.paid);
  const pendingBills = data.bills.filter((bill) => !bill.paid);
  const billStatusLocal = (bill: (typeof data.bills)[number], key: string) => {
    const due = new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, bill.dueDay);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return due < today ? "overdue" : "pending";
  };
  const incomeCount = data.incomes.length;
  const billCount = data.bills.length;
  const savingCount = data.savings.length;
  const paidTotal = paidBills.reduce((sum, bill) => sum + bill.amount, 0);
  const pendingTotal = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);
  const largestBill = [...data.bills].sort((a, b) => b.amount - a.amount)[0];
  const largestIncome = [...data.incomes].sort((a, b) => b.amount - a.amount)[0];
  const recurringBills = data.bills.filter((bill) => bill.recurrent);
  const savingsRate = totals.totalIncomes > 0 ? (totals.totalSaved / totals.totalIncomes) * 100 : 0;
  const billRate = totals.totalIncomes > 0 ? (totals.totalBills / totals.totalIncomes) * 100 : 0;

  if (
    query.includes("analis") ||
    query.includes("diagnost") ||
    query.includes("completa") ||
    query.includes("panorama")
  ) {
    return {
      title: "Análise completa",
      text: `Neste mês, você recebeu ${formatCurrency(totals.totalIncomes)}, tem ${formatCurrency(totals.totalBills)} em contas e registrou ${formatCurrency(totals.totalSaved)} guardados. O saldo disponível está em ${formatCurrency(totals.availableBalance)}. Sua taxa de economia está em ${Math.round(savingsRate)}% e as contas representam ${Math.round(billRate)}% das receitas. Há ${pendingBills.length} pendência(s), ${paidBills.length} paga(s) e ${recurringBills.length} conta(s) recorrente(s).`,
      chart: "cashflow",
    };
  }

  if (
    query.includes("onde") &&
    (query.includes("gast") || query.includes("despes") || query.includes("dinheiro"))
  ) {
    return {
      title: "Onde seu dinheiro está indo",
      text: largestBill
        ? `Sua maior conta neste mês é "${largestBill.description}", de ${formatCurrency(largestBill.amount)}. As seis maiores contas estão no gráfico abaixo.`
        : "Ainda não há contas suficientes para analisar seus maiores gastos.",
      chart: data.bills.length ? "topBills" : null,
    };
  }

  if (
    query.includes("quanto posso guardar") ||
    query.includes("posso guardar") ||
    query.includes("taxa de economia")
  ) {
    const possible = Math.max(totals.totalIncomes - totals.totalBills, 0);
    return {
      title: "Potencial de economia",
      text: `Depois das contas, seu espaço financeiro bruto neste mês é de ${formatCurrency(possible)}. Você já registrou ${formatCurrency(totals.totalSaved)} guardados. Isso equivale a uma taxa de economia de ${Math.round(savingsRate)}% sobre suas receitas.`,
      chart: "cashflow",
    };
  }

  if (
    query.includes("quanto gastei") ||
    query.includes("total de gastos") ||
    query.includes("total gasto")
  ) {
    return {
      title: "Total de gastos",
      text: `Suas contas somam ${formatCurrency(totals.totalBills)} neste mês. Deste total, ${formatCurrency(paidTotal)} estão pagas e ${formatCurrency(pendingTotal)} estão pendentes.`,
      chart: "billStatus",
    };
  }

  if (
    query.includes("quanto recebi") ||
    query.includes("maior receita") ||
    query.includes("maior entrada")
  ) {
    return {
      title: "Receitas detalhadas",
      text: largestIncome
        ? `Você recebeu ${formatCurrency(totals.totalIncomes)} no mês. A maior entrada é "${largestIncome.description}", de ${formatCurrency(largestIncome.amount)}.`
        : "Ainda não há receitas registradas neste mês.",
      chart: "incomeBreakdown",
    };
  }

  if (query.includes("atrasad") || query.includes("vencid")) {
    const overdue = data.bills.filter((bill) => billStatusLocal(bill, monthKey) === "overdue");
    const overdueTotal = overdue.reduce((sum, bill) => sum + bill.amount, 0);
    return {
      title: "Contas atrasadas",
      text: overdue.length
        ? `Você tem ${overdue.length} conta(s) atrasada(s), totalizando ${formatCurrency(overdueTotal)}.`
        : "Não há contas atrasadas neste mês.",
      chart: overdue.length ? "billStatus" : null,
    };
  }

  if (query.includes("recorrent") || query.includes("fixas") || query.includes("fixos")) {
    const recurringTotal = recurringBills.reduce((sum, bill) => sum + bill.amount, 0);
    return {
      title: "Contas recorrentes",
      text: recurringBills.length
        ? `Você tem ${recurringBills.length} conta(s) recorrente(s), somando ${formatCurrency(recurringTotal)}.`
        : "Não há contas marcadas como recorrentes neste mês.",
      chart: "recurring",
    };
  }

  if (
    query.includes("fluxo") ||
    query.includes("entrada e saida") ||
    query.includes("entrada e saída")
  ) {
    return {
      title: "Fluxo financeiro",
      text: `O fluxo do mês é de ${formatCurrency(totals.monthBalance)} antes do valor guardado e ${formatCurrency(totals.availableBalance)} depois do valor guardado.`,
      chart: "cashflow",
    };
  }

  if (query.includes("diari") || query.includes("por dia")) {
    const days = new Date(year, Number(monthKey.slice(5, 7)), 0).getDate();
    return {
      title: "Média diária",
      text: `Considerando ${days} dias no mês, sua média registrada é de ${formatCurrency(totals.totalIncomes / days)} em receitas por dia e ${formatCurrency(totals.totalBills / days)} em contas por dia.`,
      chart: "dailyFlow",
    };
  }

  if (query.includes("ultimos 6") || query.includes("6 meses")) {
    return {
      title: "Últimos 6 meses",
      text: "Aqui está a evolução das suas receitas, contas e valores guardados nos últimos seis meses com dados disponíveis.",
      chart: "history",
    };
  }

  if (query.includes("ano") || query.includes("anual")) {
    return {
      title: "Gráfico anual",
      text: `Aqui está a evolução de receitas, contas e valores guardados em ${year}, mês a mês.`,
      chart: "year",
    };
  }

  if (
    query.includes("saldo") &&
    (query.includes("evol") ||
      query.includes("melhor") ||
      query.includes("histor") ||
      query.includes("graf"))
  ) {
    return {
      title: "Evolução do saldo",
      text: "Veja como o saldo mensal evoluiu ao longo dos últimos meses.",
      chart: "balance",
    };
  }

  if (
    (query.includes("guard") || query.includes("econom")) &&
    (query.includes("evol") || query.includes("histor") || query.includes("graf"))
  ) {
    return {
      title: "Evolução do valor guardado",
      text: "Veja quanto você conseguiu guardar mês a mês.",
      chart: "savings",
    };
  }

  if (
    query.includes("maiores") &&
    (query.includes("conta") || query.includes("gasto") || query.includes("despes"))
  ) {
    return {
      title: "Maiores contas",
      text: data.bills.length
        ? "Estas são as contas de maior valor registradas neste mês."
        : "Ainda não há contas registradas neste mês.",
      chart: "topBills",
    };
  }

  if (query.includes("compar") || query.includes("mes passado") || query.includes("mes anterior")) {
    const incomeChange =
      previousTotals.totalIncomes === 0
        ? null
        : ((totals.totalIncomes - previousTotals.totalIncomes) /
            Math.abs(previousTotals.totalIncomes)) *
          100;
    const billChange =
      previousTotals.totalBills === 0
        ? null
        : ((totals.totalBills - previousTotals.totalBills) / Math.abs(previousTotals.totalBills)) *
          100;
    const incomeText =
      incomeChange === null
        ? "não havia receitas registradas"
        : `${incomeChange >= 0 ? "subiram" : "caíram"} ${Math.abs(Math.round(incomeChange))}%`;
    const billText =
      billChange === null
        ? "não havia contas registradas"
        : `${billChange >= 0 ? "subiram" : "caíram"} ${Math.abs(Math.round(billChange))}%`;
    return {
      title: "Comparação mensal",
      text: `Em relação a ${monthLabel(previousKey)}, suas receitas ${incomeText} e suas contas ${billText}.`,
      chart: "compare",
    };
  }

  if (
    query.includes("pendente") ||
    query.includes("a pagar") ||
    query.includes("nao pag") ||
    query.includes("não pag")
  ) {
    const details = pendingBills.length
      ? pendingBills
          .slice()
          .sort((a, b) => b.amount - a.amount)
          .map((bill) => `${bill.description}: ${formatCurrency(bill.amount)}`)
          .join(" • ")
      : "Não há contas pendentes registradas neste mês.";
    return {
      title: "Contas pendentes",
      text: details,
      chart: pendingBills.length > 0 ? "topBills" : null,
    };
  }

  if (query.includes("pag") && query.includes("conta")) {
    return {
      title: "Contas pagas",
      text: paidBills.length
        ? `${paidBills.length} de ${billCount} contas estão marcadas como pagas, totalizando ${formatCurrency(paidBills.reduce((sum, bill) => sum + bill.amount, 0))}.`
        : "Nenhuma conta está marcada como paga neste mês.",
      chart: null,
    };
  }

  if (query.includes("receit") || query.includes("recebi") || query.includes("entrada")) {
    return {
      title: "Receitas do mês",
      text: `Você registrou ${formatCurrency(totals.totalIncomes)} em receitas em ${monthLabel(monthKey)}, distribuídas em ${incomeCount} lançamento(s).`,
      chart: "month",
    };
  }

  if (query.includes("gastei") || query.includes("gast") || query.includes("despes")) {
    const topBills = [...data.bills].sort((a, b) => b.amount - a.amount).slice(0, 3);
    const details = topBills.length
      ? topBills
          .map((bill, index) => `${index + 1}. ${bill.description}: ${formatCurrency(bill.amount)}`)
          .join(" • ")
      : "Ainda não há contas registradas neste mês.";
    return {
      title: "Gastos do mês",
      text: `Suas contas somam ${formatCurrency(totals.totalBills)} neste mês. ${details}`,
      chart: "topBills",
    };
  }

  if (query.includes("guardar") || query.includes("guardado") || query.includes("economiz")) {
    return {
      title: "Seu valor guardado",
      text: `Neste mês, você registrou ${formatCurrency(totals.totalSaved)} como valor guardado em ${savingCount} lançamento(s). O saldo disponível, depois do valor guardado, está em ${formatCurrency(totals.availableBalance)}.`,
      chart: "savings",
    };
  }

  if (
    query.includes("anal") ||
    query.includes("como foi") ||
    query.includes("minhas financ") ||
    query.includes("resumo")
  ) {
    const status = totals.availableBalance >= 0 ? "positivo" : "negativo";
    return {
      title: "Análise do mês",
      text: `Seu saldo disponível está ${status} em ${formatCurrency(totals.availableBalance)}. Você registrou ${formatCurrency(totals.totalIncomes)} em receitas, ${formatCurrency(totals.totalBills)} em contas e ${formatCurrency(totals.totalSaved)} guardados. Há ${pendingBills.length} conta(s) pendente(s) e ${paidBills.length} paga(s).`,
      chart: "month",
    };
  }

  if (query.includes("grafico") || query.includes("evolucao") || query.includes("mes")) {
    return {
      title: "Gráfico do mês",
      text: `Em ${monthLabel(monthKey)}, você registrou ${formatCurrency(totals.totalIncomes)} em receitas, ${formatCurrency(totals.totalBills)} em contas e ${formatCurrency(totals.totalSaved)} guardados.`,
      chart: "month",
    };
  }

  if (query.includes("categoria")) {
    return {
      title: "Categorias financeiras",
      text: "O FinMonth ainda não armazena categorias nos lançamentos. Para evitar inventar informações, a FinAI não pode determinar qual categoria consome mais dinheiro.",
      chart: null,
    };
  }

  if (query.includes("luz") || query.includes("energia")) {
    const matches = data.bills.filter(
      (bill) =>
        normalize(bill.description).includes("luz") ||
        normalize(bill.description).includes("energia"),
    );
    const total = matches.reduce((sum, bill) => sum + bill.amount, 0);
    return {
      title: "Conta de energia",
      text: matches.length
        ? `Encontrei ${matches.length} registro(s) relacionado(s) a luz/energia, totalizando ${formatCurrency(total)} neste mês.`
        : "Não encontrei registros de luz ou energia nos dados deste mês.",
      chart: matches.length > 1 ? "topBills" : null,
    };
  }

  if (
    query.includes("gasto") ||
    query.includes("receb") ||
    query.includes("financ") ||
    query.includes("dinheiro") ||
    query.includes("anal")
  ) {
    return {
      title: "Dados insuficientes para esta pergunta",
      text: "Tenho dados financeiros para analisar, mas não encontrei um contexto específico suficiente nessa pergunta. Tente indicar período, tipo de lançamento ou assunto. Não vou inventar informações que não estejam registradas.",
      chart: null,
    };
  }

  return {
    title: "Posso analisar seus dados",
    text: "Posso analisar receitas, gastos, contas pagas, pendências, atrasos, recorrências, economia, saldo, fluxo de caixa, médias, comparações, histórico e gráficos. Quando não houver dados suficientes, vou informar isso em vez de estimar ou inventar.",
    chart: null,
  };
}

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
  const { language, t } = useLanguage();

  const data = useMemo(() => {
    if (mode === "month")
      return [
        { label: t("incomes"), value: monthTotals.totalIncomes },
        { label: t("bills"), value: monthTotals.totalBills },
        { label: t("savings"), value: monthTotals.totalSaved },
      ];
    if (mode === "compare")
      return [
        {
          label: t("incomes"),
          atual: monthTotals.totalIncomes,
          anterior: previousTotals.totalIncomes,
        },
        { label: t("bills"), atual: monthTotals.totalBills, anterior: previousTotals.totalBills },
        { label: t("savings"), atual: monthTotals.totalSaved, anterior: previousTotals.totalSaved },
      ];
    if (mode === "topBills")
      return [...monthData.bills]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6)
        .map((bill) => ({ label: bill.description, value: bill.amount }));
    if (mode === "cashflow")
      return [
        { label: t("incomes"), value: monthTotals.totalIncomes },
        { label: t("bills"), value: monthTotals.totalBills },
        { label: t("savings"), value: monthTotals.totalSaved },
        { label: t("monthBalance"), value: monthTotals.availableBalance },
      ];
    if (mode === "incomeBreakdown")
      return [...monthData.incomes]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6)
        .map((income) => ({ label: income.description, value: income.amount }));
    if (mode === "billStatus")
      return [
        { label: t("paidBills"), value: monthTotals.paidTotal },
        { label: t("pendingBills"), value: monthTotals.pendingTotal },
      ];
    if (mode === "dailyFlow") {
      const days = new Date(year, Number(monthKey.slice(5, 7)), 0).getDate();
      return [
        { label: `${t("incomes")}/dia`, value: monthTotals.totalIncomes / days },
        { label: `${t("bills")}/dia`, value: monthTotals.totalBills / days },
        { label: `${t("savings")}/dia`, value: monthTotals.totalSaved / days },
      ];
    }
    if (mode === "recurring") {
      const recurring = monthData.bills.filter((bill) => bill.recurrent);
      return recurring
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6)
        .map((bill) => ({ label: bill.description, value: bill.amount }));
    }
    if (mode === "balance")
      return historyRows.map((row) => ({ label: row.label, value: row.saldo }));
    if (mode === "savings")
      return historyRows.map((row) => ({ label: row.label, value: row.guardado }));
    if (mode === "history")
      return historyRows.map((row) => ({
        label: row.label,
        [t("incomes")]: row.receitas,
        [t("bills")]: row.despesas,
        [t("savings")]: row.guardado,
      }));
    return annualRows.map((row) => ({
      label: row.label,
      [t("incomes")]: row.receitas,
      [t("bills")]: row.despesas,
      [t("savings")]: row.guardado,
    }));
  }, [annualRows, historyRows, language, mode, monthData.bills, monthTotals, previousTotals, t]);

  const title =
    mode === "month"
      ? monthLabel(monthKey)
      : mode === "compare"
        ? t("monthlyComparisonTitle")
        : mode === "history"
          ? t("last6Months")
          : mode === "balance"
            ? t("balanceChart")
            : mode === "savings"
              ? t("savingsChart")
              : mode === "topBills"
                ? t("largestBills")
                : mode === "cashflow"
                  ? t("cashFlow")
                  : mode === "incomeBreakdown"
                    ? t("detailedIncome")
                    : mode === "billStatus"
                      ? t("paidBills")
                      : mode === "dailyFlow"
                        ? t("dailyAverage")
                        : mode === "recurring"
                          ? t("recurringBills")
                          : `${t("history")} ${year}`;

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
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 11,
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={mode === "balance" ? t("monthBalance") : t("savings")}
                stroke="var(--brand)"
                strokeWidth={2.5}
                dot={(props: any) => {
                  const key = props.key ?? `dot-${props.cx}-${props.cy}`;
                  return (
                    <circle
                      key={key}
                      cx={props.cx}
                      cy={props.cy}
                      r={3}
                      fill="var(--brand)"
                    />
                  );
                }}
              />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 11,
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              {mode === "compare" ? (
                <>
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 5 }} />
                  <Bar
                    dataKey="anterior"
                    name={t("previous")}
                    fill="var(--muted-foreground)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="atual"
                    name={t("current")}
                    fill="var(--brand)"
                    radius={[4, 4, 0, 0]}
                  />
                </>
              ) : mode === "year" || mode === "history" ? (
                <>
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 5 }} />
                  <Bar
                    dataKey={t("incomes")}
                    name={t("incomes")}
                    fill="var(--pos)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey={t("bills")}
                    name={t("bills")}
                    fill="var(--neg)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey={t("savings")}
                    name={t("savings")}
                    fill="var(--econ)"
                    radius={[4, 4, 0, 0]}
                  />
                </>
              ) : (
                <Bar
                  dataKey="value"
                  name={
                    mode === "topBills" || mode === "incomeBreakdown" || mode === "recurring"
                      ? t("amount")
                      : mode === "billStatus"
                        ? t("totalExpenses")
                        : t("amount")
                  }
                  fill="var(--brand)"
                  radius={[5, 5, 0, 0]}
                />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      {mode === "year" &&
        annualTotals.totalIncomes + annualTotals.totalBills + annualTotals.totalSaved === 0 && (
          <p className="mt-2 text-center text-[10px] text-mut">{t("noMonth")}</p>
        )}
    </div>
  );
}

export function FinAi({ monthKey }: { monthKey: string }) {
  const { language, t } = useLanguage();
  const suggestions = [
    t("analysisSuggestion"),
    t("monthQuestion"),
    t("spendingQuestion"),
    t("savingQuestion"),
    t("pendingQuestion"),
  ];
  const state = useFinanceState();
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState<AiReply | null>(null);
  const [quota, setQuota] = useState({ count: 0, remaining: DAILY_LIMIT, allowed: true });
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [quotaError, setQuotaError] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const year = Number(monthKey.slice(0, 4));

  async function loadQuota() {
    setQuotaLoading(true);
    const { data, error } = await supabase.rpc("get_fin_ai_quota");
    if (error) {
      setQuotaError(true);
      setQuotaLoading(false);
      return;
    }
    const next = data as { count?: number; remaining?: number; allowed?: boolean };
    setQuota({
      count: Number(next.count ?? 0),
      remaining: Number(next.remaining ?? DAILY_LIMIT),
      allowed: next.allowed !== false,
    });
    setQuotaError(false);
    setQuotaLoading(false);
  }

  useEffect(() => {
    if (FIN_AI_QUOTA_ENABLED) void loadQuota();
  }, []);

  async function ask(question: string) {
    const value = question.trim();
    if (!value || aiLoading || (FIN_AI_QUOTA_ENABLED && (quotaLoading || !quota.allowed))) return;
    if (FIN_AI_QUOTA_ENABLED) {
      const { data, error } = await supabase.rpc("consume_fin_ai_quota");
      if (error) {
        setQuotaError(true);
        return;
      }
      const next = data as { count?: number; remaining?: number; allowed?: boolean };
      if (next.allowed === false) {
        setQuota({ count: Number(next.count ?? DAILY_LIMIT), remaining: 0, allowed: false });
        return;
      }
      setQuota({
        count: Number(next.count ?? quota.count + 1),
        remaining: Number(next.remaining ?? Math.max(DAILY_LIMIT - quota.count - 1, 0)),
        allowed: true,
      });
    }
    setAiLoading(true);
    try {
      const history = reply ? [{ role: "assistant", text: reply.text }] : [];
      const { data, error } = await supabase.functions.invoke("fin-ai", {
        body: { question: value, monthKey, history, language },
      });

      if (error) throw new Error(error.message || t("operationFailed"));

      const result = data as {
        title?: string;
        text?: string;
        chartMode?: ChartMode;
        error?: string;
      };

      if (result.error) throw new Error(result.error);

      setReply({
        title: result.title?.trim() || "FinAI",
        text: result.text?.trim() || t("financialDataInsufficient"),
        chart: result.chartMode ?? null,
      });
      setPrompt("");
    } catch (error) {
      setReply({
        title: "FinAI",
        text: error instanceof Error ? error.message : t("operationFailed"),
        chart: null,
      });
    } finally {
      setAiLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(prompt);
  }

  return (
    <section className="space-y-4 pb-2">
      <div>
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold">FinAI</h1>
            <p className="mt-0.5 text-xs text-mut">{t("finaiSubtitle")}</p>
          </div>
        </div>
      </div>

      <section className="glass rounded-3xl p-4">
        <p className="text-sm font-medium">{t("whatWant")}</p>
        <p className="mt-1 text-xs leading-relaxed text-mut">{t("askMonth")}</p>
        {aiLoading && (
          <div className="mt-3 flex items-center gap-2 text-[10px] text-mut">
            <span className="size-1.5 animate-pulse rounded-full bg-brand" />
            {t("analyzing")}
          </div>
        )}
        {FIN_AI_QUOTA_ENABLED && (
          <>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-[10px] text-mut">
              <span>{t("dailyQueries")}</span>
              <span className="font-semibold text-foreground">
                {quotaLoading ? "…" : `${quota.count}/${DAILY_LIMIT}`}
              </span>
            </div>
            {quotaError && <p className="mt-2 text-[10px] text-warn">{t("quotaError")}</p>}
            {!quotaLoading && !quota.allowed && (
              <p className="mt-2 text-[10px] text-warn">{t("quotaReached")}</p>
            )}
          </>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void ask(suggestion)}
              className="rounded-full border border-border/70 bg-muted/30 px-3 py-2 text-[10px] font-medium text-mut transition-colors hover:border-brand/30 hover:bg-brand/10 hover:text-brand"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </section>

      {reply && (
        <section className="glass rounded-3xl p-4">
          <div className="flex items-start gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-sm font-semibold">{reply.title}</h2>
                <span className="text-[9px] uppercase tracking-widest text-mut">FinAI</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-mut">{reply.text}</p>
              {reply.chart && (
                <FinAiChart mode={reply.chart} monthKey={monthKey} year={year} state={state} />
              )}
            </div>
          </div>
        </section>
      )}

      <form onSubmit={submit} className="glass flex items-center gap-2 rounded-2xl p-2">
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={t("enterQuestion")}
          className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-mut/70"
          aria-label={t("askFinAi")}
        />
        <button
          type="submit"
          aria-label={t("sendQuestion")}
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-background transition-opacity disabled:opacity-40"
          disabled={
            !prompt.trim() ||
            aiLoading ||
            (FIN_AI_QUOTA_ENABLED && (quotaLoading || !quota.allowed))
          }
        >
          <Send className="size-4" />
        </button>
      </form>

      <div className="flex items-center justify-center gap-1.5 text-[9px] text-mut/70">
        <ArrowUpRight className="size-3" />
        {t("finaiHint")}
      </div>
    </section>
  );
}
