import { CalendarDays, Check, CircleDollarSign, Copy, Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  financeActions,
  billStatus,
  formatCurrency,
  type Bill,
  type Income,
  type Saving,
} from "@/lib/finance";
import { useLanguage } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BillDetailScreen } from "./BillsSection";
import { BillDialog, ConfirmDeleteDialog, IncomeDialog, SavingDialog } from "./dialogs";

function IncomeDetailScreen({ income, monthKey, onClose, onDelete }: { income: Income; monthKey: string; onClose: () => void; onDelete: () => void }) {
  const { t } = useLanguage();
  const day = Number(income.date.split("-")[2] ?? 1);
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="max-w-[340px] overflow-hidden rounded-[2rem] border-border/70 bg-popover p-0 shadow-2xl"><div className="p-5 sm:p-6"><DialogHeader className="relative pr-10"><div className="flex items-center gap-3"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-pos/10 text-pos"><CircleDollarSign className="size-6" /></div><DialogTitle className="min-w-0 font-display text-xl font-bold leading-tight tracking-tight sm:text-2xl">{income.description}</DialogTitle></div></DialogHeader><div className="mt-6 space-y-4"><div className="rounded-2xl border border-border/60 bg-background/45 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mut">{t("amount")}</p><p className="num mt-1 font-display text-3xl font-bold tracking-tight text-pos sm:text-4xl">{formatCurrency(income.amount)}</p></div><div className="rounded-2xl border border-border/60 bg-background/30"><div className="flex items-center gap-3 px-4 py-3.5"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted/40"><CalendarDays className="size-5 text-mut" /></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mut">{t("date")}</p><p className="mt-0.5 text-base font-semibold">{t("day")} {day}</p></div></div></div><div className="flex justify-end gap-2 border-t border-border/50 pt-4"><IncomeDialog monthKey={monthKey} initial={income} onSave={(data) => financeActions.updateIncome(monthKey, income.id, data)} trigger={<button type="button" aria-label={t("edit")} className="grid size-11 place-items-center rounded-full bg-brand/10 text-brand"><Pencil className="size-5" /></button>} /><ConfirmDeleteDialog onConfirm={onDelete} trigger={<button type="button" aria-label={t("delete")} className="grid size-11 place-items-center rounded-full bg-neg/10 text-neg"><Trash2 className="size-5" /></button>} /></div></div></DialogContent></Dialog>;
}

function SavingDetailScreen({ saving, monthKey, onClose, onDelete }: { saving: Saving; monthKey: string; onClose: () => void; onDelete: () => void }) {
  const { t } = useLanguage();
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="max-w-[340px] overflow-hidden rounded-[2rem] border-border/70 bg-popover p-0 shadow-2xl"><div className="p-5 sm:p-6"><DialogHeader className="relative pr-10"><div className="flex items-center gap-3"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-econ/10 text-econ"><PiggyBank className="size-6" /></div><DialogTitle className="min-w-0 font-display text-xl font-bold leading-tight tracking-tight sm:text-2xl">{saving.description}</DialogTitle></div></DialogHeader><div className="mt-6 space-y-4"><div className="rounded-2xl border border-border/60 bg-background/45 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mut">{t("amount")}</p><p className="num mt-1 font-display text-3xl font-bold tracking-tight text-econ sm:text-4xl">{formatCurrency(saving.amount)}</p></div><div className="rounded-2xl border border-border/60 bg-background/30"><div className="flex items-center gap-3 px-4 py-3.5"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted/40"><PiggyBank className="size-5 text-mut" /></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mut">{t("savedInMonth")}</p><p className="mt-0.5 text-base font-semibold">{monthKey}</p></div></div></div><div className="flex justify-end gap-2 border-t border-border/50 pt-4"><SavingDialog initial={saving} onSave={(data) => financeActions.updateSaving(monthKey, saving.id, data)} trigger={<button type="button" aria-label={t("edit")} className="grid size-11 place-items-center rounded-full bg-brand/10 text-brand"><Pencil className="size-5" /></button>} /><ConfirmDeleteDialog onConfirm={onDelete} trigger={<button type="button" aria-label={t("delete")} className="grid size-11 place-items-center rounded-full bg-neg/10 text-neg"><Trash2 className="size-5" /></button>} /></div></div></DialogContent></Dialog>;
}
export function AccountsList({ monthKey, bills }: { monthKey: string; bills: Bill[] }) {
  const { t } = useLanguage();
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const sorted = [...bills].sort((a, b) => {
    const ap = billStatus(a, monthKey) !== "paid";
    const bp = billStatus(b, monthKey) !== "paid";
    if (ap !== bp) return ap ? -1 : 1;
    return a.dueDay - b.dueDay;
  });

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-lg font-semibold">{t("bills")}</h1>
          <p className="mt-1 text-xs text-mut">{t("onlyBills")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!copied && (
            <button
              type="button"
              onClick={() => {
                const n = financeActions.copyBillsFromPrevious(monthKey);
                if (n > 0) setCopied(true);
              }}
              aria-label={t("copyPrevious")}
              title={t("copyPrevious")}
              className="flex h-9 items-center gap-1.5 rounded-full bg-brand/10 px-3 text-[10px] font-semibold uppercase tracking-wider text-brand transition-colors hover:bg-brand/15"
            >
              <Copy className="size-3.5" />
              <span>{t("copyPrevious")}</span>
            </button>
          )}
          <BillDialog
            monthKey={monthKey}
            onSave={(data) => financeActions.addBill(monthKey, data)}
            trigger={
              <button
                aria-label={t("addBill")}
                className="grid size-9 place-items-center rounded-full bg-neg/10 text-neg"
              >
                <Plus className="size-4" />
              </button>
            }
          />
        </div>
      </div>
      <div className="space-y-2.5">
        {sorted.length === 0 && (
          <p className="glass-soft rounded-2xl p-5 text-center text-xs text-mut">{t("noBills")}</p>
        )}
        {sorted.map((bill) => {
          const status = billStatus(bill, monthKey);
          return (
            <div
              key={bill.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedBillId(bill.id)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedBillId(bill.id); } }}
              className={`glass-soft flex items-center gap-3 rounded-2xl p-3.5 ${status === "paid" ? "opacity-60" : ""}`}
            >
              <button
                type="button"
                onClick={(event) => { event.stopPropagation(); financeActions.toggleBillPaid(monthKey, bill.id); }}
                aria-label={bill.paid ? t("markPending") : t("markPaid")}
                className={`grid size-7 shrink-0 place-items-center rounded-full border ${status === "paid" ? "border-pos/40 bg-pos/20 text-pos" : "border-border hover:border-pos/50 hover:bg-pos/10"}`}
              >
                {status === "paid" && <Check className="size-3" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{bill.description}</p>
                <p className="text-[11px] text-mut">
                  {status === "paid"
                    ? `${t("paid")} · ${t("day")} ${bill.dueDay}`
                    : status === "overdue"
                      ? `${t("overdue")} ${t("day")} ${bill.dueDay}`
                      : `${t("due")} ${t("day")} ${bill.dueDay}`}
                  {bill.recurrent ? ` · ${t("recurring")}` : ""}
                </p>
              </div>
              <span
                className={`num font-display text-sm font-semibold ${status === "overdue" ? "text-neg" : status === "paid" ? "text-pos" : ""}`}
              >
                {formatCurrency(bill.amount)}
              </span>
            </div>
          );
        })}
      </div>
      {selectedBillId && (() => { const selectedBill = bills.find((bill) => bill.id === selectedBillId); return selectedBill ? <BillDetailScreen bill={selectedBill} monthKey={monthKey} onClose={() => setSelectedBillId(null)} onDelete={() => { financeActions.removeBill(monthKey, selectedBill.id); setSelectedBillId(null); }} /> : null; })()}
    </section>
  );
}

export function IncomeList({ monthKey, incomes }: { monthKey: string; incomes: Income[] }) {
  const { t } = useLanguage();
  const [selectedIncomeId, setSelectedIncomeId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const sorted = [...incomes].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-lg font-semibold">{t("incomes")}</h1>
          <p className="mt-1 text-xs text-mut">{t("onlyIncomes")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!copied && (
            <button
              type="button"
              onClick={() => {
                const n = financeActions.copyIncomesFromPrevious(monthKey);
                if (n > 0) setCopied(true);
              }}
              aria-label={t("copyPrevious")}
              title={t("copyPrevious")}
              className="flex h-9 items-center gap-1.5 rounded-full bg-brand/10 px-3 text-[10px] font-semibold uppercase tracking-wider text-brand transition-colors hover:bg-brand/15"
            >
              <Copy className="size-3.5" />
              <span>{t("copyPrevious")}</span>
            </button>
          )}
          <IncomeDialog
            monthKey={monthKey}
            onSave={(data) => financeActions.addIncome(monthKey, data)}
            trigger={
              <button
                aria-label={t("addIncome")}
                className="grid size-9 place-items-center rounded-full bg-pos/10 text-pos"
              >
                <Plus className="size-4" />
              </button>
            }
          />
        </div>
      </div>
      <div className="space-y-2.5">
        {sorted.length === 0 && (
          <p className="glass-soft rounded-2xl p-5 text-center text-xs text-mut">
            {t("noIncomes")}
          </p>
        )}
        {sorted.map((income) => (
          <div key={income.id} role="button" tabIndex={0} onClick={() => setSelectedIncomeId(income.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedIncomeId(income.id); } }} className="glass-soft flex cursor-pointer items-center gap-3 rounded-2xl p-3.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-pos/10 text-pos">
              💰
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{income.description}</p>
              <p className="text-[11px] text-mut">
                {t("day")} {Number(income.date.split("-")[2] ?? 1)}
              </p>
            </div>
            <span className="num font-display text-sm font-semibold text-pos">
              {formatCurrency(income.amount)}
            </span>
          </div>
        ))}
      </div>
      {selectedIncomeId && (() => { const selectedIncome = incomes.find((income) => income.id === selectedIncomeId); return selectedIncome ? <IncomeDetailScreen income={selectedIncome} monthKey={monthKey} onClose={() => setSelectedIncomeId(null)} onDelete={() => { financeActions.removeIncome(monthKey, selectedIncome.id); setSelectedIncomeId(null); }} /> : null; })()}
    </section>
  );
}

export function SavingsList({ monthKey, savings }: { monthKey: string; savings: Saving[] }) {
  const { t } = useLanguage();
  const [selectedSavingId, setSelectedSavingId] = useState<string | null>(null);
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-semibold">{t("savings")}</h1>
          <p className="mt-1 text-xs text-mut">{t("onlySavings")}</p>
        </div>
        <SavingDialog
          onSave={(data) => financeActions.addSaving(monthKey, data)}
          trigger={
            <button
              aria-label={t("addSaving")}
              className="grid size-9 place-items-center rounded-full bg-econ/10 text-econ"
            >
              <Plus className="size-4" />
            </button>
          }
        />
      </div>
      <div className="space-y-2.5">
        {savings.length === 0 && (
          <p className="glass-soft rounded-2xl p-5 text-center text-xs text-mut">
            {t("noSavings")}
          </p>
        )}
        {savings.map((saving) => (
          <div key={saving.id} role="button" tabIndex={0} onClick={() => setSelectedSavingId(saving.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedSavingId(saving.id); } }} className="glass-soft flex cursor-pointer items-center gap-3 rounded-2xl p-3.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-econ/10 text-econ">
              🐷
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{saving.description}</p>
              <p className="text-[11px] text-mut">{t("savedInMonth")}</p>
            </div>
            <span className="num font-display text-sm font-semibold text-econ">
              {formatCurrency(saving.amount)}
            </span>
          </div>
        ))}
      </div>
      {selectedSavingId && (() => { const selectedSaving = savings.find((saving) => saving.id === selectedSavingId); return selectedSaving ? <SavingDetailScreen saving={selectedSaving} monthKey={monthKey} onClose={() => setSelectedSavingId(null)} onDelete={() => { financeActions.removeSaving(monthKey, selectedSaving.id); setSelectedSavingId(null); }} /> : null; })()}
    </section>
  );
}
