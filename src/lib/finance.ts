import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";

export type Income = {
  id: string;
  description: string;
  amount: number;
  date: string; // yyyy-mm-dd
};

export type Bill = {
  id: string;
  description: string;
  amount: number;
  dueDay: number;
  paid: boolean;
  recurrent: boolean;
};

export type Saving = {
  id: string;
  description: string;
  amount: number;
};

export type MonthData = {
  incomes: Income[];
  bills: Bill[];
  savings: Saving[];
};

export type FinanceState = {
  months: Record<string, MonthData>;
  theme: "dark" | "light";
  userName: string;
};

const STORAGE_KEY = "finmonth.v1";

const emptyMonth = (): MonthData => ({ incomes: [], bills: [], savings: [] });

const initialState: FinanceState = { months: {}, theme: "dark", userName: "" };

let state: FinanceState = initialState;
let hydrated = false;
let cloudUserId: string | null = null;
let cloudReady = false;
let cloudSyncTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function hasFinanceData(value: FinanceState) {
  return Object.values(value.months).some(
    (month) => month.incomes.length > 0 || month.bills.length > 0 || month.savings.length > 0,
  );
}

async function syncCloudNow() {
  if (!cloudUserId || !cloudReady || typeof window === "undefined") return;

  const userId = cloudUserId;
  const months = Object.entries(state.months).map(([monthKey, data]) => ({
    user_id: userId,
    month_key: monthKey,
    data,
  }));

  const [{ error: profileError }, { error: monthsError }] = await Promise.all([
    supabase.from("profiles").upsert({
      id: userId,
      full_name: state.userName,
      theme: state.theme,
    }),
    months.length > 0
      ? supabase.from("finance_months").upsert(months, { onConflict: "user_id,month_key" })
      : Promise.resolve({ error: null }),
  ]);

  if (profileError || monthsError) {
    console.error("Falha ao salvar dados financeiros no Supabase.", profileError ?? monthsError);
  }
}

function scheduleCloudSync() {
  if (!cloudUserId || !cloudReady || typeof window === "undefined") return;
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(() => {
    void syncCloudNow();
  }, 250);
}

export async function connectCloud(userId: string) {
  cloudUserId = userId;
  cloudReady = false;

  const [{ data: rows, error: monthsError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from("finance_months").select("month_key,data").eq("user_id", userId),
    supabase.from("profiles").select("full_name,theme").eq("id", userId).maybeSingle(),
  ]);

  if (monthsError) throw monthsError;
  if (profileError) throw profileError;

  const hasCloudData = (rows?.length ?? 0) > 0;
  if (!hasCloudData && hasFinanceData(state)) {
    if (profile) {
      state = {
        ...state,
        userName: profile.full_name ?? state.userName,
        theme: profile.theme === "light" ? "light" : state.theme,
      };
    }
    persist();
    emit();
    cloudReady = true;
    await syncCloudNow();
    return;
  }

  state = {
    months: Object.fromEntries(
      (rows ?? []).map((row) => [row.month_key, row.data as MonthData]),
    ),
    theme: profile?.theme === "light" ? "light" : "dark",
    userName: profile?.full_name ?? "",
  };
  persist();
  emit();
  cloudReady = true;
}

export function disconnectCloud() {
  cloudReady = false;
  cloudUserId = null;
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = undefined;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  state = initialState;
  emit();
}

export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FinanceState;
      state = {
        months: parsed.months ?? {},
        theme: parsed.theme === "light" ? "light" : "dark",
        userName: typeof parsed.userName === "string" ? parsed.userName : "",
      };
    }
  } catch {
    /* ignore */
  }
  emit();
}

function setState(next: FinanceState) {
  state = next;
  persist();
  emit();
  scheduleCloudSync();
}

function updateMonth(monthKey: string, fn: (m: MonthData) => MonthData) {
  const current = state.months[monthKey] ?? emptyMonth();
  setState({
    ...state,
    months: { ...state.months, [monthKey]: fn(current) },
  });
}

function parseMonthKey(key: string) {
  const parts = key.split("-");
  return { year: Number(parts[0] ?? 0), month: Number(parts[1] ?? 1) };
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const financeActions = {
  setTheme(theme: "dark" | "light") {
    setState({ ...state, theme });
  },
  setUserName(userName: string) {
    setState({ ...state, userName });
  },
  addIncome(monthKey: string, data: Omit<Income, "id">) {
    updateMonth(monthKey, (m) => ({ ...m, incomes: [...m.incomes, { ...data, id: uid() }] }));
  },
  updateIncome(monthKey: string, id: string, data: Omit<Income, "id">) {
    updateMonth(monthKey, (m) => ({
      ...m,
      incomes: m.incomes.map((i) => (i.id === id ? { ...data, id } : i)),
    }));
  },
  removeIncome(monthKey: string, id: string) {
    updateMonth(monthKey, (m) => ({ ...m, incomes: m.incomes.filter((i) => i.id !== id) }));
  },
  addBill(monthKey: string, data: Omit<Bill, "id">) {
    updateMonth(monthKey, (m) => ({ ...m, bills: [...m.bills, { ...data, id: uid() }] }));
  },
  updateBill(monthKey: string, id: string, data: Omit<Bill, "id">) {
    updateMonth(monthKey, (m) => ({
      ...m,
      bills: m.bills.map((b) => (b.id === id ? { ...data, id } : b)),
    }));
  },
  removeBill(monthKey: string, id: string) {
    updateMonth(monthKey, (m) => ({ ...m, bills: m.bills.filter((b) => b.id !== id) }));
  },
  toggleBillPaid(monthKey: string, id: string) {
    updateMonth(monthKey, (m) => ({
      ...m,
      bills: m.bills.map((b) => (b.id === id ? { ...b, paid: !b.paid } : b)),
    }));
  },
  addSaving(monthKey: string, data: Omit<Saving, "id">) {
    updateMonth(monthKey, (m) => ({ ...m, savings: [...m.savings, { ...data, id: uid() }] }));
  },
  updateSaving(monthKey: string, id: string, data: Omit<Saving, "id">) {
    updateMonth(monthKey, (m) => ({
      ...m,
      savings: m.savings.map((s) => (s.id === id ? { ...data, id } : s)),
    }));
  },
  removeSaving(monthKey: string, id: string) {
    updateMonth(monthKey, (m) => ({ ...m, savings: m.savings.filter((s) => s.id !== id) }));
  },
  /** Copia contas recorrentes do mês anterior como pendentes. Retorna quantas copiou. */
  copyBillsFromPrevious(monthKey: string) {
    const prev = state.months[previousMonthKey(monthKey)];
    if (!prev) return 0;
    const existing = new Set(
      (state.months[monthKey]?.bills ?? []).map((b) => b.description.trim().toLowerCase()),
    );
    const copied = prev.bills
      .filter((b) => b.recurrent && !existing.has(b.description.trim().toLowerCase()))
      .map((b) => ({ ...b, id: uid(), paid: false }));
    if (copied.length === 0) return 0;
    updateMonth(monthKey, (m) => ({ ...m, bills: [...m.bills, ...copied] }));
    return copied.length;
  },
  /** Copia receitas do mês anterior, ajustando a data para o mês atual. */
  copyIncomesFromPrevious(monthKey: string) {
    const prev = state.months[previousMonthKey(monthKey)];
    if (!prev) return 0;
    const existing = new Set(
      (state.months[monthKey]?.incomes ?? []).map((i) => i.description.trim().toLowerCase()),
    );
    const { year, month } = parseMonthKey(monthKey);
    const copied = prev.incomes
      .filter((i) => !existing.has(i.description.trim().toLowerCase()))
      .map((i) => {
        const day = Number(i.date.split("-")[2] ?? 1);
        const safeDay = Math.min(day, daysInMonth(year, month));
        return {
          ...i,
          id: uid(),
          date: `${monthKey}-${String(safeDay).padStart(2, "0")}`,
        };
      });
    if (copied.length === 0) return 0;
    updateMonth(monthKey, (m) => ({ ...m, incomes: [...m.incomes, ...copied] }));
    return copied.length;
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;
const getServerSnapshot = () => initialState;

export function useFinanceState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useMonthData(monthKey: string): MonthData {
  const s = useFinanceState();
  return s.months[monthKey] ?? emptyMonth();
}

/* ---------- datas ---------- */

export const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonthKey(key: string, delta: number) {
  const { year, month } = parseMonthKey(key);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const previousMonthKey = (key: string) => shiftMonthKey(key, -1);

export function monthLabel(key: string, short = false) {
  const { year, month } = parseMonthKey(key);
  const name = MONTH_NAMES[month - 1] ?? "";
  return short ? `${name.slice(0, 3)} ${year}` : `${name} ${year}`;
}

export function formatCurrency(value: number, compact = false) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 0 : 2,
  }).format(value);
}

/* ---------- cálculos ---------- */

export type BillStatus = "paid" | "pending" | "overdue";

export function billStatus(bill: Bill, monthKey: string): BillStatus {
  if (bill.paid) return "paid";
  const { year, month } = parseMonthKey(monthKey);
  const due = new Date(year, month - 1, Math.min(bill.dueDay, daysInMonth(year, month)));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today ? "overdue" : "pending";
}

export type MonthTotals = {
  totalIncomes: number;
  totalBills: number;
  paidCount: number;
  paidTotal: number;
  pendingCount: number;
  pendingTotal: number;
  overdueCount: number;
  totalSaved: number;
  monthBalance: number;
  availableBalance: number;
};

export function computeTotals(data: MonthData, monthKey: string): MonthTotals {
  const totalIncomes = data.incomes.reduce((s, i) => s + i.amount, 0);
  const totalBills = data.bills.reduce((s, b) => s + b.amount, 0);
  const totalSaved = data.savings.reduce((s, v) => s + v.amount, 0);
  let paidCount = 0;
  let paidTotal = 0;
  let pendingCount = 0;
  let pendingTotal = 0;
  let overdueCount = 0;
  for (const bill of data.bills) {
    const status = billStatus(bill, monthKey);
    if (status === "paid") {
      paidCount += 1;
      paidTotal += bill.amount;
    } else {
      pendingCount += 1;
      pendingTotal += bill.amount;
      if (status === "overdue") overdueCount += 1;
    }
  }
  const monthBalance = totalIncomes - totalBills;
  return {
    totalIncomes,
    totalBills,
    paidCount,
    paidTotal,
    pendingCount,
    pendingTotal,
    overdueCount,
    totalSaved,
    monthBalance,
    availableBalance: monthBalance - totalSaved,
  };
}

/** Meses com dados, em ordem cronológica. */
export function monthKeysWithData(state: FinanceState) {
  return Object.entries(state.months)
    .filter(([, m]) => m.incomes.length || m.bills.length || m.savings.length)
    .map(([k]) => k)
    .sort();
}
