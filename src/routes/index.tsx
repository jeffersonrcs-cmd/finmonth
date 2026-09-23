import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Home, PiggyBank, ReceiptText, WalletCards, type LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { MonthNav } from "@/components/finance/MonthNav";
import { AccountSettings } from "@/components/finance/AccountSettings";
import { SummaryCards } from "@/components/finance/SummaryCards";
import { BillsSection } from "@/components/finance/BillsSection";
import { AccountsList, IncomeList, SavingsList } from "@/components/finance/FinanceLists";
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

type Screen = "inicio" | "contas" | "receitas" | "guardado" | "graficos";

const navigation: { id: Screen; label: string; Icon: LucideIcon }[] = [
  { id: "inicio", label: "Início", Icon: Home },
  { id: "contas", label: "Contas", Icon: ReceiptText },
  { id: "receitas", label: "Receitas", Icon: WalletCards },
  { id: "guardado", label: "Guardado", Icon: PiggyBank },
  { id: "graficos", label: "Gráficos", Icon: BarChart3 },
];

function Dashboard() {
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [activeScreen, setActiveScreen] = useState<Screen>("inicio");
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const data = useMonthData(monthKey);
  const totals = computeTotals(data, monthKey);
  const rows = useHistoryRows();

  const goTo = (screen: Screen) => {
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;

    const endX = event.changedTouches[0]?.clientX;
    const deltaX = endX === undefined ? 0 : endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < 50) return;

    const currentIndex = navigation.findIndex(({ id }) => id === activeScreen);
    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    const nextScreen = navigation[nextIndex]?.id;

    if (nextScreen) goTo(nextScreen);
  };

  if (accountSettingsOpen) {
    return (
      <div\n      className="relative min-h-screen w-full overflow-x-hidden"\n      onTouchStart={handleTouchStart}\n      onTouchEnd={handleTouchEnd}\n    >
        <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-brand/25 blur-[90px]" />
        <div className="pointer-events-none absolute -right-24 top-40 size-80 rounded-full bg-accent/25 blur-[100px]" />
        <div className="relative mx-auto max-w-[440px] px-4 pb-8 pt-5">
          <AccountSettings onBack={() => setAccountSettingsOpen(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-brand/25 blur-[90px]" />
      <div className="pointer-events-none absolute -right-24 top-40 size-80 rounded-full bg-accent/25 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 size-72 rounded-full bg-econ/20 blur-[110px]" />

      <div className="relative mx-auto max-w-[440px] px-4 pb-24 pt-5">
        <MonthNav monthKey={monthKey} onChange={setMonthKey} onOpenSettings={() => setAccountSettingsOpen(true)} />

        {activeScreen === "inicio" && (
          <>
            <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-mut">
              {monthLabel(monthKey)}
              {totals.overdueCount > 0 && (
                <span className="ml-2 rounded-full bg-warn/15 px-2 py-0.5 text-warn">
                  {totals.overdueCount} vencida(s)
                </span>
              )}
            </p>
            <SummaryCards monthKey={monthKey} totals={totals} incomes={data.incomes} bills={data.bills} savings={data.savings} />
            <BillsSection monthKey={monthKey} bills={data.bills} />
          </>
        )}

        {activeScreen === "contas" && <AccountsList monthKey={monthKey} bills={data.bills} />}

        {activeScreen === "receitas" && <IncomeList monthKey={monthKey} incomes={data.incomes} />}

        {activeScreen === "guardado" && <SavingsList monthKey={monthKey} savings={data.savings} />}

        {activeScreen === "graficos" && (
          <section className="space-y-4">
            <div>
              <h1 className="font-display text-lg font-semibold">Gráficos</h1>
              <p className="mt-1 text-xs text-mut">Somente os gráficos da sua evolução financeira.</p>
            </div>
            <IncomeVsExpenseChart rows={rows} />
            <BalanceEvolutionChart rows={rows} />
          </section>
        )}

        {activeScreen === "inicio" && (
          <div className="mt-6 flex justify-center">
            <Link
              to="/historico"
              className="border-b border-transparent pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-mut transition-colors hover:border-brand/40 hover:text-brand"
            >
              Ver histórico completo
            </Link>
          </div>
        )}
      </div>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl"
      >
        <div className="mx-auto grid max-w-[440px] grid-cols-5 gap-1 rounded-2xl bg-muted/30 p-1">
          {navigation.map(({ id, label, Icon }) => {
            const active = activeScreen === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[9px] font-medium transition-colors ${active ? "bg-brand/10 text-brand" : "text-mut hover:bg-muted/50 hover:text-brand"}`}
              >
                <Icon className="size-4" strokeWidth={active ? 2.2 : 1.8} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>    </div>
  );
}
