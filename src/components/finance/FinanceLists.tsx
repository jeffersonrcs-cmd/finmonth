import { CalendarDays, Check, ChevronLeft, Copy, Pencil, Plus, Trash2 } from "lucide-react";
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
import { BillDialog, ConfirmDeleteDialog, IncomeDialog, SavingDialog } from "./dialogs";

function BillDetailScreen({
  bill,
  monthKey,
  onBack,
  onDelete,
}: {
  bill: Bill;
  monthKey: string;
  onBack: () => void;
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const status = billStatus(bill, monthKey);
  const statusClass =
    status === "overdue" ? "text-neg bg-neg/10" : status === "pending" ? "text-warn bg-warn/10" : "text-pos bg-pos/10";
  const statusLabel = status === "overdue" ? t("overdue") : status === "pending" ? t("pending") : t("paid");

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} aria-label={t("back")} className="grid size-9 place-items-center rounded-full bg-muted/50 text-mut transition-colors hover:text-foreground">
          <ChevronLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-semibold">{bill.description}</h1>
          <p className="text-xs text-mut">{t("bills")}</p>
        </div>
        <BillDialog
          monthKey={monthKey}
          initial={bill}
          onSave={(data) => financeActions.updateBill(monthKey, bill.id, data)}
          trigger={
            <button type="button" aria-label={t("edit")} className="grid size-9 place-items-center rounded-full bg-brand/10 text-brand transition-colors hover:bg-brand/15">
              <Pencil className="size-4" />
            </button>
          }
        />
        <ConfirmDeleteDialog
          onConfirm={onDelete}
          trigger={
            <button type="button" aria-label={t("delete")} className="grid size-9 place-items-center rounded-full bg-neg/10 text-neg transition-colors hover:bg-neg/15">
              <Trash2 className="size-4" />
            </button>
          }
        />
      </div>
      <article className="glass rounded-3xl border border-border/70 p-5 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-mut">{t("amount")}</p>
            <p className={"num mt-1 font-display text-3xl font-bold " + (status === "overdue" ? "text-neg" : status === "pending" ? "text-warn" : "text-pos")}>
              {formatCurrency(bill.amount)}
            </p>
          </div>
          <span className={"rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider " + statusClass}>
            {statusLabel}
          </span>
        </div>
        <div className="space-y-3 border-t border-border/50 pt-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="size-4 text-mut" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-mut">{t("dueDate")}</p>
              <p className="mt-0.5 text-sm font-medium">{billDueDateLabel(monthKey, bill.dueDay)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-muted/30 px-3 py-2.5">
            <span className="text-xs">{t("recurringAccount")}</span>
            <span className="text-xs font-medium">{bill.recurrent ? t("yes") : t("no")}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-muted/30 px-3 py-2.5">
            <span className="text-xs">{t("paidAccount")}</span>
            <span className="text-xs font-medium">{bill.paid ? t("yes") : t("no")}</span>
          </div>
        </div>
      </article>
    </section>
  );
}

export function AccountsList({ monthKey, bills }: { monthKey: string; bills: Bill[] }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);\n  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const sorted = [...bills].sort((a, b) => {
    const ap = billStatus(a, monthKey) !== "paid";
    const bp = billStatus(b, monthKey) !== "paid";
    if (ap !== bp) return ap ? -1 : 1;
    return a.dueDay - b.dueDay;
  });

  const selectedBill = selectedBillId ? bills.find((bill) => bill.id === selectedBillId) : undefined;

  if (selectedBill) {
    return (
      <BillDetailScreen
        bill={selectedBill}
        monthKey={monthKey}
        onBack={() => setSelectedBillId(null)}
        onDelete={() => {\n          financeActions.removeBill(monthKey, selectedBill.id);\n          setSelectedBillId(null);\n        }}
      />
    );
  }

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
              className={`glass-soft flex cursor-pointer items-center gap-3 rounded-2xl p-3.5 ${status === "paid" ? "opacity-60" : ""}`}\n              role="button"\n              tabIndex={0}\n              onClick={() => setSelectedBillId(bill.id)}\n              onKeyDown={(event) => {\n                if (event.key === "Enter" || event.key === " ") {\n                  event.preventDefault();\n                  setSelectedBillId(bill.id);\n                }\n              }}
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
              <BillDialog
                monthKey={monthKey}
                initial={bill}
                onSave={(data) => financeActions.updateBill(monthKey, bill.id, data)}
                trigger={
                  <button
                    type="button"
                    aria-label={`${t("edit")} ${t("bills").toLowerCase()}`}
                    className="grid size-7 shrink-0 place-items-center rounded-full text-mut hover:text-brand"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                }
              />
              <ConfirmDeleteDialog
                onConfirm={() => financeActions.removeBill(monthKey, bill.id)}
                trigger={
                  <button
                    type="button"
                    aria-label={`${t("delete")} ${t("bills").toLowerCase()}`}
                    onClick={(event) => event.stopPropagation()}
                    className="grid size-7 shrink-0 place-items-center rounded-full text-mut hover:text-neg"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                }
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function IncomeList({ monthKey, incomes }: { monthKey: string; incomes: Income[] }) {
  const { t } = useLanguage();
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
          <div key={income.id} className="glass-soft flex items-center gap-3 rounded-2xl p-3.5">
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
            <ConfirmDeleteDialog
              onConfirm={() => financeActions.removeIncome(monthKey, income.id)}
              trigger={
                <button
                  type="button"
                  aria-label={`${t("delete")} ${t("incomes").toLowerCase()}`}
                  className="grid size-7 shrink-0 place-items-center rounded-full text-mut hover:text-neg"
                >
                  <Trash2 className="size-3.5" />
                </button>
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function SavingsList({ monthKey, savings }: { monthKey: string; savings: Saving[] }) {
  const { t } = useLanguage();
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
          <div key={saving.id} className="glass-soft flex items-center gap-3 rounded-2xl p-3.5">
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
            <ConfirmDeleteDialog
              onConfirm={() => financeActions.removeSaving(monthKey, saving.id)}
              trigger={
                <button
                  type="button"
                  aria-label={`${t("delete")} ${t("savings").toLowerCase()}`}
                  className="grid size-7 shrink-0 place-items-center rounded-full text-mut hover:text-neg"
                >
                  <Trash2 className="size-3.5" />
                </button>
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
