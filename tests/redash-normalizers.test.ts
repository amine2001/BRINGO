import { describe, expect, it } from "vitest";

import { normalizeRedashRecords } from "../src/lib/redash/normalizers";

describe("redash normalizers", () => {
  it("normalizes Redash CSV rows with spaced headers and Rapide XL values", () => {
    const result = normalizeRedashRecords([
      {
        "Order Date": "03/04/26 20:50:58",
        "Order Number": "330295",
        Store: "Market Taddart",
        Status: "fulfilled",
        "Delivery Type": "Rapide XL",
      },
    ]);

    expect(result.warnings).toHaveLength(0);
    expect(result.normalized).toHaveLength(1);
    expect(result.normalized[0]).toMatchObject({
      order_id: "330295",
      store_name: "Market Taddart",
      delivery_type: "MARKET",
      status: "delivered",
    });
    expect(result.normalized[0]?.created_at).toBeInstanceOf(Date);
  });

  it("maps planned orders to HYPER and preserves new status", () => {
    const result = normalizeRedashRecords([
      {
        "Order Date": "04/04/26 01:41:58",
        "Order Number": "330337",
        Store: "Hyper Borj Fes",
        Status: "new",
        "Delivery Type": "Planned Order",
      },
    ]);

    expect(result.warnings).toHaveLength(0);
    expect(result.normalized[0]).toMatchObject({
      order_id: "330337",
      store_name: "Hyper Borj Fes",
      delivery_type: "HYPER",
      status: "new",
    });
  });
});
