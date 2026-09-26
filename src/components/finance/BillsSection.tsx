import { CalendarDays, Check, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";
import { billStatus, financeActions, formatCurrency, type Bill } from "@/lib/finance";
import { BillDialog, ConfirmDeleteDialog } from "./dialogs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


export function BillDetailScreen({
  bill,
  monthKey,
  onClose,
  onDelete,
}: {
  bill: Bill;
  monthKey: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const status = billStatus(bill, monthKey);
  const statusClass = status === "overdue" ? "text-neg bg-neg/10" : "text-warn bg-warn/10";
  const statusLabel = status === "overdue" ? t("overdue") : t("pending");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[340px] rounded-3xl border-border/70 bg-popover shadow-xl">
        <DialogHeader className="pr-8">
          <DialogTitle className="font-display text-base">{bill.description}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-mut">{t("amount")}</p>
              <p className={"num mt-1 font-display text-3xl font-bold " + (status === "overdue" ? "text-neg" : "text-warn")}>
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
                <p className="mt-0.5 text-sm font-medium">{t("day")} {bill.dueDay}</p>
              </div>
            </div>
            {bill.recurrent && (
              <div className="rounded-2xl bg-muted/30 px-3 py-2.5 text-xs font-medium">
                {t("recurring")}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border/50 pt-4">
            <BillDialog
              monthKey={monthKey}
              initial={bill}
              onSave={(data) => financeActions.updateBill(monthKey, bill.id, data)}
              trigger={
                <button
                  type="button"
                  aria-label={t("edit")}
                  className="grid size-9 place-items-center rounded-full bg-brand/10 text-brand transition-colors hover:bg-brand/15"
                >
                  <Pencil className="size-4" />
                </button>
              }
            />
            <ConfirmDeleteDialog
              onConfirm={onDelete}
              trigger={
                <button
                  type="button"
                  aria-label={t("delete")}
                  className="grid size-9 place-items-center rounded-full bg-neg/10 text-neg transition-colors hover:bg-neg/15"
                >
                  <Trash2 className="size-4" />
                </button>
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function BillsSection({ monthKey, bills }: { monthKey: string; bills: Bill[] }) {
  const { t } = useLanguage();
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const selectedBill = selectedBillId ? bills.find((bill) => bill.id === selectedBillId) : undefined;

  const sorted = bills.filter((bill) => billStatus(bill, monthKey) !== "paid").sort((a, b) => {
    const aPending = billStatus(a, monthKey) !== "paid";
    const bPending = billStatus(b, monthKey) !== "paid";

    if (aPending !== bPending) return aPending ? -1 : 1;
    return a.dueDay - b.dueDay;
  });

  const renderBillsList = () => (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-mut">
          {t("billsMonth")}
        </h2>
        <Link
          to="/historico"
          className="shrink-0 border-b border-transparent pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-mut transition-colors hover:border-brand/40 hover:text-brand"
        >
          {t("fullHistory")}
        </Link>
      </div>

      <div className="mb-5 space-y-2.5">
        {sorted.length === 0 && (
          <p className="glass-soft rounded-2xl p-4 text-center text-xs text-mut">{t("noBills")}</p>
        )}
        {sorted.map((bill) => {
          const status = billStatus(bill, monthKey);
          return (
            <div
              key={bill.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedBillId(bill.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedBillId(bill.id);
                }
              }}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-background/80 p-3.5 shadow-sm backdrop-blur-md ${
                status === "overdue" ? "border-neg/25" : status === "pending" ? "border-warn/30 bg-warn/5" : ""
              }`}
            >
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  financeActions.toggleBillPaid(monthKey, bill.id);
                }}
                aria-label={bill.paid ? t("markPending") : t("markPaid")}
                className={`grid size-6 shrink-0 place-items-center rounded-full border transition-colors ${
                  status === "paid"
                    ? "border-pos/40 bg-pos/20 text-pos"
                    : status === "overdue"
                      ? "border-neg/30 bg-neg/5 hover:border-pos/50 hover:bg-pos/10"
                      : status === "pending"
                        ? "border-warn/40 bg-warn/10 text-warn hover:border-pos/50 hover:bg-pos/10"
                        : "border-border hover:border-pos/50 hover:bg-pos/10"
                }`}
              >
                {status === "paid" && <Check className="size-3" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{bill.description}</p>
                <p className={`text-[11px] ${status === "overdue" ? "text-neg" : status === "pending" ? "text-warn" : "text-mut"}`}>
                  {status === "paid"
                    ? `${t("paid")} · ${t("day")} ${bill.dueDay}`
                    : status === "overdue"
                      ? `${t("overdue")} ${t("day")} ${bill.dueDay}`
                      : `${t("due")} ${t("day")} ${bill.dueDay}`}
                  {bill.recurrent ? ` · ${t("recurring")}` : ""}
                </p>
              </div>
              <span
                className={`num font-display text-sm font-semibold ${
                  status === "overdue" ? "text-neg" : status === "pending" ? "text-warn" : status === "paid" ? "text-pos" : ""
                }`}
              >
                {formatCurrency(bill.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );

  if (selectedBill) {
    return (
      <>
        <BillDetailScreen
          bill={selectedBill}
          monthKey={monthKey}
          onClose={() => setSelectedBillId(null)}
          onDelete={() => {
            financeActions.removeBill(monthKey, selectedBill.id);
            setSelectedBillId(null);
          }}
        />
        {renderBillsList()}
      </>
    );
  }

  return renderBillsList();
}
