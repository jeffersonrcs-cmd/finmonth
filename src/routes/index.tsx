import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Home, PiggyBank, ReceiptText, WalletCards } from "lucide-react";
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

      <div className="relative mx-auto max-w-[440px] px-4 pb-24 pt-5">
        <MonthNav monthKey={monthKey} onChange={setMonthKey} />

        <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-mut">
          {monthLabel(monthKey)}
          {totals.overdueCount > 0 && (
            <span className="ml-2 rounded-full bg-warn/15 px-2 py-0.5 text-warn">
              {totals.overdueCount} vencida(s)
            </span>
          )}
        </p>

        <div id="inicio" className="scroll-mt-4">
          <SummaryCards
            monthKey={monthKey}
            totals={totals}
            incomes={data.incomes}
            savings={data.savings}
          />
        </div>
        <div id="contas" className="scroll-mt-4">
          <BillsSection monthKey={monthKey} bills={data.bills} />
        </div>

        <section id="graficos" className="scroll-mt-4 border-t border-border/50 pt-5">
          <div className="mb-4">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-mut">
              Análises
            </h2>
            <p className="mt-1 text-[10px] text-mut">Acompanhe a evolução das suas finanças.</p>
          </div>
          <IncomeVsExpenseChart rows={rows} />
          <BalanceEvolutionChart rows={rows} />
        </section>

        <div className="mt-6 flex justify-center">
          <Link
            to="/historico"
            className="border-b border-transparent pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-mut transition-colors hover:border-brand/40 hover:text-brand"
          >
            Ver histórico completo
          </Link>
        </div>
      </div>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl"
      >
        <div className="mx-auto grid max-w-[440px] grid-cols-5 gap-1">
          {[
            { id: "inicio", label: "Início", Icon: Home },
            { id: "contas", label: "Contas", Icon: ReceiptText },
            { id: "receitas", label: "Receitas", Icon: WalletCards },
            { id: "guardado", label: "Guardado", Icon: PiggyBank },
            { id: "graficos", label: "Gráficos", Icon: BarChart3 },
          ].map(({ id, label, Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-medium text-mut transition-colors hover:bg-muted/50 hover:text-brand"
            >
              <Icon className="size-4" strokeWidth={1.8} />
              <span className="truncate">{label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
