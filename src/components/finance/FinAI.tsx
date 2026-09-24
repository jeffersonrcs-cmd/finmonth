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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

type ChartMode = "month" | "compare" | "year" | "history" | null;

type AiReply = {
  title: string;
  text: string;
  chart: ChartMode;
};

const DAILY_LIMIT = 20;

const suggestions = [
  "Gerar gráfico do mês",
  "Comparar com o mês passado",
  "Gerar gráfico do ano",
  "Quanto consegui guardar?",
  "Onde estou gastando mais?",
  "Analise minhas finanças",
  "Compare meus últimos 6 meses",
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

  if (query.includes("ano") || query.includes("anual")) {
    return {
      title: "Gráfico anual",
      text: `Aqui está a evolução de receitas, contas e valores guardados em ${year}, mês a mês.`,
      chart: "year",
    };
  }

  if (query.includes("ultimos 6") || query.includes("6 meses")) {
    return {
      title: "Últimos 6 meses",
      text: "Aqui está a evolução das suas receitas, contas e valores guardados nos últimos seis meses com dados disponíveis.",
      chart: "history",
    };
  }

  if (query.includes("compar") || query.includes("mes passado") || query.includes("mes anterior")) {
    const incomeChange = previousTotals.totalIncomes === 0
      ? null
      : ((totals.totalIncomes - previousTotals.totalIncomes) / Math.abs(previousTotals.totalIncomes)) * 100;
    const billChange = previousTotals.totalBills === 0
      ? null
      : ((totals.totalBills - previousTotals.totalBills) / Math.abs(previousTotals.totalBills)) * 100;
    const incomeText = incomeChange === null ? "não havia receitas registradas" : `${incomeChange >= 0 ? "subiram" : "caíram"} ${Math.abs(Math.round(incomeChange))}%`;
    const billText = billChange === null ? "não havia contas registradas" : `${billChange >= 0 ? "subiram" : "caíram"} ${Math.abs(Math.round(billChange))}%`;
    return {
      title: "Comparação mensal",
      text: `Em relação a ${monthLabel(previousKey)}, suas receitas ${incomeText} e suas contas ${billText}.`,
      chart: "compare",
    };
  }

  if (query.includes("grafico") || query.includes("evolucao") || query.includes("mes")) {
    return {
      title: "Gráfico do mês",
      text: `Em ${monthLabel(monthKey)}, você registrou ${formatCurrency(totals.totalIncomes)} em receitas, ${formatCurrency(totals.totalBills)} em contas e ${formatCurrency(totals.totalSaved)} guardados.`,
      chart: "month",
    };
  }

  if (query.includes("guardar") || query.includes("guardado") || query.includes("economiz")) {
    return {
      title: "Seu valor guardado",
      text: `Neste mês, você registrou ${formatCurrency(totals.totalSaved)} como valor guardado. O saldo disponível, depois do valor guardado, está em ${formatCurrency(totals.availableBalance)}.`,
      chart: null,
    };
  }

  if (query.includes("gast") || query.includes("conta") || query.includes("despes")) {
    const topBills = [...data.bills].sort((a, b) => b.amount - a.amount).slice(0, 3);
    const details = topBills.length
      ? topBills.map((bill, index) => `${index + 1}. ${bill.description}: ${formatCurrency(bill.amount)}`).join(" • ")
      : "Ainda não há contas registradas neste mês.";
    return {
      title: "Suas maiores contas",
      text: details,
      chart: null,
    };
  }

  if (query.includes("anal") || query.includes("como foi") || query.includes("minhas financ")) {
    const status = totals.availableBalance >= 0 ? "positivo" : "negativo";
    return {
      title: "Análise do mês",
      text: `Seu saldo disponível está ${status} em ${formatCurrency(totals.availableBalance)}. Você registrou ${formatCurrency(totals.totalIncomes)} em receitas, ${formatCurrency(totals.totalBills)} em contas e ${formatCurrency(totals.totalSaved)} guardados.`,
      chart: "month",
    };
  }

  return {
    title: "Posso analisar seus dados",
    text: "Experimente pedir um gráfico mensal ou anual, comparar meses, analisar seu saldo, descobrir suas maiores contas ou consultar quanto você guardou.",
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

  const data = useMemo(() => {
    if (mode === "month") {
      return [
        { label: "Receitas", value: monthTotals.totalIncomes },
        { label: "Contas", value: monthTotals.totalBills },
        { label: "Guardado", value: monthTotals.totalSaved },
      ];
    }
    if (mode === "compare") {
      return [
        { label: "Receitas", atual: monthTotals.totalIncomes, anterior: previousTotals.totalIncomes },
        { label: "Contas", atual: monthTotals.totalBills, anterior: previousTotals.totalBills },
        { label: "Guardado", atual: monthTotals.totalSaved, anterior: previousTotals.totalSaved },
      ];
    }
    if (mode === "history") {
      return historyRows.map((row) => ({
        label: row.label,
        Receitas: row.receitas,
        Contas: row.despesas,
        Guardado: row.guardado,
      }));
    }
    return annualRows.map((row) => ({
      label: row.label,
      Receitas: row.receitas,
      Contas: row.despesas,
      Guardado: row.guardado,
    }));
  }, [annualRows, historyRows, mode, monthTotals, previousTotals]);

  return (
    <div className="mt-3 rounded-2xl border border-border/60 bg-background/30 p-3">
      <div className="mb-2 flex items-center gap-2">
        <BarChart3 className="size-3.5 text-brand" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-mut">
          {mode === "month"
            ? monthLabel(monthKey)
            : mode === "compare"
              ? "Mês atual × anterior"
              : mode === "history"
                ? "Últimos 6 meses"
                : `Ano ${year}`}
        </span>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
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
                <Bar dataKey="anterior" name="Anterior" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="atual" name="Atual" fill="var(--brand)" radius={[4, 4, 0, 0]} />
              </>
) : mode === "year" || mode === "history" ? (
              <>
                <Legend wrapperStyle={{ fontSize: 9, paddingTop: 5 }} />
                <Bar dataKey="Receitas" fill="var(--pos)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Contas" fill="var(--neg)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Guardado" fill="var(--econ)" radius={[4, 4, 0, 0]} />
              </>
            ) : (
              <Bar dataKey="value" fill="var(--brand)" radius={[5, 5, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {mode === "year" && annualTotals.totalIncomes + annualTotals.totalBills + annualTotals.totalSaved === 0 && (
        <p className="mt-2 text-center text-[10px] text-mut">Ainda não há dados registrados para este ano.</p>
      )}
    </div>
  );
}

export function FinAi({ monthKey }: { monthKey: string }) {
  const state = useFinanceState();
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState<AiReply | null>(null);
  const [quota, setQuota] = useState({ count: 0, remaining: DAILY_LIMIT, allowed: true });
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [quotaError, setQuotaError] = useState(false);
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
    void loadQuota();
  }, []);

  async function ask(question: string) {
    const value = question.trim();
    if (!value || quotaLoading || !quota.allowed) return;
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
    setReply(buildReply(value, monthKey, year, state));
    setPrompt("");
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
            <h1 className="font-display text-xl font-semibold">Fin IA</h1>
            <p className="mt-0.5 text-xs text-mut">Sua inteligência financeira no FinMonth.</p>
          </div>
        </div>
      </div>

      <section className="glass rounded-3xl p-4">
        <p className="text-sm font-medium">O que você quer saber?</p>
        <p className="mt-1 text-xs leading-relaxed text-mut">
          Pergunte sobre seu mês, compare períodos ou peça um gráfico.
        </p>
        <div className="mt-3 flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-[10px] text-mut">
          <span>Consultas hoje</span>
          <span className="font-semibold text-foreground">{quotaLoading ? "…" : `${quota.count}/${DAILY_LIMIT}`}</span>
        </div>
        {quotaError && <p className="mt-2 text-[10px] text-warn">Não foi possível consultar a cota agora. Tente novamente.</p>}
        {!quotaLoading && !quota.allowed && <p className="mt-2 text-[10px] text-warn">Cota diária atingida. Você poderá usar a Fin IA novamente amanhã.</p>}

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
                <span className="text-[9px] uppercase tracking-widest text-mut">Fin IA</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-mut">{reply.text}</p>
              {reply.chart && <FinAiChart mode={reply.chart} monthKey={monthKey} year={year} state={state} />}
            </div>
          </div>
        </section>
      )}

      <form onSubmit={submit} className="glass flex items-center gap-2 rounded-2xl p-2">
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Digite sua pergunta..."
          className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-mut/70"
          aria-label="Pergunte à Fin IA"
        />
        <button
          type="submit"
          aria-label="Enviar pergunta"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-background transition-opacity disabled:opacity-40"
          disabled={!prompt.trim() || quotaLoading || !quota.allowed}
        >
          <Send className="size-4" />
        </button>
      </form>

      <div className="flex items-center justify-center gap-1.5 text-[9px] text-mut/70">
        <ArrowUpRight className="size-3" />
        A Fin IA usa os dados financeiros do seu FinMonth para gerar análises.
      </div>
    </section>
  );
}
