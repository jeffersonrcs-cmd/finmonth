import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import {
  BalanceEvolutionChart,
  IncomeVsExpenseChart,
  SavingsChart,
  useHistoryRows,
} from "@/components/finance/HistoryChart";
import {
  computeTotals,
  formatCurrency,
  monthKeysWithData,
  monthLabel,
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
  const rows = useHistoryRows(12);
  const keys = monthKeysWithData(state).reverse();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-brand/25 blur-[90px]" />
      <div className="pointer-events-none absolute -right-24 top-40 size-80 rounded-full bg-accent/25 blur-[100px]" />

      <div className="relative mx-auto max-w-[440px] px-4 pb-12 pt-5">
        <header className="mb-5 flex items-center gap-3">
          <Link
            to="/"
            aria-label={t("back")}
            className="glass-soft grid size-9 place-items-center rounded-full text-brand"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-mut">{t("history")}</p>
            <h1 className="font-display text-2xl font-bold leading-none">{t("allMonths")}</h1>
          </div>
        </header>

        <IncomeVsExpenseChart rows={rows} />
        <BalanceEvolutionChart rows={rows} />
        <SavingsChart rows={rows} />

        <div className="mt-6 space-y-2.5">
          {keys.length === 0 && (
            <p className="glass-soft rounded-2xl p-4 text-center text-xs text-mut">
              {t("noMonth")}
            </p>
          )}
          {keys.map((key) => {
            const totals = computeTotals(state.months[key]!, key);
            return (
              <div key={key} className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm font-semibold">{monthLabel(key)}</p>
                  <span
                    className={`num font-display text-sm font-semibold ${
                      totals.availableBalance >= 0 ? "text-pos" : "text-neg"
                    }`}
                  >
                    {formatCurrency(t.availableBalance)}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                  <span className="text-mut">
                    {t("incomes")} <span className="num block text-pos">{formatCurrency(totals.totalIncomes, true)}</span>
                  </span>
                  <span className="text-mut">
                    {t("bills")} <span className="num block text-neg">{formatCurrency(totals.totalBills, true)}</span>
                  </span>
                  <span className="text-mut">
                    {t("savings")} <span className="num block text-econ">{formatCurrency(totals.totalSaved, true)}</span>
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-mut">
                  {totals.paidCount} {t("paid").toLowerCase()} · {totals.pendingCount} {t("pending").toLowerCase()}
                  {totals.overdueCount > 0 ? ` · ${totals.overdueCount} ${t("overdue").toLowerCase()}` : ""}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
