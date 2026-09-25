import { Plus } from "lucide-react";
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

  return (
    <>
      <section className="glass mb-4 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-mut">💵 {t("availableBalance")}</p>
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
        <div className="mt-4 flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-pos" />
            <span className="text-mut">{t("incomes")}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-neg" />
            <span className="text-mut">{t("bills")}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-econ" />
            <span className="text-mut">{t("savings")}</span>
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
