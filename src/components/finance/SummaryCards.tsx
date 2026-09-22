import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { financeActions, formatCurrency, type Income, type MonthTotals, type Saving } from "@/lib/finance";
import { IncomeDialog, ManageEntriesDialog, SavingDialog } from "./dialogs";

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
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);

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

      <section className="mb-5 grid grid-cols-2 gap-2.5 auto-rows-[70px]">
        <div className="glass rounded-2xl p-3.5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-mut">💰 Receitas</p>
              <p className="num mt-1 font-display text-base font-semibold text-pos">
                {formatCurrency(totals.totalIncomes, true)}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
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
              <ManageEntriesDialog
                title="Editar receitas"
                items={incomes}
                onEdit={(id) => {
                  const income = incomes.find((item) => item.id === id);
                  if (income) setEditingIncome(income);
                }}
                onDelete={(id) => financeActions.removeIncome(monthKey, id)}
                trigger={
                  <button
                    aria-label="Editar receitas"
                    className="grid size-8 place-items-center rounded-full bg-brand/10 text-brand transition-colors hover:bg-brand/20"
                  >
                    <Pencil className="size-4" />
                  </button>
                }
              />
              <IncomeDialog
                monthKey={monthKey}
                initial={editingIncome ?? undefined}
                open={editingIncome !== null}
                onOpenChange={(open) => { if (!open) setEditingIncome(null); }}
                onSave={(data) => {
                  if (editingIncome) financeActions.updateIncome(monthKey, editingIncome.id, data);
                }}
                trigger={<span className="hidden" />}
              />            </div>
          </div>

          <div className="flex-1" />
        </div>



        <div className="glass flex h-full min-h-0 flex-col rounded-2xl p-3.5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-mut">🏦 Guardado</p>
              <p className="num mt-1 font-display text-base font-semibold text-econ">
                {formatCurrency(totals.totalSaved, true)}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
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
              <ManageEntriesDialog
                title="Editar valores guardados"
                items={savings}
                onEdit={(id) => {
                  const saving = savings.find((item) => item.id === id);
                  if (saving) setEditingSaving(saving);
                }}
                onDelete={(id) => financeActions.removeSaving(monthKey, id)}
                trigger={
                  <button
                    aria-label="Editar valores guardados"
                    className="grid size-8 place-items-center rounded-full bg-brand/10 text-brand transition-colors hover:bg-brand/20"
                  >
                    <Pencil className="size-4" />
                  </button>
                }
              />
              <SavingDialog
                initial={editingSaving ?? undefined}
                open={editingSaving !== null}
                onOpenChange={(open) => { if (!open) setEditingSaving(null); }}
                onSave={(data) => {
                  if (editingSaving) financeActions.updateSaving(monthKey, editingSaving.id, data);
                }}
                trigger={<span className="hidden" />}
              />            </div>
          </div>

          <div className="flex-1" />
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
