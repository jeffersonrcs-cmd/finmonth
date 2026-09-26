import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Send,
  Sparkles,
  X,
  PlusCircle,
  Calendar,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import {
  computeTotals,
  financeActions,
  formatCurrency,
  monthLabel,
  previousMonthKey,
  useFinanceState,
  useMonthData,
} from "@/lib/finance";
import { useHistoryRows, useAnnualTotals } from "@/components/finance/HistoryChart";
import { supabase } from "@/lib/supabase";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

export type ChartMode =
  | "month"
  | "compare"
  | "year"
  | "history"
  | "balance"
  | "savings"
  | "topBills"
  | "cashflow"
  | "incomeBreakdown"
  | "billStatus"
  | "dailyFlow"
  | "recurring"
  | null;

export type FinAiAction =
  | {
      type: "create_bill";
      data: {
        description: string;
        amount: number;
        dueDay: number;
        recurrent?: boolean;
        paid?: boolean;
      };
    }
  | {
      type: "create_income";
      data: {
        description: string;
        amount: number;
        day: number;
      };
    }
  | {
      type: "create_saving";
      data: {
        description: string;
        amount: number;
      };
    };

export type AiReply = {
  title: string;
  text: string;
  chart: ChartMode;
  action?: FinAiAction | null;
};

const DAILY_LIMIT = 20;
const FIN_AI_QUOTA_ENABLED = false;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseAmountFromText(text: string): number {
  const match = text.match(/(?:r\$|\$|€)?\s*(\d+(?:[.,]\d{1,2})?)/i);
  if (!match) return 0;
  const numStr = match[1].replace(",", ".");
  const val = parseFloat(numStr);
  return Number.isFinite(val) ? val : 0;
}

function parseDayFromText(text: string): number {
  const match = text.match(/(?:dia|vencimento|para o dia|vence dia)\s*(\d{1,2})/i);
  if (match) {
    const d = parseInt(match[1], 10);
    if (d >= 1 && d <= 31) return d;
  }
  return 5;
}

function parseDescriptionFromText(text: string, fallback: string): string {
  const cleaned = text
    .replace(/(?:cadastr[ea]|adicion[ea]|lanç[ae]|cri[ae]|inser[ea]|registra)/gi, "")
    .replace(
      /(?:uma?\s+)?(?:conta|despesa|receita|ganho|entrada|guardado|reserva|economia)(?:\s+de)?/gi,
      "",
    )
    .replace(/(?:r\$|\$|€)?\s*\d+(?:[.,]\d{1,2})?/gi, "")
    .replace(/(?:no|para o)?\s*dia\s*\d{1,2}/gi, "")
    .replace(/(?:recorrente|fix[oa]|mensal)/gi, "")
    .replace(/(?:com\s+vencimento|vencendo|vence)/gi, "")
    .trim();
  return cleaned.length > 1 ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : fallback;
}

export function buildFallbackReply(
  prompt: string,
  monthKey: string,
  year: number,
  state: ReturnType<typeof useFinanceState>,
  t: (k: TranslationKey) => string,
): AiReply {
  const query = normalize(prompt);
  const data = state.months[monthKey] ?? { incomes: [], bills: [], savings: [] };
  const totals = computeTotals(data, monthKey);

  // Intent: Register bill (conta / despesa)
  if (
    query.includes("cadastr") ||
    query.includes("adicion") ||
    query.includes("lanc") ||
    query.includes("cri") ||
    query.includes("inser") ||
    query.includes("registra")
  ) {
    if (
      query.includes("conta") ||
      query.includes("despesa") ||
      query.includes("boleto") ||
      query.includes("fatura")
    ) {
      const amount = parseAmountFromText(prompt);
      const dueDay = parseDayFromText(prompt);
      const desc = parseDescriptionFromText(prompt, t("bills"));
      const recurrent =
        query.includes("recorrente") || query.includes("fixa") || query.includes("mensal");
      return {
        title: t("newBill"),
        text: `Identifiquei uma nova conta para você: "${desc}", no valor de ${formatCurrency(amount)}, vencendo no dia ${dueDay}. Revise os dados abaixo e confirme o cadastro:`,
        chart: null,
        action: {
          type: "create_bill",
          data: {
            description: desc,
            amount,
            dueDay,
            recurrent,
            paid: false,
          },
        },
      };
    }

    if (
      query.includes("receita") ||
      query.includes("salario") ||
      query.includes("renda") ||
      query.includes("ganho") ||
      query.includes("entrada")
    ) {
      const amount = parseAmountFromText(prompt);
      const day = parseDayFromText(prompt);
      const desc = parseDescriptionFromText(prompt, t("salary"));
      return {
        title: t("newIncome"),
        text: `Identifiquei uma nova receita: "${desc}", no valor de ${formatCurrency(amount)}, referente ao dia ${day}. Revise os dados e confirme o cadastro:`,
        chart: null,
        action: {
          type: "create_income",
          data: {
            description: desc,
            amount,
            day,
          },
        },
      };
    }

    if (
      query.includes("guardad") ||
      query.includes("econom") ||
      query.includes("reserva") ||
      query.includes("poup")
    ) {
      const amount = parseAmountFromText(prompt);
      const desc = parseDescriptionFromText(prompt, t("emergencyReserve"));
      return {
        title: t("newSaving"),
        text: `Identifiquei um valor guardado: "${desc}", no valor de ${formatCurrency(amount)}. Revise os dados e confirme o cadastro:`,
        chart: null,
        action: {
          type: "create_saving",
          data: {
            description: desc,
            amount,
          },
        },
      };
    }
  }

  // Fallback financial analysis
  const previousKey = previousMonthKey(monthKey);
  const previousData = state.months[previousKey] ?? { incomes: [], bills: [], savings: [] };
  const paidBills = data.bills.filter((bill) => bill.paid);
  const pendingBills = data.bills.filter((bill) => !bill.paid);
  const savingsRate = totals.totalIncomes > 0 ? (totals.totalSaved / totals.totalIncomes) * 100 : 0;
  const billRate = totals.totalIncomes > 0 ? (totals.totalBills / totals.totalIncomes) * 100 : 0;

  if (
    query.includes("analis") ||
    query.includes("completa") ||
    query.includes("como foi") ||
    query.includes("panorama")
  ) {
    return {
      title: t("completeAnalysis"),
      text: `Neste mês (${monthLabel(monthKey)}), você recebeu ${formatCurrency(totals.totalIncomes)}, possui ${formatCurrency(totals.totalBills)} em contas e guardou ${formatCurrency(totals.totalSaved)}. O saldo disponível é de ${formatCurrency(totals.availableBalance)}. Taxa de economia em ${Math.round(savingsRate)}% e contas representam ${Math.round(billRate)}% das receitas.`,
      chart: "cashflow",
      action: null,
    };
  }

  return {
    title: "FinAI",
    text: "Posso analisar receitas, contas, guardados, fluxo financeiro, gráficos ou preparar o cadastro de novas contas, receitas e guardados para você!",
    chart: null,
    action: null,
  };
}

function FinAiChart({
  mode,
  monthKey,
  year,
  state,
}: {
  mode: Exclude<ChartMode, null>;
  monthKey: string;
  year: number;
  state: ReturnType<typeof useFinanceState>;
}) {
  const monthData = useMonthData(monthKey);
  const monthTotals = computeTotals(monthData, monthKey);
  const previousKey = previousMonthKey(monthKey);
  const previousData = state.months[previousKey] ?? { incomes: [], bills: [], savings: [] };
  const previousTotals = computeTotals(previousData, previousKey);
  const annualRows = useHistoryRows(12, year);
  const historyRows = useHistoryRows(6);
  const annualTotals = useAnnualTotals(year);
  const { language, t } = useLanguage();

  const data = useMemo(() => {
    if (mode === "month")
      return [
        { label: t("incomes"), value: monthTotals.totalIncomes },
        { label: t("bills"), value: monthTotals.totalBills },
        { label: t("savings"), value: monthTotals.totalSaved },
      ];
    if (mode === "compare")
      return [
        {
          label: t("incomes"),
          atual: monthTotals.totalIncomes,
          anterior: previousTotals.totalIncomes,
        },
        { label: t("bills"), atual: monthTotals.totalBills, anterior: previousTotals.totalBills },
        { label: t("savings"), atual: monthTotals.totalSaved, anterior: previousTotals.totalSaved },
      ];
    if (mode === "topBills")
      return [...monthData.bills]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6)
        .map((bill) => ({ label: bill.description, value: bill.amount }));
    if (mode === "cashflow")
      return [
        { label: t("incomes"), value: monthTotals.totalIncomes },
        { label: t("bills"), value: monthTotals.totalBills },
        { label: t("savings"), value: monthTotals.totalSaved },
        { label: t("availableBalance"), value: monthTotals.availableBalance },
      ];
    if (mode === "incomeBreakdown")
      return monthData.incomes.map((inc) => ({ label: inc.description, value: inc.amount }));
    if (mode === "billStatus") {
      const paid = monthData.bills.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0);
      const pending = monthData.bills.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0);
      return [
        { label: t("paidBills"), value: paid },
        { label: t("pendingBills"), value: pending },
      ];
    }
    if (mode === "year")
      return annualRows.map((r) => ({
        label: r.label,
        [t("incomes")]: r.receitas,
        [t("bills")]: r.contas,
        [t("savings")]: r.guardado,
      }));
    if (mode === "history")
      return historyRows.map((r) => ({
        label: r.label,
        [t("incomes")]: r.receitas,
        [t("bills")]: r.contas,
        [t("savings")]: r.guardado,
      }));
    return [];
  }, [mode, monthTotals, previousTotals, monthData, annualRows, historyRows, t]);

  const chartTitle =
    mode === "month"
      ? t("monthAnalysis")
      : mode === "compare"
        ? t("monthlyComparisonTitle")
        : mode === "year"
          ? t("annualChart")
          : mode === "history"
            ? t("last6Months")
            : mode === "topBills"
              ? t("largestBills")
              : mode === "cashflow"
                ? t("cashFlow")
                : mode === "incomeBreakdown"
                  ? t("detailedIncome")
                  : mode === "billStatus"
                    ? t("totalExpenses")
                    : "";

  return (
    <div className="mt-3 rounded-2xl border border-border/60 bg-muted/20 p-3">
      {chartTitle && (
        <p className="mb-2 text-[10px] font-semibold text-foreground/80">{chartTitle}</p>
      )}
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
            <Tooltip
              formatter={(val: unknown) => [formatCurrency(Number(val) || 0), ""]}
              contentStyle={{
                backgroundColor: "var(--popover)",
                borderColor: "var(--border)",
                borderRadius: "12px",
                fontSize: "11px",
              }}
            />
            {mode === "compare" ? (
              <>
                <Legend wrapperStyle={{ fontSize: 9, paddingTop: 5 }} />
                <Bar
                  dataKey="anterior"
                  name={t("previous")}
                  fill="var(--muted-foreground)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="atual"
                  name={t("current")}
                  fill="var(--brand)"
                  radius={[4, 4, 0, 0]}
                />
              </>
            ) : mode === "year" || mode === "history" ? (
              <>
                <Legend wrapperStyle={{ fontSize: 9, paddingTop: 5 }} />
                <Bar
                  dataKey={t("incomes")}
                  name={t("incomes")}
                  fill="var(--pos)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey={t("bills")}
                  name={t("bills")}
                  fill="var(--neg)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey={t("savings")}
                  name={t("savings")}
                  fill="var(--econ)"
                  radius={[4, 4, 0, 0]}
                />
              </>
            ) : (
              <Bar dataKey="value" name={t("amount")} fill="var(--brand)" radius={[5, 5, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export type FinAiEntryType = "bill" | "income" | "saving";

export function FinAi({
  monthKey,
  onClose,
  isFloating = false,
  entryType,
}: {
  monthKey: string;
  onClose?: () => void;
  isFloating?: boolean;
  entryType?: FinAiEntryType;
}) {
  const { language, t } = useLanguage();
  const state = useFinanceState();
  const year = Number(monthKey.slice(0, 4));

  // 4 sugestões solicitadas
  const suggestions = [
    t("analysisSuggestion"),
    t("registerBillSuggestion"),
    t("registerIncomeSuggestion"),
    t("monthQuestion"),
  ];

  const [prompt, setPrompt] = useState("");
  const contextualQuestion =
    entryType === "bill"
      ? t("finaiBillPrompt")
      : entryType === "income"
        ? t("finaiIncomePrompt")
        : entryType === "saving"
          ? t("finaiSavingPrompt")
          : null;
  const [reply, setReply] = useState<AiReply | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [actionDone, setActionDone] = useState(false);

  // Editable state for proposed actions
  const [actionDesc, setActionDesc] = useState("");
  const [actionAmount, setActionAmount] = useState("");
  const [actionDay, setActionDay] = useState("5");
  const [actionRecurrent, setActionRecurrent] = useState(true);

  useEffect(() => {
    if (reply?.action) {
      setActionDone(false);
      setActionDesc(reply.action.data.description);
      setActionAmount(String(reply.action.data.amount || ""));
      if (reply.action.type === "create_bill") {
        setActionDay(String(reply.action.data.dueDay || 5));
        setActionRecurrent(reply.action.data.recurrent ?? true);
      } else if (reply.action.type === "create_income") {
        setActionDay(String(reply.action.data.day || 1));
      }
    }
  }, [reply]);

  async function ask(question: string) {
    const value = question.trim();
    if (!value || aiLoading) return;
    setAiLoading(true);
    setActionDone(false);

    try {
      const history = reply ? [{ role: "assistant", text: reply.text }] : [];
      const { data, error } = await supabase.functions.invoke("fin-ai", {
        body: { question: value, monthKey, history, language },
      });

      if (error) throw new Error(error.message || t("operationFailed"));

      const result = data as {
        title?: string;
        text?: string;
        chartMode?: ChartMode;
        action?: FinAiAction | null;
        error?: string;
      };

      if (result.error) throw new Error(result.error);

      setReply({
        title: result.title?.trim() || "FinAI",
        text: result.text?.trim() || t("financialDataInsufficient"),
        chart: result.chartMode ?? null,
        action: result.action ?? null,
      });
      setPrompt("");
    } catch {
      // Fallback local se edge function estiver indisponível ou offline
      const fallback = buildFallbackReply(value, monthKey, year, state, t);
      setReply(fallback);
      setPrompt("");
    } finally {
      setAiLoading(false);
    }
  }

  function handleConfirmAction() {
    if (!reply?.action || actionDone) return;
    const numAmount = parseFloat(actionAmount.replace(",", ".")) || 0;
    const finalDesc = actionDesc.trim() || t("item");

    if (reply.action.type === "create_bill") {
      const day = parseInt(actionDay, 10) || 5;
      financeActions.addBill(monthKey, {
        description: finalDesc,
        amount: numAmount,
        dueDay: Math.min(Math.max(day, 1), 31),
        paid: false,
        recurrent: actionRecurrent,
      });
    } else if (reply.action.type === "create_income") {
      const day = parseInt(actionDay, 10) || 1;
      financeActions.addIncome(monthKey, {
        description: finalDesc,
        amount: numAmount,
        date: `${monthKey}-${String(Math.min(Math.max(day, 1), 31)).padStart(2, "0")}`,
      });
    } else if (reply.action.type === "create_saving") {
      financeActions.addSaving(monthKey, {
        description: finalDesc,
        amount: numAmount,
      });
    }

    setActionDone(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(prompt);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-2xl bg-brand/10 text-brand shadow-sm">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-base font-semibold leading-none">FinAI</h1>
            <p className="mt-1 text-[11px] text-mut">{t("finaiSubtitle")}</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeChat")}
            className="grid size-8 place-items-center rounded-full text-mut transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Intro banner */}
        <section className="glass rounded-3xl p-4">
          <p className="text-sm font-semibold">{contextualQuestion ?? t("whatWant")}</p>
          <p className="mt-1 text-xs leading-relaxed text-mut">{t("askMonth")}</p>

          {aiLoading && (
            <div className="mt-3 flex items-center gap-2 text-[10px] text-brand">
              <span className="size-1.5 animate-pulse rounded-full bg-brand" />
              {t("analyzing")}
            </div>
          )}

          {/* 4 Sugestões */}
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void ask(suggestion)}
                className="min-h-9 rounded-xl border border-border/70 bg-muted/40 px-2.5 py-1.5 text-[10px] font-medium leading-tight text-foreground/80 transition-colors hover:border-brand/40 hover:bg-brand/10 hover:text-brand"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>

        {/* Reply card */}
        {reply && (
          <section className="glass rounded-3xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                <Sparkles className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-sm font-semibold">{reply.title}</h2>
                  <span className="text-[9px] uppercase tracking-widest text-mut">FinAI</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-foreground/90 whitespace-pre-line">
                  {reply.text}
                </p>

                {/* Interactive Action Card (Opção A) */}
                {reply.action && (
                  <div className="mt-3 rounded-2xl border border-brand/30 bg-brand/5 p-3.5 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold text-brand">
                      <PlusCircle className="size-4" />
                      <span>
                        {reply.action.type === "create_bill"
                          ? t("newBill")
                          : reply.action.type === "create_income"
                            ? t("newIncome")
                            : t("newSaving")}
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-mut">
                          {t("description")}
                        </label>
                        <input
                          type="text"
                          value={actionDesc}
                          disabled={actionDone}
                          onChange={(e) => setActionDesc(e.target.value)}
                          className="mt-0.5 w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-brand"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-mut">
                            {t("amount")}
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={actionAmount}
                            disabled={actionDone}
                            onChange={(e) => setActionAmount(e.target.value)}
                            placeholder="0,00"
                            className="mt-0.5 w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-brand"
                          />
                        </div>

                        {reply.action.type !== "create_saving" && (
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-mut">
                              {reply.action.type === "create_bill" ? t("dueDate") : t("incomeDay")}
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={31}
                              value={actionDay}
                              disabled={actionDone}
                              onChange={(e) => setActionDay(e.target.value)}
                              className="mt-0.5 w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-brand"
                            />
                          </div>
                        )}
                      </div>

                      {reply.action.type === "create_bill" && (
                        <label className="flex items-center gap-2 pt-1 text-[11px] text-mut cursor-pointer">
                          <input
                            type="checkbox"
                            checked={actionRecurrent}
                            disabled={actionDone}
                            onChange={(e) => setActionRecurrent(e.target.checked)}
                            className="rounded accent-brand"
                          />
                          <span>{t("recurringAccount")}</span>
                        </label>
                      )}
                    </div>

                    <div className="mt-3">
                      {actionDone ? (
                        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-pos/15 py-2 text-xs font-semibold text-pos">
                          <Check className="size-4" />
                          <span>
                            {reply.action.type === "create_bill"
                              ? t("billCreatedSuccess")
                              : reply.action.type === "create_income"
                                ? t("incomeCreatedSuccess")
                                : t("savingCreatedSuccess")}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleConfirmAction}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90 active:scale-[0.98]"
                        >
                          <Check className="size-4" />
                          <span>{t("confirmCreation")}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Visual Chart if suggested */}
                {reply.chart && (
                  <FinAiChart mode={reply.chart} monthKey={monthKey} year={year} state={state} />
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Input form fixed at bottom of chat */}
      <div className="border-t border-border/70 p-3 bg-background/90 backdrop-blur-md">
        <form onSubmit={submit} className="glass flex items-center gap-2 rounded-2xl p-1.5">
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={entryType ? t("finaiEntryExample") : t("enterQuestion")}
            className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-mut/70"
            aria-label={t("askFinAi")}
          />
          <button
            type="submit"
            aria-label={t("sendQuestion")}
            disabled={!prompt.trim() || aiLoading}
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-background transition-opacity disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-center gap-1.5 text-[9px] text-mut/70">
          <ArrowUpRight className="size-3" />
          <span>{t("finaiFootnote")}</span>
        </div>
      </div>
    </div>
  );
}
