import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { financeActions, billStatus, formatCurrency, type Bill, type Income, type Saving } from "@/lib/finance";
import { BillDialog, IncomeDialog, SavingDialog } from "./dialogs";

export function AccountsList({ monthKey, bills }: { monthKey: string; bills: Bill[] }) {
  const sorted = [...bills].sort((a, b) => {
    const ap = billStatus(a, monthKey) !== "paid";
    const bp = billStatus(b, monthKey) !== "paid";
    if (ap !== bp) return ap ? -1 : 1;
    return a.dueDay - b.dueDay;
  });

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-semibold">Contas</h1>
          <p className="mt-1 text-xs text-mut">Somente as contas adicionadas neste mês.</p>
        </div>
        <BillDialog monthKey={monthKey} onSave={(data) => financeActions.addBill(monthKey, data)} trigger={<button aria-label="Adicionar conta" className="grid size-9 place-items-center rounded-full bg-brand/10 text-brand"><Plus className="size-4" /></button>} />
      </div>
      <div className="space-y-2.5">
        {sorted.length === 0 && <p className="glass-soft rounded-2xl p-5 text-center text-xs text-mut">Nenhuma conta adicionada neste mês.</p>}
        {sorted.map((bill) => {
          const status = billStatus(bill, monthKey);
          return (
            <div key={bill.id} className={`glass-soft flex items-center gap-3 rounded-2xl p-3.5 ${status === "paid" ? "opacity-60" : ""}`}>
              <button type="button" onClick={() => financeActions.toggleBillPaid(monthKey, bill.id)} aria-label={bill.paid ? "Marcar como pendente" : "Marcar como paga"} className={`grid size-7 shrink-0 place-items-center rounded-full border ${status === "paid" ? "border-pos/40 bg-pos/20 text-pos" : "border-border hover:border-pos/50 hover:bg-pos/10"}`}>
                {status === "paid" && <Check className="size-3" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{bill.description}</p>
                <p className="text-[11px] text-mut">{status === "paid" ? `Paga · dia ${bill.dueDay}` : status === "overdue" ? `Vencida dia ${bill.dueDay}` : `Vence dia ${bill.dueDay}`}{bill.recurrent ? " · Recorrente" : ""}</p>
              </div>
              <span className={`num font-display text-sm font-semibold ${status === "overdue" ? "text-neg" : status === "paid" ? "text-pos" : ""}`}>{formatCurrency(bill.amount)}</span>
              <BillDialog monthKey={monthKey} initial={bill} onSave={(data) => financeActions.updateBill(monthKey, bill.id, data)} trigger={<button aria-label="Editar conta" className="grid size-7 place-items-center rounded-full text-mut hover:text-brand"><Pencil className="size-3.5" /></button>} />
              <button type="button" aria-label="Excluir conta" onClick={() => financeActions.removeBill(monthKey, bill.id)} className="grid size-7 place-items-center rounded-full text-mut hover:text-neg"><Trash2 className="size-3.5" /></button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function IncomeList({ monthKey, incomes }: { monthKey: string; incomes: Income[] }) {
  const sorted = [...incomes].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-semibold">Receitas</h1>
          <p className="mt-1 text-xs text-mut">Somente as receitas adicionadas neste mês.</p>
        </div>
        <IncomeDialog monthKey={monthKey} onSave={(data) => financeActions.addIncome(monthKey, data)} trigger={<button aria-label="Adicionar receita" className="grid size-9 place-items-center rounded-full bg-pos/10 text-pos"><Plus className="size-4" /></button>} />
      </div>
      <div className="space-y-2.5">
        {sorted.length === 0 && <p className="glass-soft rounded-2xl p-5 text-center text-xs text-mut">Nenhuma receita adicionada neste mês.</p>}
        {sorted.map((income) => (
          <div key={income.id} className="glass-soft flex items-center gap-3 rounded-2xl p-3.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-pos/10 text-pos">💰</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{income.description}</p>
              <p className="text-[11px] text-mut">Dia {Number(income.date.split("-")[2] ?? 1)}</p>
            </div>
            <span className="num font-display text-sm font-semibold text-pos">{formatCurrency(income.amount)}</span>
            <IncomeDialog monthKey={monthKey} initial={income} onSave={(data) => financeActions.updateIncome(monthKey, income.id, data)} trigger={<button aria-label="Editar receita" className="grid size-7 place-items-center rounded-full text-mut hover:text-brand"><Pencil className="size-3.5" /></button>} />
            <button type="button" aria-label="Excluir receita" onClick={() => financeActions.removeIncome(monthKey, income.id)} className="grid size-7 place-items-center rounded-full text-mut hover:text-neg"><Trash2 className="size-3.5" /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SavingsList({ monthKey, savings }: { monthKey: string; savings: Saving[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-semibold">Guardado</h1>
          <p className="mt-1 text-xs text-mut">Somente os valores guardados neste mês.</p>
        </div>
        <SavingDialog onSave={(data) => financeActions.addSaving(monthKey, data)} trigger={<button aria-label="Adicionar valor guardado" className="grid size-9 place-items-center rounded-full bg-econ/10 text-econ"><Plus className="size-4" /></button>} />
      </div>
      <div className="space-y-2.5">
        {savings.length === 0 && <p className="glass-soft rounded-2xl p-5 text-center text-xs text-mut">Nenhum valor guardado neste mês.</p>}
        {savings.map((saving) => (
          <div key={saving.id} className="glass-soft flex items-center gap-3 rounded-2xl p-3.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-econ/10 text-econ">🐷</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{saving.description}</p>
              <p className="text-[11px] text-mut">Guardado no mês</p>
            </div>
            <span className="num font-display text-sm font-semibold text-econ">{formatCurrency(saving.amount)}</span>
            <SavingDialog initial={saving} onSave={(data) => financeActions.updateSaving(monthKey, saving.id, data)} trigger={<button aria-label="Editar valor guardado" className="grid size-7 place-items-center rounded-full text-mut hover:text-brand"><Pencil className="size-3.5" /></button>} />
            <button type="button" aria-label="Excluir valor guardado" onClick={() => financeActions.removeSaving(monthKey, saving.id)} className="grid size-7 place-items-center rounded-full text-mut hover:text-neg"><Trash2 className="size-3.5" /></button>
          </div>
        ))}
      </div>
    </section>
  );
}
