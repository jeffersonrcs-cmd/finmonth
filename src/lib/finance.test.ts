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
