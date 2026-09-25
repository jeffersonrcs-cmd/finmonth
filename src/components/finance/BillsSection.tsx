import { Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";
import { billStatus, financeActions, formatCurrency, type Bill } from "@/lib/finance";

export function BillsSection({ monthKey, bills }: { monthKey: string; bills: Bill[] }) {
  const { t } = useLanguage();
  const sorted = [...bills].sort((a, b) => {
    const aPending = billStatus(a, monthKey) !== "paid";
    const bPending = billStatus(b, monthKey) !== "paid";

    if (aPending !== bPending) return aPending ? -1 : 1;
    return a.dueDay - b.dueDay;
  });

  return (
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
              className={`glass-soft flex items-center gap-3 rounded-2xl p-3.5 ${
                status === "paid" ? "opacity-60" : ""
              } ${status === "overdue" ? "border-neg/25" : ""}`}
            >
              <button
                onClick={() => financeActions.toggleBillPaid(monthKey, bill.id)}
                aria-label={bill.paid ? t("markPending") : t("markPaid")}
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
                    ? `${t("paid")} · ${t("day")} ${bill.dueDay}`
                    : status === "overdue"
                      ? `${t("overdue")} ${t("day")} ${bill.dueDay}`
                      : `${t("due")} ${t("day")} ${bill.dueDay}`}
                  {bill.recurrent ? ` · ${t("recurring")}` : ""}
                </p>
              </div>
              <span
                className={`num font-display text-sm font-semibold ${
                  status === "overdue" ? "text-neg" : status === "paid" ? "text-pos" : ""
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
}
