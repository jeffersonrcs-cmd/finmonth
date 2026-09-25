import { Pencil, Plus, Trash2 } from "lucide-react";
import { financeActions, formatCurrency, type Income, type Saving } from "@/lib/finance";
import { useLanguage } from "@/lib/i18n";
import { IncomeDialog, SavingDialog } from "./dialogs";

const rowClass = "glass-soft flex items-center gap-3 rounded-2xl p-3.5";

export function IncomesSection({ monthKey, incomes }: { monthKey: string; incomes: Income[] }) {
  const { t } = useLanguage();
  const sorted = [...incomes].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section className="mb-8">
      <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-mut">
        {t("incomes")}
      </h2>
      <div className="mb-5 space-y-2.5">
        {sorted.length === 0 && (
          <p className="glass-soft rounded-2xl p-4 text-center text-xs text-mut">
            {t("noIncomes")}
          </p>
        )}
        {sorted.map((income) => (
          <div key={income.id} className={rowClass}>
            <span className="size-2 shrink-0 rounded-full bg-pos" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{income.description}</p>
              <p className="num text-[11px] text-mut">
                {income.date.split("-").reverse().join("/")}
              </p>
            </div>
            <span className="num font-display text-sm font-semibold text-pos">
              {formatCurrency(income.amount)}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <IncomeDialog
                monthKey={monthKey}
                initial={income}
                onSave={(data) => financeActions.updateIncome(monthKey, income.id, data)}
                trigger={
                  <button
                    aria-label={`${t("edit")} ${t("incomes").toLowerCase()}`}
                    className="grid size-7 place-items-center rounded-full text-mut hover:text-brand"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                }
              />
              <button
                aria-label={`${t("delete")} ${t("incomes").toLowerCase()}`}
                onClick={() => financeActions.removeIncome(monthKey, income.id)}
                className="grid size-7 place-items-center rounded-full text-mut hover:text-neg"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <IncomeDialog
        monthKey={monthKey}
        onSave={(data) => financeActions.addIncome(monthKey, data)}
        trigger={
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3.5 text-mut transition-all hover:border-foreground/25 hover:text-foreground active:scale-[0.98]">
            <Plus className="size-4" />
            <span className="text-xs font-medium uppercase tracking-widest">{t("newIncome")}</span>
          </button>
        }
      />
    </section>
  );
}

export function SavingsSection({ monthKey, savings }: { monthKey: string; savings: Saving[] }) {
  const { t } = useLanguage();
  return (
    <section className="mb-8">
      <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-mut">
        {t("savings")}
      </h2>
      <div className="mb-5 space-y-2.5">
        {savings.length === 0 && (
          <p className="glass-soft rounded-2xl p-4 text-center text-xs text-mut">
            {t("noSavings")}
          </p>
        )}
        {savings.map((saving) => (
          <div key={saving.id} className={rowClass}>
            <span className="size-2 shrink-0 rounded-full bg-econ" />
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{saving.description}</p>
            <span className="num font-display text-sm font-semibold text-econ">
              {formatCurrency(saving.amount)}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <SavingDialog
                initial={saving}
                onSave={(data) => financeActions.updateSaving(monthKey, saving.id, data)}
                trigger={
                  <button
                    aria-label={`${t("edit")} ${t("savings").toLowerCase()}`}
                    className="grid size-7 place-items-center rounded-full text-mut hover:text-brand"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                }
              />
              <button
                aria-label={`${t("delete")} ${t("savings").toLowerCase()}`}
                onClick={() => financeActions.removeSaving(monthKey, saving.id)}
                className="grid size-7 place-items-center rounded-full text-mut hover:text-neg"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <SavingDialog
        onSave={(data) => financeActions.addSaving(monthKey, data)}
        trigger={
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3.5 text-mut transition-all hover:border-foreground/25 hover:text-foreground active:scale-[0.98]">
            <Plus className="size-4" />
            <span className="text-xs font-medium uppercase tracking-widest">{t("addSaving")}</span>
          </button>
        }
      />
    </section>
  );
}
