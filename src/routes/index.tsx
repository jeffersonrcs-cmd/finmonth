import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MonthNav } from "@/components/finance/MonthNav";
import { SummaryCards } from "@/components/finance/SummaryCards";
import { BillsSection } from "@/components/finance/BillsSection";
import {
  BalanceEvolutionChart,
  IncomeVsExpenseChart,
  useHistoryRows,
} from "@/components/finance/HistoryChart";
import { computeTotals, currentMonthKey, monthLabel, useMonthData } from "@/lib/finance";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FinMês — Controle financeiro pessoal por mês" },
      {
        name: "description",
        content:
          "Organize receitas, contas a pagar e valores guardados mês a mês, com saldos calculados automaticamente.",
      },
      { property: "og:title", content: "FinMês — Controle financeiro pessoal por mês" },
      {
        property: "og:description",
        content:
          "Organize receitas, contas a pagar e valores guardados mês a mês, com saldos calculados automaticamente.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const data = useMonthData(monthKey);
  const totals = computeTotals(data, monthKey);
  const rows = useHistoryRows();

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-brand/25 blur-[90px]" />
      <div className="pointer-events-none absolute -right-24 top-40 size-80 rounded-full bg-accent/25 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 size-72 rounded-full bg-econ/20 blur-[110px]" />

      <div className="relative mx-auto max-w-[440px] px-4 pb-12 pt-5">
        <MonthNav monthKey={monthKey} onChange={setMonthKey} />

        <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-mut">
          {monthLabel(monthKey)}
          {totals.overdueCount > 0 && (
            <span className="ml-2 rounded-full bg-warn/15 px-2 py-0.5 text-warn">
              {totals.overdueCount} vencida(s)
            </span>
          )}
        </p>

        <SummaryCards
          monthKey={monthKey}
          totals={totals}
          incomes={data.incomes}
          savings={data.savings}
        />
        <BillsSection monthKey={monthKey} bills={data.bills} />

        <IncomeVsExpenseChart rows={rows} />
        <BalanceEvolutionChart rows={rows} />

        <div className="mt-6 flex justify-center">
          <Link
            to="/historico"
            className="border-b border-transparent pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-mut transition-colors hover:border-brand/40 hover:text-brand"
          >
            Ver histórico completo
          </Link>
        </div>
      </div>
    </div>
  );
}
