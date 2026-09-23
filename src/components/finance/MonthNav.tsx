import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LogOut, Moon, Settings, Sun, UserRound } from "lucide-react";
import { financeActions, monthLabel, shiftMonthKey, useFinanceState } from "@/lib/finance";
import { supabase } from "@/lib/supabase";

export function MonthNav({
  monthKey,
  onChange,
  onOpenSettings,
}: {
  monthKey: string;
  onChange: (key: string) => void;
  onOpenSettings: () => void;
}) {
  const { theme, userName } = useFinanceState();
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
          onClick={() => setMenuOpen((value) => !value)}
          className="flex items-center gap-2 font-display text-left text-2xl font-bold leading-none transition-colors hover:text-brand"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          {displayName}
          <UserRound className="size-4 text-mut" />
        </button>

        {menuOpen && (
          <div className="absolute left-0 top-full z-50 mt-3 w-56 rounded-2xl border border-border bg-popover p-1.5 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onOpenSettings();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-colors hover:bg-foreground/5"
            >
              <Settings className="size-4 text-mut" />
              Configurações da conta
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                void supabase.auth.signOut();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-neg transition-colors hover:bg-neg/10"
            >
              <LogOut className="size-4" />
              Sair da conta
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => onChange(shiftMonthKey(monthKey, -1))} aria-label="Mês anterior" className="glass-soft grid size-9 place-items-center rounded-full text-brand transition-colors hover:bg-foreground/10">
          <ChevronLeft className="size-4" />
        </button>
        <div className="glass-soft num rounded-full px-3 py-1.5 text-xs font-medium">{monthLabel(monthKey, true)}</div>
        <button onClick={() => onChange(shiftMonthKey(monthKey, 1))} aria-label="Próximo mês" className="glass-soft grid size-9 place-items-center rounded-full text-brand transition-colors hover:bg-foreground/10">
          <ChevronRight className="size-4" />
        </button>
        <button onClick={() => financeActions.setTheme(theme === "dark" ? "light" : "dark")} aria-label="Alternar tema" className="glass-soft grid size-9 place-items-center rounded-full text-mut transition-colors hover:text-brand">
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>
    </header>
  );
}
