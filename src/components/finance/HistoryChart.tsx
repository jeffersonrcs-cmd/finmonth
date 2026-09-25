import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  computeTotals,
  currentMonthKey,
  formatCurrency,
  monthLabel,
  useFinanceState,
} from "@/lib/finance";
import { useLanguage } from "@/lib/i18n";

export type ChartRange = 3 | 6 | 12;

type Row = {
  key: string;
  label: string;
  receitas: number;
  despesas: number;
  saldo: number;
  guardado: number;
  isCurrent: boolean;
};

export function useHistoryRows(limit = 7, year?: number): Row[] {
  const state = useFinanceState();
  const safeLimit = Math.min(Math.max(limit, 1), 12);
  const currentKey = currentMonthKey();
  const keys = Object.keys(state.months)
    .filter((key) => key <= currentKey && (!year || key.startsWith(`${year}-`)))
    .sort()
    .slice(-safeLimit);

  return keys.map((key) => {
    const t = computeTotals(state.months[key] ?? { incomes: [], bills: [], savings: [] }, key);
    return {
      key,
      label: monthLabel(key, true),
      receitas: t.totalIncomes,
      despesas: t.totalBills,
      saldo: t.monthBalance,
      guardado: t.totalSaved,
      isCurrent: key === currentKey,
    };
  });
}

function PeriodFilter({
  value,
  onChange,
  label,
}: {
  value: ChartRange;
  onChange: (value: ChartRange) => void;
  label: string;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex shrink-0 gap-1 rounded-xl bg-muted/25 p-1" role="group" aria-label={label}>
      {[3, 6, 12].map((months) => {
        const selected = value === months;
        return (
          <button
            key={months}
            type="button"
            onClick={() => onChange(months as ChartRange)}
            className={`min-h-8 rounded-lg px-2.5 text-[10px] font-semibold transition-all duration-200 ${
              selected
                ? "bg-brand text-background shadow-sm"
                : "text-foreground/75 hover:bg-muted/60 hover:text-foreground active:scale-[0.98]"
            }`}
            aria-pressed={selected}
          >
            {months} {t("months")}
          </button>
        );
      })}
    </div>
  );
}

function ChartShell({
  title,
  rows,
  range,
  onRangeChange,
  children,
}: {
  title: string;
  rows: Row[];
  range: ChartRange;
  onRangeChange: (value: ChartRange) => void;
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <section className="glass mb-4 rounded-3xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="min-w-0 font-display text-sm font-semibold uppercase tracking-wider text-mut">
          {title}
        </h2>
        <PeriodFilter value={range} onChange={onRangeChange} label={t("historyRange")} />
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-mut">{t("insufficientData")}</p>
      ) : (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

const axisProps = {
  dataKey: "label",
  tick: { fontSize: 10, fill: "var(--muted-foreground)" },
  axisLine: false,
  tickLine: false,
};

const yAxisProps = {
  width: 48,
  tick: { fontSize: 9, fill: "var(--muted-foreground)" },
  tickLine: false,
  axisLine: false,
  tickFormatter: (value: number) => formatCurrency(value, true),
};

type TooltipItem = {
  dataKey?: string | number;
  value?: number | string;
};

function FinanceTooltip({
  active,
  payload,
  label,
  fields,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
  fields: Array<{ key: keyof Row; label: string }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0] as TooltipItem & { payload?: Row };
  const source = data.payload;
  if (!source) return null;

  return (
    <div className="min-w-[150px] rounded-xl border border-border bg-popover px-3 py-2.5 text-xs shadow-lg">
      <p className="mb-2 font-semibold text-foreground">{label}</p>
      <div className="space-y-1.5">
        {fields.map(({ key, label: fieldLabel }) => (
          <div key={String(key)} className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{fieldLabel}</span>
            <span
              className={`num font-semibold ${key === "saldo" ? (source.saldo >= 0 ? "text-pos" : "text-neg") : ""}`}
            >
              {formatCurrency(source[key] as number, true)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function sliceRows(rows: Row[], range: ChartRange) {
  return rows.slice(-Math.min(range, 12));
}

export function useAnnualTotals(year: number) {
  const state = useFinanceState();
  const currentKey = currentMonthKey();
  const keys = Array.from(
    { length: 12 },
    (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`,
  ).filter((key) => key <= currentKey);

  return keys.reduce(
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

function formatChange(value: number | null, newLabel: string) {
  if (value === null) return newLabel;
  return `${value >= 0 ? "+" : ""}${Math.round(value)}%`;
}

export function MonthlyOverview({
  rows,
  totals,
  period = "monthly",
  comparison,
}: {
  rows: Row[];
  totals: {
    totalIncomes: number;
    totalBills: number;
    totalSaved: number;
    availableBalance: number;
  };
  period?: "monthly" | "annual";
  comparison?: { totalIncomes: number; totalBills: number; totalSaved: number } | undefined;
}) {
  const { t } = useLanguage();
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
            <h2 className="font-display text-sm font-semibold">{t("overview")}</h2>
            <p className="mt-0.5 text-[11px] text-mut">
              {period === "annual" ? t("selectedYearSummary") : t("selectedMonthSummary")}
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-medium ${balancePositive ? "bg-pos/10 text-pos" : "bg-neg/10 text-neg"}`}
          >
            {balancePositive ? t("positiveBalance") : t("negativeBalance")}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-pos/10 p-3">
            <p className="text-[10px] text-mut">{t("incomes")}</p>
            <p className="num mt-1 font-display text-sm font-semibold text-pos">
              {formatCurrency(totals.totalIncomes, true)}
            </p>
          </div>
          <div className="rounded-2xl bg-neg/10 p-3">
            <p className="text-[10px] text-mut">{t("bills")}</p>
            <p className="num mt-1 font-display text-sm font-semibold text-neg">
              {formatCurrency(totals.totalBills, true)}
            </p>
          </div>
          <div className="rounded-2xl bg-econ/10 p-3">
            <p className="text-[10px] text-mut">{t("savings")}</p>
            <p className="num mt-1 font-display text-sm font-semibold text-econ">
              {formatCurrency(totals.totalSaved, true)}
            </p>
          </div>
          <div className="rounded-2xl bg-brand/10 p-3">
            <p className="text-[10px] text-mut">{t("monthBalance")}</p>
            <p
              className={`num mt-1 font-display text-sm font-semibold ${balancePositive ? "text-brand" : "text-neg"}`}
            >
              {formatCurrency(totals.availableBalance, true)}
            </p>
          </div>
        </div>
      </div>

      <ChartShell
        title={period === "annual" ? t("annualComparison") : t("monthlyComparison")}
        rows={rows}
        range={12}
        onRangeChange={() => {}}
      >
        <BarChart data={rows}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis {...axisProps} />
          <Tooltip
            content={
              <FinanceTooltip
                fields={[
                  { key: "receitas", label: t("incomes") },
                  { key: "despesas", label: t("bills") },
                  { key: "guardado", label: t("savings") },
                ]}
              />
            }
          />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
          <Bar dataKey="receitas" name={t("incomes")} fill="var(--pos)" radius={[5, 5, 0, 0]} />
          <Bar dataKey="despesas" name={t("bills")} fill="var(--neg)" radius={[5, 5, 0, 0]} />
          <Bar dataKey="guardado" name={t("savings")} fill="var(--econ)" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ChartShell>

      <section className="glass rounded-3xl p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-brand/10 text-brand">
            ✦
          </span>
          <div>
            <h2 className="font-display text-sm font-semibold">{t("periodInsights")}</h2>
            <p className="text-[10px] text-mut">
              {comparison ? t("previousYearComparison") : t("previousMonthComparison")}
            </p>
          </div>
        </div>
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/30 px-3 py-2.5">
            <span className="text-mut">{t("incomes")}</span>
            <span className="font-medium text-pos">{formatChange(incomeChange, t("new"))}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/30 px-3 py-2.5">
            <span className="text-mut">{t("bills")}</span>
            <span
              className={`font-medium ${expenseChange !== null && expenseChange > 0 ? "text-neg" : "text-pos"}`}
            >
              {formatChange(expenseChange, t("new"))}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/30 px-3 py-2.5">
            <span className="text-mut">{t("savings")}</span>
            <span className="font-medium text-econ">{formatChange(savedChange, t("new"))}</span>
          </div>
        </div>
      </section>
    </section>
  );
}

export function IncomeVsExpenseChart({
  rows,
  range,
  onRangeChange,
}: {
  rows: Row[];
  range: ChartRange;
  onRangeChange: (value: ChartRange) => void;
}) {
  const { t } = useLanguage();
  const visibleRows = sliceRows(rows, range);
  const fields = [
    { key: "receitas" as const, label: t("incomes") },
    { key: "despesas" as const, label: t("bills") },
    { key: "saldo" as const, label: t("monthBalance") },
  ];

  return (
    <ChartShell
      title={t("incomeExpense")}
      rows={visibleRows}
      range={range}
      onRangeChange={onRangeChange}
    >
      <BarChart
        data={visibleRows}
        margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        barCategoryGap="22%"
      >
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
        <XAxis {...axisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip
          content={<FinanceTooltip fields={fields} />}
          cursor={{ fill: "var(--muted)", opacity: 0.18 }}
        />
        <Bar dataKey="receitas" fill="var(--pos)" radius={[6, 6, 0, 0]} maxBarSize={18}>
          {visibleRows.map((row) => (
            <Cell key={row.key} opacity={row.isCurrent ? 1 : 0.58} />
          ))}
        </Bar>
        <Bar dataKey="despesas" fill="var(--neg)" radius={[6, 6, 0, 0]} maxBarSize={18}>
          {visibleRows.map((row) => (
            <Cell key={row.key} opacity={row.isCurrent ? 1 : 0.58} />
          ))}
        </Bar>
      </BarChart>
    </ChartShell>
  );
}

export function BalanceEvolutionChart({
  rows,
  range,
  onRangeChange,
}: {
  rows: Row[];
  range: ChartRange;
  onRangeChange: (value: ChartRange) => void;
}) {
  const { t } = useLanguage();
  const visibleRows = sliceRows(rows, range);
  const fields = [
    { key: "saldo" as const, label: t("monthBalance") },
    { key: "receitas" as const, label: t("incomes") },
    { key: "despesas" as const, label: t("bills") },
    { key: "guardado" as const, label: t("savings") },
  ];
  const balanceValues = visibleRows.map((row) => row.saldo);
  const minBalance = Math.min(...balanceValues, 0);
  const maxBalance = Math.max(...balanceValues, 0);
  const balanceSpan = maxBalance - minBalance;
  const domainPadding = balanceSpan === 0 ? 1 : Math.max(balanceSpan * 0.08, 1);
  const domainMin = minBalance === 0 ? 0 : minBalance - domainPadding;
  const domainMax = maxBalance === 0 ? 0 : maxBalance + domainPadding;
  const zeroOffset = balanceSpan === 0 ? 0.5 : Math.max(0, Math.min(1, maxBalance / balanceSpan));
  const zeroOffsetPercent = `${zeroOffset * 100}%`;

  return (
    <ChartShell
      title={t("balanceEvolution")}
      rows={visibleRows}
      range={range}
      onRangeChange={onRangeChange}
    >
      <LineChart data={visibleRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balance-line-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--pos)" />
            <stop offset={zeroOffsetPercent} stopColor="var(--pos)" />
            <stop offset={zeroOffsetPercent} stopColor="var(--neg)" />
            <stop offset="100%" stopColor="var(--neg)" />
          </linearGradient>
          <linearGradient id="balance-fill-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--pos)" stopOpacity={0.14} />
            <stop offset={zeroOffsetPercent} stopColor="var(--pos)" stopOpacity={0.1} />
            <stop offset={zeroOffsetPercent} stopColor="var(--neg)" stopOpacity={0.1} />
            <stop offset="100%" stopColor="var(--neg)" stopOpacity={0.14} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
        <XAxis {...axisProps} />
        <YAxis {...yAxisProps} domain={[domainMin, domainMax]} />
        <ReferenceLine
          y={0}
          stroke="var(--muted-foreground)"
          strokeOpacity={0.45}
          strokeDasharray="4 4"
          strokeWidth={1.2}
        />
        <Tooltip
          content={<FinanceTooltip fields={fields} />}
          cursor={{ stroke: "var(--brand)", strokeOpacity: 0.2 }}
        />
        <Area
          type="monotone"
          dataKey="saldo"
          baseValue={0}
          stroke="none"
          fill="url(#balance-fill-gradient)"
        />
        <Line
          type="monotone"
          dataKey="saldo"
          stroke="url(#balance-line-gradient)"
          strokeWidth={3}
          dot={(props) => {
            const row = props.payload as Row;
            const positive = row?.saldo >= 0;
            const active = row?.isCurrent;
            const tone = positive ? "var(--pos)" : "var(--neg)";
            const key = props.key ?? `dot-${row?.key ?? props.cx ?? Math.random()}`;
            return (
              <circle
                key={key}
                cx={props.cx}
                cy={props.cy}
                r={active ? 5 : 3.2}
                fill={tone}
                stroke="var(--background)"
                strokeWidth={active ? 2.5 : 1.5}
              />
            );
          }}
          activeDot={(props: { cx?: number; cy?: number; payload?: Row; key?: string | number }) => {
            const row = props.payload as Row;
            const tone = row?.saldo >= 0 ? "var(--pos)" : "var(--neg)";
            const key = props.key ?? `active-dot-${row?.key ?? props.cx ?? Math.random()}`;
            return (
              <g key={key}>
                <circle cx={props.cx} cy={props.cy} r={9} fill={tone} opacity={0.14} />
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={6.5}
                  fill={tone}
                  stroke="var(--background)"
                  strokeWidth={2.5}
                />
              </g>
            );
          }}
        />
      </LineChart>
    </ChartShell>
  );
}

export function SavingsChart({
  rows,
  range,
  onRangeChange,
}: {
  rows: Row[];
  range: ChartRange;
  onRangeChange: (value: ChartRange) => void;
}) {
  const { t } = useLanguage();
  const visibleRows = sliceRows(rows, range);
  const fields = [
    { key: "guardado" as const, label: t("savings") },
    { key: "saldo" as const, label: t("monthBalance") },
  ];

  return (
    <ChartShell
      title={t("savedPerMonth")}
      rows={visibleRows}
      range={range}
      onRangeChange={onRangeChange}
    >
      <BarChart
        data={visibleRows}
        margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        barCategoryGap="28%"
      >
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
        <XAxis {...axisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip
          content={<FinanceTooltip fields={fields} />}
          cursor={{ fill: "var(--muted)", opacity: 0.18 }}
        />
        <Bar dataKey="guardado" fill="var(--econ)" radius={[7, 7, 0, 0]} maxBarSize={24}>
          {visibleRows.map((row) => (
            <Cell key={row.key} opacity={row.isCurrent ? 1 : 0.62} />
          ))}
        </Bar>
      </BarChart>
    </ChartShell>
  );
}
