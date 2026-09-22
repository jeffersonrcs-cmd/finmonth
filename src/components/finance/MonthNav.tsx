import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Moon, Sun } from "lucide-react";
import { financeActions, monthLabel, shiftMonthKey, useFinanceState } from "@/lib/finance";

export function MonthNav({
  monthKey,
  onChange,
}: {
  monthKey: string;
  onChange: (key: string) => void;
}) {
  const { theme } = useFinanceState();

  return (
    <header className="mb-5 flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-mut">Finanças</p>
        <Link to="/" className="font-display text-2xl font-bold leading-none">
          FinMês
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(shiftMonthKey(monthKey, -1))}
          aria-label="Mês anterior"
          className="glass-soft grid size-9 place-items-center rounded-full text-brand transition-colors hover:bg-foreground/10"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="glass-soft num rounded-full px-3 py-1.5 text-xs font-medium">
          {monthLabel(monthKey, true)}
        </div>
        <button
          onClick={() => onChange(shiftMonthKey(monthKey, 1))}
          aria-label="Próximo mês"
          className="glass-soft grid size-9 place-items-center rounded-full text-brand transition-colors hover:bg-foreground/10"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          onClick={() => financeActions.setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Alternar tema"
          className="glass-soft grid size-9 place-items-center rounded-full text-mut transition-colors hover:text-brand"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>
    </header>
  );
}
