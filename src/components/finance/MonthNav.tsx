import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, LogOut, Moon, Pencil, Sun } from "lucide-react";
import { financeActions, monthLabel, shiftMonthKey, useFinanceState } from "@/lib/finance";
import { supabase } from "@/lib/supabase";

export function MonthNav({
  monthKey,
  onChange,
}: {
  monthKey: string;
  onChange: (key: string) => void;
}) {
  const { theme, userName } = useFinanceState();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(userName);

  const displayName = userName.trim() || "Seu nome";

  return (
    <header className="mb-5 flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-mut">Finanças</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => { setNameDraft(userName); setEditingName(true); }}
            className="font-display text-left text-2xl font-bold leading-none transition-colors hover:text-brand"
            aria-label="Editar nome"
          >
            {displayName}
          </button>
          <button
            type="button"
            onClick={() => { setNameDraft(userName); setEditingName(true); }}
            className="grid size-6 place-items-center rounded-full text-mut hover:text-brand"
            aria-label="Editar nome"
          >
            <Pencil className="size-3" />
          </button>
        </div>
        {editingName && (
          <div className="mt-2 flex items-center gap-1.5">
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { financeActions.setUserName(nameDraft.trim()); setEditingName(false); }
                if (e.key === "Escape") setEditingName(false);
              }}
              placeholder="Seu nome"
              maxLength={30}
              className="glass-soft w-32 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-brand"
              aria-label="Nome da pessoa"
            />
            <button
              type="button"
              onClick={() => { financeActions.setUserName(nameDraft.trim()); setEditingName(false); }}
              className="rounded-lg bg-brand/10 px-2.5 py-1.5 text-[10px] font-semibold text-brand"
            >
              Salvar
            </button>
          </div>
        )}
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
        <button
          onClick={() => { void supabase.auth.signOut(); }}
          aria-label="Sair da conta"
          className="glass-soft grid size-9 place-items-center rounded-full text-mut transition-colors hover:text-neg"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
