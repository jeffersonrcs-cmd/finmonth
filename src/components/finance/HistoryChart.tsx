import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { computeTotals, formatCurrency, monthLabel, useFinanceState } from "@/lib/finance";

type Row = {
  label: string;
  receitas: number;
  despesas: number;
  saldo: number;
  guardado: number;
};

export function useHistoryRows(limit = 7): Row[] {
  const state = useFinanceState();
  return Object.keys(state.months)
    .sort()
    .slice(-limit)
    .map((key) => {
      const t = computeTotals(state.months[key]!, key);
      return {
        label: monthLabel(key, true),
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
