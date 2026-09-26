import { Info, Plus } from "lucide-react";
import {
  financeActions,
  formatCurrency,
  type Bill,
  type Income,
  type MonthTotals,
  type Saving,
} from "@/lib/finance";
import { BillDialog, IncomeDialog, SavingDialog } from "./dialogs";
import { useLanguage } from "@/lib/i18n";
import { useState } from "react";

export function SummaryCards({
  monthKey,
  totals,
}: {
  monthKey: string;
  totals: MonthTotals;
  incomes: Income[];
  bills: Bill[];
  savings: Saving[];
}) {
  const { t } = useLanguage();
  const positive = totals.availableBalance >= 0;
  const [openInfo, setOpenInfo] = useState<"available" | "future" | null>(null);

  return (
    <>
      <section className="glass mb-4 rounded-3xl p-5" onClick={() => setOpenInfo(null)}>
        <div className="flex items-center justify-between">
          <div className="relative flex items-center gap-1.5">
            <p className="text-xs text-mut">💵 {t("availableBalance")}</p>
            <button
              type="button"
              aria-label={t("availableBalance")}
              aria-expanded={openInfo === "available"}
              onClick={(event) => {
                event.stopPropagation();
                setOpenInfo((current) => (current === "available" ? null : "available"));
              }}
              className="grid size-4 place-items-center rounded-full border border-mut/40 text-mut transition-colors hover:border-brand/60 hover:text-brand"
            >
              <Info className="size-2.5" strokeWidth={2.4} />
            </button>
            {openInfo === "available" && (
              <div className="absolute left-0 top-full z-20 mt-2 w-[220px] rounded-xl border border-border/70 bg-popover px-3 py-2 text-[10px] leading-relaxed text-popover-foreground shadow-lg">
                {t("availableBalanceHint")}
              </div>
            )}
          </div>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${positive ? "border-pos/20 bg-pos/10 text-pos" : "border-neg/20 bg-neg/10 text-neg"}`}
          >
            {positive ? t("positive") : t("negative")}
          </span>
        </div>
        <p
          className={`num mt-1 font-display text-4xl font-bold tracking-tight ${positive ? "" : "text-neg"}`}
        >
          {formatCurrency(totals.availableBalance)}
        </p>
        <div className="relative ml-auto mt-2 flex w-fit items-baseline justify-end gap-2 rounded-xl border border-border/50 bg-background/25 px-3 py-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-mut">{t("futureBalance")}</span>
            <button
              type="button"
              aria-label={t("futureBalance")}
              aria-expanded={openInfo === "future"}
              onClick={(event) => {
                event.stopPropagation();
                setOpenInfo((current) => (current === "future" ? null : "future"));
              }}
              className="grid size-4 place-items-center rounded-full border border-mut/40 text-mut transition-colors hover:border-brand/60 hover:text-brand"
            >
              <Info className="size-2.5" strokeWidth={2.4} />
            </button>
            {openInfo === "future" && (
              <div className="absolute right-0 top-full z-20 mt-2 w-[220px] rounded-xl border border-border/70 bg-popover px-3 py-2 text-[10px] leading-relaxed text-popover-foreground shadow-lg">
                {t("futureBalanceHint")}
              </div>
            )}
          </div>
          <span
            className={`num font-display text-sm font-semibold ${totals.futureBalance >= 0 ? "text-pos" : "text-neg"}`}
          >
            {formatCurrency(totals.futureBalance)}
          </span>
        </div>
      </section>

      <section className="mb-5 grid grid-cols-2 gap-2.5 auto-rows-[70px]">
        <div id="receitas" className="glass scroll-mt-4 rounded-2xl p-3.5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-mut">
                💰 {t("incomes")}
              </p>
              <p className="num mt-1 font-display text-base font-semibold text-pos">
                {formatCurrency(totals.totalIncomes, true)}
              </p>
            </div>
            <IncomeDialog
              monthKey={monthKey}
              onSave={(data) => financeActions.addIncome(monthKey, data)}
              trigger={
                <button
                  aria-label={t("addIncome")}
                  className="grid size-8 place-items-center rounded-full bg-pos/10 text-pos transition-colors hover:bg-pos/20"
                >
                  <Plus className="size-4" />
                </button>
              }
            />
          </div>
          <div className="flex-1" />
        </div>

        <div
          id="guardado"
          className="glass flex h-full min-h-0 scroll-mt-4 flex-col rounded-2xl p-3.5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-mut">
                🏦 {t("savings")}
              </p>
              <p className="num mt-1 font-display text-base font-semibold text-econ">
                {formatCurrency(totals.totalSaved, true)}
              </p>
            </div>
            <SavingDialog
              onSave={(data) => financeActions.addSaving(monthKey, data)}
              trigger={
                <button
                  aria-label={t("addSaving")}
                  className="grid size-8 place-items-center rounded-full bg-econ/10 text-econ transition-colors hover:bg-econ/20"
                >
                  <Plus className="size-4" />
                </button>
              }
            />
          </div>
          <div className="flex-1" />
        </div>

        <div className="glass rounded-2xl p-3.5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-mut">
                📄 {t("bills")}
              </p>
              <p className="num mt-1 font-display text-base font-semibold text-neg">
                {formatCurrency(totals.totalBills, true)}
              </p>
            </div>
            <BillDialog
              monthKey={monthKey}
              onSave={(data) => financeActions.addBill(monthKey, data)}
              trigger={
                <button
                  aria-label={t("addBill")}
                  className="grid size-8 place-items-center rounded-full bg-neg/10 text-neg transition-colors hover:bg-neg/20"
                >
                  <Plus className="size-4" />
                </button>
              }
            />
          </div>
        </div>

        <div className="glass rounded-2xl p-3">
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-mut">
            📈 {t("monthBalance")}
          </p>
          <p
            className={`num font-display text-sm font-semibold ${totals.monthBalance >= 0 ? "text-pos" : "text-neg"}`}
          >
            {formatCurrency(totals.monthBalance, true)}
          </p>
        </div>
      </section>
    </>
  );
}
