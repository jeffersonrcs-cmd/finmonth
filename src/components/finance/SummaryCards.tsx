import { Info, Plus } from "lucide-react";
import { formatCurrency, type MonthTotals } from "@/lib/finance";
import { useLanguage } from "@/lib/i18n";
import { useState } from "react";

export function SummaryCards({
  monthKey,
  totals,
  onOpenFinAi,
}: {
  monthKey: string;
  totals: MonthTotals;
  onOpenFinAi: (entryType: "bill" | "income" | "saving") => void;
}) {
  const { t } = useLanguage();
  const positive = totals.availableBalance >= 0;
  const [openInfo, setOpenInfo] = useState<"available" | "future" | null>(null);

  return (
    <>
      <section className="glass relative z-30 mb-4 rounded-3xl p-5" onClick={() => setOpenInfo(null)}>
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
              className="relative -top-0.5 grid size-3 place-items-center rounded-full border border-mut/40 text-mut transition-colors hover:border-brand/60 hover:text-brand"
            >
              <Info className="size-2" strokeWidth={2.5} />
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
      </section>

      <section className="relative z-10 mb-5 grid grid-cols-2 gap-2.5 auto-rows-[70px]">
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
            <button
              type="button"
              aria-label={t("addIncome")}
              onClick={() => onOpenFinAi("income")}
              className="grid size-8 place-items-center rounded-full bg-pos/10 text-pos transition-colors hover:bg-pos/20"
            >
              <Plus className="size-4" />
            </button>
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
            <button
              type="button"
              aria-label={t("addSaving")}
              onClick={() => onOpenFinAi("saving")}
              className="grid size-8 place-items-center rounded-full bg-econ/10 text-econ transition-colors hover:bg-econ/20"
            >
              <Plus className="size-4" />
            </button>
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
            <button
              type="button"
              aria-label={t("addBill")}
              onClick={() => onOpenFinAi("bill")}
              className="grid size-8 place-items-center rounded-full bg-neg/10 text-neg transition-colors hover:bg-neg/20"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <div className="glass relative rounded-2xl p-3">
          <div className="mb-1 flex items-center gap-1">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-mut">📈 {t("futureBalance")}</p>
            <button type="button" aria-label={t("futureBalance")} aria-expanded={openInfo === "future"} onClick={(event) => { event.stopPropagation(); setOpenInfo((current) => current === "future" ? null : "future"); }} className="grid size-3 shrink-0 place-items-center rounded-full border border-mut/40 text-mut transition-colors hover:border-brand/60 hover:text-brand"><Info className="size-2" strokeWidth={2.5} /></button>
          </div>
          {openInfo === "future" && <div className="absolute bottom-full left-0 z-30 mb-2 w-[220px] rounded-xl border border-border/70 bg-popover px-3 py-2 text-[10px] leading-relaxed text-popover-foreground shadow-lg">{t("futureBalanceHint")}</div>}
          <p
            className={`num font-display text-sm font-semibold ${totals.futureBalance >= 0 ? "text-pos" : "text-neg"}`}
          >
            {formatCurrency(totals.futureBalance, true)}
          </p>
        </div>
      </section>
    </>
  );
}
