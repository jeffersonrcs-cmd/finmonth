import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, ChevronUp } from "lucide-react";
import {
  BalanceEvolutionChart,
  IncomeVsExpenseChart,
  SavingsChart,
  type ChartRange,
  useHistoryRows,
} from "@/components/finance/HistoryChart";
import {
  computeTotals,
  currentMonthKey,
  formatCurrency,
  monthKeysWithData,
  monthLabel,
  previousMonthKey,
  useFinanceState,
} from "@/lib/finance";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico e gráficos — FinMês" },
      {
        name: "description",
        content:
          "Consulte receitas, contas e economias de meses anteriores e acompanhe a evolução do seu saldo.",
      },
      { property: "og:title", content: "Histórico e gráficos — FinMês" },
      {
        property: "og:description",
        content:
          "Consulte receitas, contas e economias de meses anteriores e acompanhe a evolução do seu saldo.",
      },
    ],
  }),
  component: Historico,
});

function Historico() {
  const { t } = useLanguage();
  const state = useFinanceState();
  const analysisMonthKey = currentMonthKey();
  const rows = useHistoryRows(12);
  const allKeys = monthKeysWithData(state)
    .filter((key) => key <= analysisMonthKey)
    .reverse();
  const years = Array.from(new Set(allKeys.map((key) => Number(key.slice(0, 4))))).sort(
    (a, b) => b - a,
  );
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [historyRange, setHistoryRange] = useState<"3" | "6" | "12" | "older">("12");
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<ChartRange>(6);

  const keys = useMemo(() => {
    const yearKeys =
      selectedYear === "all"
        ? allKeys
        : allKeys.filter((key) => Number(key.slice(0, 4)) === selectedYear);
    if (historyRange === "older") return yearKeys.filter((_, index) => index >= 12);
    return yearKeys.slice(0, Number(historyRange));
  }, [allKeys, selectedYear, historyRange]);

  const latestKey = analysisMonthKey;
  const previousKey = previousMonthKey(analysisMonthKey);
  const latestTotals = computeTotals(
    state.months[latestKey] ?? { incomes: [], bills: [], savings: [] },
    latestKey,
  );
  const previousTotals = computeTotals(
    state.months[previousKey] ?? { incomes: [], bills: [], savings: [] },
    previousKey,
  );

  const changePercent = (current: number, previous: number) =>
    previous === 0 ? (current === 0 ? 0 : null) : ((current - previous) / Math.abs(previous)) * 100;

  const incomeChange =
    latestTotals && previousTotals
      ? changePercent(latestTotals.totalIncomes, previousTotals.totalIncomes)
      : null;
  const expenseChange =
    latestTotals && previousTotals
      ? changePercent(latestTotals.totalBills, previousTotals.totalBills)
      : null;
  const balanceChange =
    latestTotals && previousTotals
      ? changePercent(latestTotals.availableBalance, previousTotals.availableBalance)
      : null;

  const changeLabel = (value: number | null) =>
    value === null ? "—" : `${value >= 0 ? "+" : ""}${Math.round(value)}%`;

  return (
    <div className="relative min-h-screen w-full">
      <div className="pointer-events-none fixed -left-20 -top-24 size-72 rounded-full bg-brand/25 blur-[90px]" />
      <div className="pointer-events-none fixed -right-24 top-40 size-80 rounded-full bg-accent/25 blur-[100px]" />

      <div className="relative mx-auto max-w-[440px] px-4 pb-12 pt-0">
        <header className="sticky top-0 z-40 -mx-4 mb-4 flex items-center gap-3 bg-background/85 px-4 py-3 shadow-sm backdrop-blur-xl transition-all border-b border-border/50">
          <Link
            to="/"
            aria-label={t("back")}
            className="glass-soft grid size-9 shrink-0 place-items-center rounded-full text-brand"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-mut">
              {t("history")}
            </p>
            <h1 className="font-display text-2xl font-bold leading-none">
              {t("financialEvolution")}
            </h1>
            <p className="mt-1 text-[11px] text-mut">{t("historicalDescription")}</p>
          </div>
        </header>

        {latestTotals && (
          <>
            <section className="glass mb-4 rounded-3xl p-4">
              <div className="mb-3">
                <h2 className="font-display text-sm font-semibold">{t("currentSummary")}</h2>
                <p className="text-[10px] text-mut">{monthLabel(latestKey!)}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-brand/10 p-3">
                  <p className="text-[10px] text-mut">{t("currentBalance")}</p>
                  <p
                    className={`num mt-1 font-display text-xs font-semibold ${latestTotals.availableBalance >= 0 ? "text-pos" : "text-neg"}`}
                  >
                    {formatCurrency(latestTotals.availableBalance, true)}
                  </p>
                </div>
                <div className="rounded-2xl bg-pos/10 p-3">
                  <p className="text-[10px] text-mut">{t("totalReceived")}</p>
                  <p className="num mt-1 font-display text-xs font-semibold text-pos">
                    {formatCurrency(latestTotals.totalIncomes, true)}
                  </p>
                </div>
                <div className="rounded-2xl bg-neg/10 p-3">
                  <p className="text-[10px] text-mut">{t("totalSpent")}</p>
                  <p className="num mt-1 font-display text-xs font-semibold text-neg">
                    {formatCurrency(latestTotals.totalBills, true)}
                  </p>
                </div>
              </div>
            </section>

            {previousTotals && (
              <section className="glass mb-4 rounded-3xl p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-sm font-semibold">{t("monthlyComparison")}</h2>
                    <p className="mt-0.5 text-[10px] text-mut">
                      {monthLabel(latestKey!)} · {t("vsPrevious")} · {monthLabel(previousKey!)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    [t("incomes"), incomeChange, "text-pos"],
                    [t("bills"), expenseChange, "text-neg"],
                    [
                      t("monthBalance"),
                      balanceChange,
                      latestTotals.availableBalance >= 0 ? "text-pos" : "text-neg",
                    ],
                  ].map(([label, value, tone]) => (
                    <div key={String(label)} className="rounded-2xl bg-muted/30 p-3">
                      <p className="text-[10px] text-mut">{String(label)}</p>
                      <p className={`mt-1 font-display text-sm font-semibold ${String(tone)}`}>
                        {changeLabel(value as number | null)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <IncomeVsExpenseChart rows={rows} range={chartRange} onRangeChange={setChartRange} />
        <BalanceEvolutionChart rows={rows} range={chartRange} onRangeChange={setChartRange} />
        <SavingsChart rows={rows} range={chartRange} onRangeChange={setChartRange} />

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-semibold">{t("monthlyHistory")}</h2>
              <p className="text-[10px] text-mut">{t("tapMonthDetails")}</p>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-4 gap-1.5">
            {[
              ["3", t("history3Months")],
              ["6", t("history6Months")],
              ["12", t("history12Months")],
              ["older", t("historyAbove12Months")],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setHistoryRange(value as typeof historyRange)}
                className={`min-h-8 min-w-0 rounded-lg px-1.5 text-center text-[9px] font-semibold leading-tight transition-colors ${historyRange === value ? "bg-brand text-background" : "bg-muted/40 text-mut hover:bg-muted/70"}`}
                aria-pressed={historyRange === value}
              >
                {label}
              </button>
            ))}
          </div>

          {years.length > 1 && (
            <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedYear("all")}
                className={`min-h-8 shrink-0 rounded-lg px-3 text-[10px] font-semibold ${selectedYear === "all" ? "bg-brand text-background" : "bg-muted/40 text-mut"}`}
              >
                {t("allYears")}
              </button>
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  className={`min-h-8 shrink-0 rounded-lg px-3 text-[10px] font-semibold ${selectedYear === year ? "bg-brand text-background" : "bg-muted/40 text-mut"}`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2.5">
            {keys.length === 0 && (
              <p className="glass-soft rounded-2xl p-4 text-center text-xs text-mut">
                {t("noMonth")}
              </p>
            )}
            {keys.map((key) => {
              const month = state.months[key]!;
              const totals = computeTotals(month, key);
              const expanded = expandedMonth === key;
              const showBalance = true;
              const showIncome = true;
              const showExpense = true;
              return (
                <div key={key} className="glass overflow-hidden rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setExpandedMonth(expanded ? null : key)}
                    className="w-full p-4 text-left"
                    aria-expanded={expanded}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-display text-sm font-semibold">{monthLabel(key)}</p>
                      {expanded ? (
                        <ChevronUp className="size-4 text-mut" />
                      ) : (
                        <ChevronDown className="size-4 text-mut" />
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                      {showIncome && (
                        <span className="text-mut">
                          {t("incomes")}{" "}
                          <span className="num block text-pos">
                            {formatCurrency(totals.totalIncomes, true)}
                          </span>
                        </span>
                      )}
                      {showExpense && (
                        <span className="text-mut">
                          {t("bills")}{" "}
                          <span className="num block text-neg">
                            {formatCurrency(totals.totalBills, true)}
                          </span>
                        </span>
                      )}
                      {showBalance && (
                        <span className="text-mut">
                          {t("monthBalance")}{" "}
                          <span
                            className={`num block ${totals.availableBalance >= 0 ? "text-pos" : "text-neg"}`}
                          >
                            {formatCurrency(totals.availableBalance, true)}
                          </span>
                        </span>
                      )}
                    </div>
                  </button>
                  {expanded && (
                    <div className="border-t border-border/60 px-4 pb-4 pt-3">
                      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-mut">
                        <span>
                          {totals.paidCount} {t("paid").toLowerCase()}
                        </span>
                        <span>
                          {totals.pendingCount} {t("pending").toLowerCase()}
                        </span>
                        {totals.overdueCount > 0 && (
                          <span>
                            {totals.overdueCount} {t("overdue").toLowerCase()}
                          </span>
                        )}
                        <span>
                          {totals.totalSaved
                            ? `${t("savings")}: ${formatCurrency(totals.totalSaved, true)}`
                            : ""}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {month.incomes.length > 0 && (
                          <div>
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-pos">
                              {t("incomes")}
                            </p>
                            {month.incomes.map((item) => (
                              <div key={item.id} className="flex justify-between gap-3 text-xs">
                                <span className="truncate">{item.description}</span>
                                <span className="num text-pos">
                                  {formatCurrency(item.amount, true)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {month.bills.length > 0 && (
                          <div>
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neg">
                              {t("bills")}
                            </p>
                            {month.bills.map((item) => (
                              <div key={item.id} className="flex justify-between gap-3 text-xs">
                                <span className="truncate">{item.description}</span>
                                <span className="num text-neg">
                                  {formatCurrency(item.amount, true)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {month.savings.length > 0 && (
                          <div>
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-econ">
                              {t("savings")}
                            </p>
                            {month.savings.map((item) => (
                              <div key={item.id} className="flex justify-between gap-3 text-xs">
                                <span className="truncate">{item.description}</span>
                                <span className="num text-econ">
                                  {formatCurrency(item.amount, true)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
