import { describe, expect, it } from "vitest";
import { getNextSubscriptionChargeDate } from "./subscriptionRules";

describe("recorrência de assinaturas", () => {
  it("usa a cobrança do mês quando ela ainda não venceu", () => {
    expect(
      getNextSubscriptionChargeDate(
        { billing_day: 20, recurrence: "monthly" },
        undefined,
        "2026-07-16",
      ),
    ).toBe("2026-07-20");
  });

  it("avança após uma cobrança já gerada", () => {
    expect(
      getNextSubscriptionChargeDate(
        { billing_day: 20, recurrence: "monthly" },
        "2026-07-20",
        "2026-07-16",
      ),
    ).toBe("2026-08-20");
  });

  it("respeita recorrências trimestrais e o último dia do mês", () => {
    expect(
      getNextSubscriptionChargeDate(
        { billing_day: 31, recurrence: "quarterly" },
        "2026-11-30",
        "2026-11-10",
      ),
    ).toBe("2027-02-28");
  });
});
