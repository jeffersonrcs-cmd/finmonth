import { useEffect, useRef, useState } from "react";
import { Bell, ChevronLeft, ChevronRight, LogOut, Moon, Settings, Sun, UserRound } from "lucide-react";
import { financeActions, getBillNotifications, monthLabel, shiftMonthKey, useFinanceState } from "@/lib/finance";
import { supabase } from "@/lib/supabase";

export function MonthNav({
  monthKey,
  onChange,
  onOpenSettings,
  onOpenNotifications,
}: {
  monthKey: string;
  onChange: (key: string) => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
}) {
  const financeState = useFinanceState();
  const { theme, userName } = financeState;
  const notificationCount = getBillNotifications(financeState).length;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = userName.trim() || "Minha conta";

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <header className="mb-5 flex items-center justify-between gap-3">
      <div ref={menuRef} className="relative">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-mut">Finanças</p>
        <button
          type="button"
          onClick={(event) => {
            setMenuOpen((value) => !value);
            event.currentTarget.blur();
          }}
          className="flex items-center gap-2 font-display text-left text-2xl font-bold leading-none outline-none shadow-none transition-colors hover:text-brand focus:outline-none focus:ring-0 focus:shadow-none active:shadow-none [-webkit-tap-highlight-color:transparent]"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          {displayName}
          <UserRound className="size-4 text-mut" />
        </button>

        {menuOpen && (
          <div className="absolute left-0 top-full z-50 mt-3 w-56 rounded-2xl border border-border bg-popover p-1.5 shadow-none">
            <button
              type="button"
              onClick={(event) => {
                setMenuOpen(false);
                onOpenSettings();
                event.currentTarget.blur();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium outline-none shadow-none focus:outline-none focus:ring-0 focus:shadow-none active:shadow-none [-webkit-tap-highlight-color:transparent]"
            >
              <Settings className="size-4 text-mut" />
              Editar dados do usuário
            </button>
            <button
              type="button"
              onClick={(event) => {
                setMenuOpen(false);
                onOpenNotifications();
                event.currentTarget.blur();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium outline-none shadow-none focus:outline-none focus:ring-0 focus:shadow-none active:shadow-none [-webkit-tap-highlight-color:transparent]"
            >
              <Bell className="size-4 text-mut" />
              Notificações
            </button>
            <button
              type="button"
              onClick={(event) => {
                financeActions.setTheme(theme === "dark" ? "light" : "dark");
                event.currentTarget.blur();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium outline-none shadow-none focus:outline-none focus:ring-0 focus:shadow-none active:shadow-none [-webkit-tap-highlight-color:transparent]"
              aria-label="Alternar tema"
            >
              {theme === "dark" ? <Sun className="size-4 text-mut" /> : <Moon className="size-4 text-mut" />}
              {theme === "dark" ? "Tema claro" : "Tema escuro"}
            </button>
            <button
              type="button"
              onClick={(event) => {
                setMenuOpen(false);
                void supabase.auth.signOut();
                event.currentTarget.blur();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-neg outline-none shadow-none focus:outline-none focus:ring-0 focus:shadow-none active:shadow-none [-webkit-tap-highlight-color:transparent]"
            >
              <LogOut className="size-4" />
              Sair da conta
            </button>
          </div>
        )}
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
