import { Check, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  billStatus,
  financeActions,
  formatCurrency,
  monthLabel,
  previousMonthKey,
  type Bill,
} from "@/lib/finance";
import { BillDialog } from "./dialogs";

export function BillsSection({ monthKey, bills }: { monthKey: string; bills: Bill[] }) {
  const sorted = [...bills].sort((a, b) => a.dueDay - b.dueDay);

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-mut">
          Contas do mês
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const n = financeActions.copyBillsFromPrevious(monthKey);
              toast[n ? "success" : "info"](
                n
                  ? `${n} conta(s) recorrente(s) copiada(s) de ${monthLabel(previousMonthKey(monthKey))}`
                  : `Nada novo para copiar de ${monthLabel(previousMonthKey(monthKey))}`,
              );
            }}
            className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-brand/70 transition-colors hover:text-brand"
          >
            <Copy className="size-3" /> Copiar contas
          </button>
          <button
            onClick={() => {
              const n = financeActions.copyIncomesFromPrevious(monthKey);
              toast[n ? "success" : "info"](
                n ? `${n} receita(s) copiada(s)` : "Nada novo para copiar",
              );
            }}
            className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-brand/70 transition-colors hover:text-brand"
          >
            <Copy className="size-3" /> Receitas
          </button>
        </div>
      </div>

      <div className="mb-5 space-y-2.5">
        {sorted.length === 0 && (
          <p className="glass-soft rounded-2xl p-4 text-center text-xs text-mut">
            Nenhuma conta neste mês.
          </p>
        )}
        {sorted.map((bill) => {
          const status = billStatus(bill, monthKey);
          return (
            <div
              key={bill.id}
              className={`glass-soft flex items-center gap-3 rounded-2xl p-3.5 ${
                status === "paid" ? "opacity-60" : ""
              } ${status === "overdue" ? "border-neg/25" : ""}`}
            >
              <button
                onClick={() => financeActions.toggleBillPaid(monthKey, bill.id)}
                aria-label={bill.paid ? "Marcar como pendente" : "Marcar como paga"}
                className={`grid size-6 shrink-0 place-items-center rounded-full border transition-colors ${
                  status === "paid"
                    ? "border-pos/40 bg-pos/20 text-pos"
                    : status === "overdue"
                      ? "border-neg/30 bg-neg/5 hover:border-pos/50 hover:bg-pos/10"
                      : "border-border hover:border-pos/50 hover:bg-pos/10"
                }`}
              >
                {status === "paid" && <Check className="size-3" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{bill.description}</p>
                <p className={`text-[11px] ${status === "overdue" ? "text-neg" : "text-mut"}`}>
                  {status === "paid"
                    ? `Paga · dia ${bill.dueDay}`
                    : status === "overdue"
                      ? `Vencida dia ${bill.dueDay}`
                      : `Vence dia ${bill.dueDay}`}
                  {bill.recurrent ? " · Recorrente" : ""}
                </p>
              </div>
              <span
                className={`num font-display text-sm font-semibold ${
                  status === "overdue" ? "text-neg" : status === "paid" ? "text-pos" : ""
                }`}
              >
                {formatCurrency(bill.amount)}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <BillDialog
                  monthKey={monthKey}
                  initial={bill}
                  onSave={(data) => financeActions.updateBill(monthKey, bill.id, data)}
                  trigger={
                    <button
                      aria-label="Editar conta"
                      className="grid size-7 place-items-center rounded-full text-mut transition-colors hover:text-brand"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  }
                />
                <button
                  aria-label="Excluir conta"
                  onClick={() => financeActions.removeBill(monthKey, bill.id)}
                  className="grid size-7 place-items-center rounded-full text-mut transition-colors hover:text-neg"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <BillDialog
        monthKey={monthKey}
        onSave={(data) => financeActions.addBill(monthKey, data)}
        trigger={
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3.5 text-mut transition-all hover:border-foreground/25 hover:text-foreground active:scale-[0.98]">
            <Plus className="size-4" />
            <span className="text-xs font-medium uppercase tracking-widest">Nova conta</span>
          </button>
        }
      />
    </section>
  );
}
