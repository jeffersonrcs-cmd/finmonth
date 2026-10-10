import { describe, expect, it } from "vitest";
import {
  billStatus,
  computeTotals,
  daysInMonth,
  normalizeBillDueDay,
  shiftMonthKey,
  type Bill,
  type MonthData,
} from "./finance";

describe("finance date helpers", () => {
  it("returns the correct number of days for February", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
  });

  it("normalizes a bill due day to the last day of the target month", () => {
    expect(normalizeBillDueDay(31, "2026-02")).toBe(28);
    expect(normalizeBillDueDay(31, "2028-02")).toBe(29);
    expect(normalizeBillDueDay(31, "2026-04")).toBe(30);
    expect(normalizeBillDueDay(15, "2026-04")).toBe(15);
  });

  it("shifts month keys across year boundaries", () => {
    expect(shiftMonthKey("2026-01", -1)).toBe("2025-12");
    expect(shiftMonthKey("2026-12", 1)).toBe("2027-01");
  });
});

describe("finance calculations", () => {
  const data: MonthData = {
    incomes: [{ id: "i1", description: "Salary", amount: 5000, date: "2026-09-05" }],
    bills: [
      { id: "b1", description: "Paid bill", amount: 1000, dueDay: 5, paid: true, recurrent: false },
      { id: "b2", description: "Pending bill", amount: 1500, dueDay: 20, paid: false, recurrent: false },
    ],
    savings: [{ id: "s1", description: "Reserve", amount: 500 }],
  };

  it("keeps future income out of available balance until its date", () => {
    const data: MonthData = {
      incomes: [
        { id: "i1", description: "Salary 1", amount: 3000, date: "2026-10-01" },
        { id: "i2", description: "Salary 2", amount: 3000, date: "2026-10-15" },
      ],
      bills: [],
      savings: [],
    };

    const beforePayday = computeTotals(data, "2026-10", new Date(2026, 9, 14, 12));
    const onPayday = computeTotals(data, "2026-10", new Date(2026, 9, 15, 12));

    expect(beforePayday.availableBalance).toBe(3000);
    expect(beforePayday.futureBalance).toBe(6000);
    expect(onPayday.availableBalance).toBe(6000);
    expect(onPayday.futureBalance).toBe(6000);
  });

  it("does not subtract future savings from available balance before their date", () => {
    const futureSavingData: MonthData = { incomes: [{ id: "i1", description: "Salary", amount: 3000, date: "2026-10-01" }], bills: [], savings: [{ id: "s1", description: "Future reserve", amount: 500, date: "2026-10-15" }] };
    const beforeDate = computeTotals(futureSavingData, "2026-10", new Date(2026, 9, 10, 12));
    const onDate = computeTotals(futureSavingData, "2026-10", new Date(2026, 9, 15, 12));
    expect(beforeDate.availableBalance).toBe(3000);
    expect(beforeDate.futureBalance).toBe(2500);
    expect(onDate.availableBalance).toBe(2500);
  });

  it("separates available and future balance", () => {
    const totals = computeTotals(data, "2026-09");

    expect(totals.paidTotal).toBe(1000);
    expect(totals.pendingTotal).toBe(1500);
    expect(totals.availableBalance).toBe(3500);
    expect(totals.futureBalance).toBe(2000);
  });
});

describe("bill status", () => {
  it("keeps a paid bill paid regardless of its due date", () => {
    const bill: Bill = {
      id: "b1",
      description: "Paid",
      amount: 100,
      dueDay: 1,
      paid: true,
      recurrent: false,
    };

    expect(billStatus(bill, "2026-09")).toBe("paid");
  });
});


describe("FinAI fallback and registration intent parser", () => {
  it("extracts bill creation action from natural Portuguese text", async () => {
    const { buildFallbackReply } = await import("../components/finance/FinAI");
    const mockState = { months: {} } as ReturnType<typeof import("./finance").useFinanceState>;
    const mockT = (key: string) => key;

    const res = buildFallbackReply(
      "cadastrar conta de luz 150 reais dia 10",
      "2026-10",
      2026,
      mockState,
      mockT,
    );

    expect(res.action).not.toBeNull();
    expect(res.action?.type).toBe("create_bill");
    expect(res.action?.data.amount).toBe(150);
    expect(res.action?.data.dueDay).toBe(10);
  });
});
