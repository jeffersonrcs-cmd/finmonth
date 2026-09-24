import { useState } from "react";
import { Bell, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { financeActions, getBillNotifications, monthLabel, shiftMonthKey, useFinanceState } from "@/lib/finance";

export function MonthNav({
  monthKey,
  onChange,
  onOpenSettings,
  onOpenNotifications,
  onOpenVersion,
}: {
  monthKey: string;
  onChange: (key: string) => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenVersion: () => void;
}) {
  const financeState = useFinanceState();
  const { userName } = financeState;
  const notificationCount = getBillNotifications(financeState).length;
  const displayName = userName.trim() || "Minha conta";

  return (
    <header className="mb-5 flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-mut">Finanças</p>
        <button
          type="button"
          onClick={(event) => {
            onOpenSettings();
            event.currentTarget.blur();
          }}
          className="flex items-center gap-2 font-display text-left text-2xl font-bold leading-none outline-none shadow-none transition-colors hover:text-brand focus:outline-none focus:ring-0 focus:shadow-none active:shadow-none [-webkit-tap-highlight-color:transparent]"
          aria-label="Abrir configurações"
        >
          {displayName}
          <UserRound className="size-4 text-mut" />
        </button>

      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            window.dispatchEvent(new CustomEvent("finmonth:open-notifications"));
            event.currentTarget.blur();
          }}
          aria-label={notificationCount ? `Abrir notificações (${notificationCount})` : "Abrir notificações"}
          className="grid size-9 place-items-center rounded-full border border-border bg-muted/40 text-mut outline-none shadow-none focus:outline-none focus:ring-0 focus:shadow-none active:shadow-none [-webkit-tap-highlight-color:transparent]"
        >
          <Bell className="size-4" />
          {notificationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-neg px-1 text-[8px] font-bold leading-4 text-background">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={(event) => {
            onChange(shiftMonthKey(monthKey, -1));
            event.currentTarget.blur();
          }}
          aria-label="Mês anterior"
          className="grid size-9 place-items-center rounded-full border border-border bg-muted/40 text-brand outline-none shadow-none focus:outline-none focus:ring-0 focus:shadow-none active:shadow-none [-webkit-tap-highlight-color:transparent]"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="glass-soft num rounded-full px-3 py-1.5 text-xs font-medium">{monthLabel(monthKey, true)}</div>
        <button
          type="button"
          onClick={(event) => {
            onChange(shiftMonthKey(monthKey, 1));
            event.currentTarget.blur();
          }}
          aria-label="Próximo mês"
          className="grid size-9 place-items-center rounded-full border border-border bg-muted/40 text-brand outline-none shadow-none focus:outline-none focus:ring-0 focus:shadow-none active:shadow-none [-webkit-tap-highlight-color:transparent]"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </header>
  );
}
