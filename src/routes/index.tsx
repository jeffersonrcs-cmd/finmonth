import { createFileRoute } from "@tanstack/react-router";
import { Home, PiggyBank, ReceiptText, Settings, Sparkles, WalletCards, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { MonthNav } from "@/components/finance/MonthNav";
import { AccountSettings } from "@/components/finance/AccountSettings";
import { NotificationsPanel } from "@/components/finance/NotificationsPanel";
import { SummaryCards } from "@/components/finance/SummaryCards";
import { BillsSection } from "@/components/finance/BillsSection";
import { AccountsList, IncomeList, SavingsList } from "@/components/finance/FinanceLists";
import { FinAi, type FinAiEntryType } from "@/components/finance/FinAI";
import {
  computeTotals,
  currentMonthKey,
  monthLabel,
  useMonthData,
  useFinanceState,
  getBillNotifications,
  shiftMonthKey,
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

type Screen = "inicio" | "contas" | "receitas" | "guardado";

type NavigationId = Screen | "settings";

const navigation: {
  id: NavigationId;
  label: "home" | "bills" | "incomes" | "savings" | "settings";
  Icon: LucideIcon;
}[] = [
  { id: "inicio", label: "home", Icon: Home },
  { id: "contas", label: "bills", Icon: ReceiptText },
  { id: "receitas", label: "incomes", Icon: WalletCards },
  { id: "guardado", label: "savings", Icon: PiggyBank },
  { id: "settings", label: "settings", Icon: Settings },
];

function MonthContent({ monthKey, activeScreen, onOpenFinAi }: { monthKey: string; activeScreen: Screen; onOpenFinAi: (entryType: FinAiEntryType) => void }) {
  const { t } = useLanguage();
  const data = useMonthData(monthKey);
  const totals = computeTotals(data, monthKey);

  return (
    <>
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
            onOpenFinAi={onOpenFinAi}
          />
          <BillsSection monthKey={monthKey} bills={data.bills} />
        </>
      )}

      {activeScreen === "contas" && <AccountsList monthKey={monthKey} bills={data.bills} />}
      {activeScreen === "receitas" && <IncomeList monthKey={monthKey} incomes={data.incomes} />}
      {activeScreen === "guardado" && <SavingsList monthKey={monthKey} savings={data.savings} />}
    </>
  );
}

function Dashboard() {
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [activeScreen, setActiveScreen] = useState<Screen>("inicio");
  const [finAiOpen, setFinAiOpen] = useState(false);
  const [finAiEntryType, setFinAiEntryType] = useState<FinAiEntryType | undefined>(undefined);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [accountSettingsSection, setAccountSettingsSection] = useState<
    "menu" | "profile" | "notifications" | "language" | "version"
  >("menu");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [swipePhase, setSwipePhase] = useState<"idle" | "dragging" | "settling">("idle");
  const swipeStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const swipeWidthRef = useRef(0);
  const swipeTargetRef = useRef<"next" | "previous" | null>(null);
  const swipeResetTimerRef = useRef<number | null>(null);
  const swipeActiveRef = useRef(false);
  const { t } = useLanguage();
  const financeState = useFinanceState();
  const notifications = getBillNotifications(financeState);
  useEffect(() => {
    const open = () => setNotificationsOpen(true);
    window.addEventListener("finmonth:open-notifications", open);
    return () => window.removeEventListener("finmonth:open-notifications", open);
  }, []);

  const handleOpenFinAi = (entryType?: FinAiEntryType) => {
    setFinAiEntryType(entryType);
    setFinAiOpen(true);
  };

  const handleMonthChange = (nextMonthKey: string) => {
    setMonthKey(nextMonthKey);
    setSwipeX(0);
    setSwipePhase("idle");
    swipeTargetRef.current = null;
  };

  const handleNavClick = (id: NavigationId) => {
    if (id === "settings") {
      setAccountSettingsSection("menu");
      setAccountSettingsOpen(true);
      return;
    }

    setActiveScreen(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSwipeStart = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    if (swipeResetTimerRef.current !== null) {
      window.clearTimeout(swipeResetTimerRef.current);
      swipeResetTimerRef.current = null;
    }

    swipeWidthRef.current = event.currentTarget.clientWidth;
    swipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
    swipeActiveRef.current = false;
    swipeTargetRef.current = null;
    setSwipePhase("dragging");
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleSwipeMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;

    if (!swipeActiveRef.current) {
      if (Math.abs(deltaX) < 12 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.1) return;
      swipeActiveRef.current = true;
    }

    if (swipeActiveRef.current) {
      event.preventDefault();
      const width = swipeWidthRef.current;
      if (!width) return;

      const boundedDelta = Math.max(-width, Math.min(width, deltaX));
      setSwipeX(boundedDelta);
    }
  };

  const finishSwipe = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const start = swipeStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const width = swipeWidthRef.current;
    const wasHorizontal = swipeActiveRef.current;
    const threshold = Math.max(64, width * 0.2);
    const shouldChange =
      !cancelled &&
      wasHorizontal &&
      width > 0 &&
      Math.abs(deltaX) >= threshold &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.1;

    swipeStartRef.current = null;
    swipeActiveRef.current = false;

    if (!shouldChange) {
      swipeTargetRef.current = null;
      setSwipePhase("settling");
      setSwipeX(0);
      swipeResetTimerRef.current = window.setTimeout(() => {
        setSwipePhase("idle");
        swipeResetTimerRef.current = null;
      }, 220);
      return;
    }

    const direction = deltaX < 0 ? "next" : "previous";
    swipeTargetRef.current = direction;
    setSwipePhase("settling");
    setSwipeX(deltaX < 0 ? -width : width);

    swipeResetTimerRef.current = window.setTimeout(() => {
      setMonthKey((currentMonth) =>
        shiftMonthKey(currentMonth, direction === "next" ? 1 : -1),
      );
      setSwipeX(0);
      setSwipePhase("idle");
      swipeTargetRef.current = null;
      swipeResetTimerRef.current = null;
    }, 220);
  };

  const handleSwipeEnd = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    finishSwipe(event);
  };

  const handleSwipeCancel = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    finishSwipe(event, true);
  };

  if (accountSettingsOpen) {
    return (
      <div className="relative min-h-screen w-full">
        <div className="pointer-events-none fixed -left-20 -top-24 size-72 rounded-full bg-brand/25 blur-[90px]" />
        <div className="pointer-events-none fixed -right-24 top-40 size-80 rounded-full bg-accent/25 blur-[100px]" />
        <div className="relative mx-auto max-w-[440px] px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-[calc(env(safe-area-inset-top)+1rem)]">
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
    <div
      className="relative min-h-screen w-full"
      style={{ touchAction: "pan-y" }}
      onPointerDown={handleSwipeStart}
      onPointerMove={handleSwipeMove}
      onPointerUp={handleSwipeEnd}
      onPointerCancel={handleSwipeCancel}
    >
      <div className="pointer-events-none fixed -left-20 -top-24 size-72 rounded-full bg-brand/25 blur-[90px]" />
      <div className="pointer-events-none fixed -right-24 top-40 size-80 rounded-full bg-accent/25 blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-1/3 size-72 rounded-full bg-econ/20 blur-[110px]" />

      {notificationsOpen && (
        <NotificationsPanel
          notifications={notifications}
          onClose={() => setNotificationsOpen(false)}
        />
      )}

      {/* Floating FinAI Window */}
      {finAiOpen && (
        <div
          className="fixed inset-0 z-[90] bg-background/70 backdrop-blur-sm"
          onClick={() => setFinAiOpen(false)}
        >
          <section
            className="absolute inset-x-3 top-[calc(env(safe-area-inset-top)+1rem)] mx-auto flex h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem)] max-w-[440px] flex-col overflow-hidden rounded-3xl border border-border bg-popover shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <FinAi
              monthKey={monthKey}
              isFloating
              entryType={finAiEntryType}
              onClose={() => {
                setFinAiOpen(false);
                setFinAiEntryType(undefined);
              }}
            />
          </section>
        </div>
      )}

      <div className="relative mx-auto max-w-[440px] px-4 pb-24 pt-0">
        <MonthNav
          monthKey={monthKey}
          onChange={handleMonthChange}
          onOpenNotifications={() => {
            setNotificationsOpen(true);
          }}
        />

        <div
          ref={(element) => {
            if (element) swipeWidthRef.current = element.clientWidth;
          }}
          className="overflow-hidden"
        >
          <div
            className="flex w-[300%]"
            style={{
              transform: `translate3d(calc(-33.333333% + ${swipeX}px), 0, 0)`,
              transition:
                swipePhase === "settling"
                  ? "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)"
                  : "none",
            }}
          >
            <div className="w-1/3 shrink-0 px-0">
              <MonthContent monthKey={shiftMonthKey(monthKey, -1)} activeScreen={activeScreen} onOpenFinAi={handleOpenFinAi} />
            </div>
            <div className="w-1/3 shrink-0 px-0">
              <MonthContent monthKey={monthKey} activeScreen={activeScreen} onOpenFinAi={handleOpenFinAi} />
            </div>
            <div className="w-1/3 shrink-0 px-0">
              <MonthContent monthKey={shiftMonthKey(monthKey, 1)} activeScreen={activeScreen} onOpenFinAi={handleOpenFinAi} />
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-10 px-5"
      >
        <div className="mx-auto flex max-w-[440px] justify-start">
          <div className="flex flex-col items-start leading-none">
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
            const active = id === "settings" ? accountSettingsOpen : activeScreen === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleNavClick(id)}
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

      <button
        type="button"
        onClick={() => setFinAiOpen(true)}
        aria-label={t("finai")}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] right-[max(1.25rem,calc((100vw-440px)/2+1.25rem))] z-40 grid size-14 place-items-center rounded-full border border-brand/30 bg-brand text-background shadow-lg shadow-brand/20 transition-transform hover:scale-105 active:scale-95"
      >
        <Sparkles className="size-6" />
      </button>
    </div>
  );
}
