import { Pencil, Plus, Trash2 } from "lucide-react";
import { financeActions, formatCurrency, type Income, type MonthTotals, type Saving } from "@/lib/finance";
import { IncomeDialog, SavingDialog } from "./dialogs";

const rowClass = "glass-soft flex items-center gap-2 rounded-xl px-2.5 py-2";

export function SummaryCards({
  monthKey,
  totals,
  incomes,
  savings,
}: {
  monthKey: string;
  totals: MonthTotals;
  incomes: Income[];
  savings: Saving[];
}) {
  const positive = totals.availableBalance >= 0;
  const sortedIncomes = [...incomes].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <section className="glass mb-4 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-mut">💵 Saldo Disponível</p>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
              positive ? "border-pos/20 bg-pos/10 text-pos" : "border-neg/20 bg-neg/10 text-neg"
            }`}
          >
            {positive ? "Positivo" : "Negativo"}
          </span>
        </div>
        <p
          className={`num mt-1 font-display text-4xl font-bold tracking-tight ${
            positive ? "" : "text-neg"
          }`}
        >
          {formatCurrency(totals.availableBalance)}
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-pos" />
            <span className="text-mut">Receitas</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-neg" />
            <span className="text-mut">Contas</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-econ" />
            <span className="text-mut">Guardado</span>
          </span>
        </div>
      </section>

      <section className="mb-5 grid grid-cols-2 gap-2.5">
        <div className="glass rounded-2xl p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-mut">💰 Receitas</p>
              <p className="num mt-1 font-display text-base font-semibold text-pos">
                {formatCurrency(totals.totalIncomes, true)}
              </p>
            </div>
            <IncomeDialog
              monthKey={monthKey}
              onSave={(data) => financeActions.addIncome(monthKey, data)}
              trigger={
                <button
                  aria-label="Adicionar receita"
                  className="grid size-8 place-items-center rounded-full bg-pos/10 text-pos transition-colors hover:bg-pos/20"
                >
                  <Plus className="size-4" />
                </button>
              }
            />
          </div>

          <div className="space-y-1.5">
            {sortedIncomes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/70 px-3 py-3 text-center text-[11px] text-mut">
                Nenhuma receita neste mês.
              </p>
            ) : (
              sortedIncomes.map((income) => (
                <div key={income.id} className={rowClass}>
                  <span className="size-1.5 shrink-0 rounded-full bg-pos" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{income.description}</p>
                    <p className="num text-[10px] text-mut">
                      {income.date.split("-").reverse().join("/")}
                    </p>
                  </div>
                  <span className="num shrink-0 font-display text-xs font-semibold text-pos">
                    {formatCurrency(income.amount)}
                  </span>
                  <IncomeDialog
                    monthKey={monthKey}
                    initial={income}
                    onSave={(data) => financeActions.updateIncome(monthKey, income.id, data)}
                    trigger={
                      <button
                        aria-label="Editar receita"
                        className="grid size-6 shrink-0 place-items-center rounded-full text-mut transition-colors hover:text-brand"
                      >
                        <Pencil className="size-3" />
                      </button>
                    }
                  />
                  <button
                    aria-label="Excluir receita"
                    onClick={() => financeActions.removeIncome(monthKey, income.id)}
                    className="grid size-6 shrink-0 place-items-center rounded-full text-mut transition-colors hover:text-neg"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-mut">🏦 Guardado</p>
              <p className="num mt-1 font-display text-base font-semibold text-econ">
                {formatCurrency(totals.totalSaved, true)}
              </p>
            </div>
            <SavingDialog
              onSave={(data) => financeActions.addSaving(monthKey, data)}
              trigger={
                <button
                  aria-label="Adicionar valor guardado"
                  className="grid size-8 place-items-center rounded-full bg-econ/10 text-econ transition-colors hover:bg-econ/20"
                >
                  <Plus className="size-4" />
                </button>
              }
            />
          </div>

          <div className="space-y-1.5">
            {savings.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/70 px-3 py-3 text-center text-[11px] text-mut">
                Nenhum valor guardado neste mês.
              </p>
            ) : (
              savings.map((saving) => (
                <div key={saving.id} className={rowClass}>
                  <span className="size-1.5 shrink-0 rounded-full bg-econ" />
                  <p className="min-w-0 flex-1 truncate text-xs font-medium">{saving.description}</p>
                  <span className="num shrink-0 font-display text-xs font-semibold text-econ">
                    {formatCurrency(saving.amount)}
                  </span>
                  <SavingDialog
                    initial={saving}
                    onSave={(data) => financeActions.updateSaving(monthKey, saving.id, data)}
                    trigger={
                      <button
                        aria-label="Editar valor guardado"
                        className="grid size-6 shrink-0 place-items-center rounded-full text-mut transition-colors hover:text-brand"
                      >
                        <Pencil className="size-3" />
                      </button>
                    }
                  />
                  <button
                    aria-label="Excluir valor guardado"
                    onClick={() => financeActions.removeSaving(monthKey, saving.id)}
                    className="grid size-6 shrink-0 place-items-center rounded-full text-mut transition-colors hover:text-neg"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-3.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-mut">📄 Contas</p>
          <p className="num mt-1 font-display text-base font-semibold text-neg">
            {formatCurrency(totals.totalBills, true)}
          </p>
        </div>


        <div className="glass rounded-2xl p-3">
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-mut">📈 Saldo do mês</p>
          <p
            className={`num font-display text-sm font-semibold ${
              totals.monthBalance >= 0 ? "text-pos" : "text-neg"
            }`}
          >
            {formatCurrency(totals.monthBalance, true)}
          </p>
        </div>
      </section>
    </>
  );
}
