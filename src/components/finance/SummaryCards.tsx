import { formatCurrency, type MonthTotals } from "@/lib/finance";

export function SummaryCards({ totals }: { totals: MonthTotals }) {
  const positive = totals.availableBalance >= 0;

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
          className={`num mt-1 font-display text-4xl font-bold tracking-tight ${positive ? "" : "text-neg"}`}
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

      <section className="mb-5 grid grid-cols-2 gap-2.5">
        <Stat label="💰 Receitas" value={formatCurrency(totals.totalIncomes, true)} tone="pos" />
        <Stat label="📄 Contas" value={formatCurrency(totals.totalBills, true)} tone="neg" />
        <Stat label="🏦 Guardado" value={formatCurrency(totals.totalSaved, true)} tone="econ" />
        <Stat
          label="📈 Saldo do mês"
          value={formatCurrency(totals.monthBalance, true)}
          tone={totals.monthBalance >= 0 ? "pos" : "neg"}
        />
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "pos" | "neg" | "econ" | "warn";
}) {
  const toneClass = {
    pos: "text-pos",
    neg: "text-neg",
    econ: "text-econ",
    warn: "text-warn",
  }[tone];

  return (
    <div className="glass rounded-2xl p-3">
      <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-mut">{label}</p>
      <p className={`num font-display text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
