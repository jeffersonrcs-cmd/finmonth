import {
  Bar,
  BarChart,
  Legend,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { computeTotals, formatCurrency, monthLabel, MONTH_NAMES, useFinanceState } from "@/lib/finance";

type Row = {
  label: string;
  receitas: number;
  despesas: number;
  saldo: number;
  guardado: number;
};

export function useHistoryRows(limit = 7, year?: number): Row[] {
  const state = useFinanceState();
  const keys = year
    ? Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`)
    : Object.keys(state.months).sort().slice(-limit);

  return keys.map((key) => {
      const t = computeTotals(state.months[key] ?? { incomes: [], bills: [], savings: [] }, key);
      return {
        label: year ? (MONTH_NAMES[Number(key.slice(5, 7)) - 1]?.slice(0, 3) ?? "") : monthLabel(key, true),
        receitas: t.totalIncomes,
        despesas: t.totalBills,
        saldo: t.monthBalance,
        guardado: t.totalSaved,
      };
    });
}

function ChartShell({
  title,
  subtitle,
  rows,
  children,
}: {
  title: string;
  subtitle?: string;
  rows: Row[];
  children: React.ReactNode;
}) {
  return (
    <section className="glass mb-4 rounded-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-mut">
          {title}
        </h2>
        {subtitle && <span className="text-[11px] text-mut">{subtitle}</span>}
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-mut">Sem dados suficientes ainda.</p>
      ) : (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    fontSize: 12,
  },
  formatter: (value: number) => formatCurrency(value),
};

const axisProps = {
  dataKey: "label",
  tick: { fontSize: 10, fill: "var(--muted-foreground)" },
  axisLine: false,
  tickLine: false,
};

export function useAnnualTotals(year: number) {
  const state = useFinanceState();
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`).reduce(
    (totals, key) => {
      const month = state.months[key];
      if (!month) return totals;
      const current = computeTotals(month, key);
      return {
        totalIncomes: totals.totalIncomes + current.totalIncomes,
        totalBills: totals.totalBills + current.totalBills,
        totalSaved: totals.totalSaved + current.totalSaved,
      };
    },
    { totalIncomes: 0, totalBills: 0, totalSaved: 0 },
  );
}

function changePercent(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function formatChange(value: number | null) {
  if (value === null) return "novo";
  return `${value >= 0 ? "+" : ""}${Math.round(value)}%`;
}

export function MonthlyOverview({
  rows,
  totals,
  period = "monthly",
  comparison,
}: {
  rows: Row[];
  totals: { totalIncomes: number; totalBills: number; totalSaved: number; availableBalance: number };
  period?: "monthly" | "annual";
  comparison?: { totalIncomes: number; totalBills: number; totalSaved: number } | undefined;
}) {
  const previous = rows.length > 1 ? rows[rows.length - 2] : undefined;
  const current = rows[rows.length - 1];
  const incomeChange = comparison
    ? changePercent(totals.totalIncomes, comparison.totalIncomes)
    : previous && current
      ? changePercent(current.receitas, previous.receitas)
      : null;
  const expenseChange = comparison
    ? changePercent(totals.totalBills, comparison.totalBills)
    : previous && current
      ? changePercent(current.despesas, previous.despesas)
      : null;
  const savedChange = comparison
    ? changePercent(totals.totalSaved, comparison.totalSaved)
    : previous && current
      ? changePercent(current.guardado, previous.guardado)
      : null;
  const balancePositive = totals.availableBalance >= 0;

  return (
    <section className="space-y-4">
      <div className="glass rounded-3xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-semibold">Visão geral</h2>
            <p className="mt-0.5 text-[11px] text-mut">{period === "annual" ? "Resumo do ano selecionado" : "Resumo do mês selecionado"}</p>
          </div>
          <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${balancePositive ? "bg-pos/10 text-pos" : "bg-neg/10 text-neg"}`}>
            Saldo {balancePositive ? "positivo" : "negativo"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-pos/10 p-3">
            <p className="text-[10px] text-mut">Receitas</p>
            <p className="num mt-1 font-display text-sm font-semibold text-pos">{formatCurrency(totals.totalIncomes, true)}</p>
          </div>
          <div className="rounded-2xl bg-neg/10 p-3">
            <p className="text-[10px] text-mut">Contas</p>
            <p className="num mt-1 font-display text-sm font-semibold text-neg">{formatCurrency(totals.totalBills, true)}</p>
          </div>
          <div className="rounded-2xl bg-econ/10 p-3">
            <p className="text-[10px] text-mut">Guardado</p>
            <p className="num mt-1 font-display text-sm font-semibold text-econ">{formatCurrency(totals.totalSaved, true)}</p>
          </div>
          <div className="rounded-2xl bg-brand/10 p-3">
            <p className="text-[10px] text-mut">Saldo</p>
            <p className={`num mt-1 font-display text-sm font-semibold ${balancePositive ? "text-brand" : "text-neg"}`}>{formatCurrency(totals.availableBalance, true)}</p>
          </div>
        </div>
      </div>

      <ChartShell title={period === "annual" ? "Comparativo anual" : "Comparativo mensal"} subtitle={period === "annual" ? "Janeiro a dezembro" : "Últimos meses"} rows={rows}>
        <BarChart data={rows}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis {...axisProps} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
          <Bar dataKey="receitas" name="Receitas" fill="var(--pos)" radius={[5, 5, 0, 0]} />
          <Bar dataKey="despesas" name="Contas" fill="var(--neg)" radius={[5, 5, 0, 0]} />
          <Bar dataKey="guardado" name="Guardado" fill="var(--econ)" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ChartShell>

      <section className="glass rounded-3xl p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-brand/10 text-brand">✦</span>
          <div>
            <h2 className="font-display text-sm font-semibold">Insights do período</h2>
            <p className="text-[10px] text-mut">{comparison ? "Comparação com o ano anterior" : "Comparação com o mês anterior"}</p>
          </div>
        </div>
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/30 px-3 py-2.5">
            <span className="text-mut">Receitas</span>
            <span className="font-medium text-pos">{formatChange(incomeChange)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/30 px-3 py-2.5">
            <span className="text-mut">Contas</span>
            <span className={`font-medium ${expenseChange !== null && expenseChange > 0 ? "text-neg" : "text-pos"}`}>{formatChange(expenseChange)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/30 px-3 py-2.5">
            <span className="text-mut">Guardado</span>
            <span className="font-medium text-econ">{formatChange(savedChange)}</span>
          </div>
        </div>
      </section>
    </section>
  );
}

export function IncomeVsExpenseChart({ rows }: { rows: Row[] }) {
  return (
    <ChartShell title="Receitas x Despesas" rows={rows}>
      <BarChart data={rows}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis {...axisProps} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="receitas" fill="var(--pos)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="despesas" fill="var(--neg)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartShell>
  );
}

export function BalanceEvolutionChart({ rows }: { rows: Row[] }) {
  return (
    <ChartShell title="Evolução do saldo" rows={rows} subtitle={`${rows.length} ${rows.length === 1 ? "mês" : "meses"}`}>
      <LineChart data={rows}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis {...axisProps} />
        <Tooltip {...tooltipStyle} />
        <Line
          type="monotone"
          dataKey="saldo"
          stroke="var(--brand)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "var(--brand)" }}
        />
      </LineChart>
    </ChartShell>
  );
}

export function SavingsChart({ rows }: { rows: Row[] }) {
  return (
    <ChartShell title="Total guardado por mês" rows={rows}>
      <BarChart data={rows}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis {...axisProps} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="guardado" fill="var(--econ)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartShell>
  );
}
