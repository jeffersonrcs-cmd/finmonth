import { createFileRoute } from "@tanstack/react-router";
import { Home, PiggyBank, ReceiptText, Sparkles, WalletCards, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { MonthNav } from "@/components/finance/MonthNav";
import { AccountSettings } from "@/components/finance/AccountSettings";
import { NotificationsPanel } from "@/components/finance/NotificationsPanel";
import { SummaryCards } from "@/components/finance/SummaryCards";
import { BillsSection } from "@/components/finance/BillsSection";
import { AccountsList, IncomeList, SavingsList } from "@/components/finance/FinanceLists";
import { FinAi } from "@/components/finance/FinAI";
import {
  computeTotals,
  currentMonthKey,
  monthLabel,
  useMonthData,
  useFinanceState,
  getBillNotifications,
} from "@/lib/finance";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FinMonth — Controle financeiro pessoal por mês" },
      {
        name: "description",
        content:
          "Organize receitas, contas a pagar e valores guardados mês a mês, com saldos calculados automaticamente.",
      },
      { property: "og:title", content: "FinMonth — Controle financeiro pessoal por mês" },
      {
        property: "og:description",
        content:
          "Organize receitas, contas a pagar e valores guardados mês a mês, com saldos calculados automaticamente.",
      },
    ],
  }),
  component: Dashboard,
});

type Screen = "inicio" | "contas" | "receitas" | "guardado" | "finai";

const navigation: {
  id: Screen;
  label: "home" | "bills" | "incomes" | "savings" | "finai";
  Icon: LucideIcon;
}[] = [
  { id: "inicio", label: "home", Icon: Home },
  { id: "contas", label: "bills", Icon: ReceiptText },
  { id: "receitas", label: "incomes", Icon: WalletCards },
  { id: "guardado", label: "savings", Icon: PiggyBank },
  { id: "finai", label: "finai", Icon: Sparkles },
];

function Dashboard() {
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [activeScreen, setActiveScreen] = useState<Screen>("inicio");
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [accountSettingsSection, setAccountSettingsSection] = useState<
    "menu" | "profile" | "notifications" | "language" | "version"
  >("menu");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { t } = useLanguage();
  const financeState = useFinanceState();
  const notifications = getBillNotifications(financeState);
  const data = useMonthData(monthKey);
  const totals = computeTotals(data, monthKey);
  const selectedYear = Number(monthKey.slice(0, 4));

  useEffect(() => {
    const open = () => setNotificationsOpen(true);
    window.addEventListener("finmonth:open-notifications", open);
    return () => window.removeEventListener("finmonth:open-notifications", open);
  }, []);

  const goTo = (screen: Screen) => {
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (accountSettingsOpen) {
    return (
      <div className="relative min-h-screen w-full">
        <div className="pointer-events-none fixed -left-20 -top-24 size-72 rounded-full bg-brand/25 blur-[90px]" />
        <div className="pointer-events-none fixed -right-24 top-40 size-80 rounded-full bg-accent/25 blur-[100px]" />
        <div className="relative mx-auto max-w-[440px] px-4 pb-8 pt-5">
          <AccountSettings
            section={accountSettingsSection}
            onBack={() => setAccountSettingsOpen(false)}
            onOpenSection={(section) => setAccountSettingsSection(section)}
            onSignOut={() =>
              void import("@/lib/supabase").then(({ supabase }) => supabase.auth.signOut())
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full">
      <div className="pointer-events-none fixed -left-20 -top-24 size-72 rounded-full bg-brand/25 blur-[90px]" />
      <div className="pointer-events-none fixed -right-24 top-40 size-80 rounded-full bg-accent/25 blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-1/3 size-72 rounded-full bg-econ/20 blur-[110px]" />

      {notificationsOpen && (
        <NotificationsPanel
          notifications={notifications}
          onClose={() => setNotificationsOpen(false)}
        />
      )}

      <div className="relative mx-auto max-w-[440px] px-4 pb-24 pt-0">
        <MonthNav
          monthKey={monthKey}
          onChange={setMonthKey}
          onOpenSettings={() => {
            setAccountSettingsSection("menu");
            setAccountSettingsOpen(true);
          }}
          onOpenVersion={() => {
            setAccountSettingsSection("version");
            setAccountSettingsOpen(true);
          }}
          onOpenNotifications={() => {
            setNotificationsOpen(true);
          }}
        />

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
            <SummaryCards
              monthKey={monthKey}
              totals={totals}
              incomes={data.incomes}
              bills={data.bills}
              savings={data.savings}
            />
            <BillsSection monthKey={monthKey} bills={data.bills} />
          </>
        )}

        {activeScreen === "contas" && <AccountsList monthKey={monthKey} bills={data.bills} />}

        {activeScreen === "receitas" && <IncomeList monthKey={monthKey} incomes={data.incomes} />}

        {activeScreen === "guardado" && <SavingsList monthKey={monthKey} savings={data.savings} />}

        {activeScreen === "finai" && <FinAi monthKey={monthKey} />}
      </div>

      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-24 z-10 px-5">
        <div className="mx-auto flex max-w-[440px] justify-end">
          <div className="flex flex-col items-end leading-none">
            <span className="select-none text-[10px] font-semibold uppercase tracking-[0.28em] text-mut/30">
              FinMonth
            </span>
            <span className="mt-0.5 select-none text-[7px] font-medium tracking-[0.16em] text-mut/25">
              v{__FINMONTH_VERSION__}
            </span>
          </div>
        </div>
      </div>

      <nav
        aria-label={t("navigation")}
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
                <span className="truncate">{t(label)}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
