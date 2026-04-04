import { describe, expect, it } from "vitest";

import {
  extractOrderLifecycleMetadata,
  normalizeRedashRecords,
} from "../src/lib/redash/normalizers";

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

  it("infers accepted and prepared states from Redash preparation timestamps", () => {
    const acceptedResult = normalizeRedashRecords(
      [
        {
          "Order Date": "04/04/26 01:19:37",
          "Order Number": "330334",
          Store: "Hyper Al Mazar",
          Status: "new",
          "Date d'acceptation prep": "04/04/26 01:25:00",
          "Delivery Type": "Planned Order",
        },
      ],
      { referenceTime: new Date("2026-04-04T02:00:00.000Z") },
    );

    const preparedResult = normalizeRedashRecords(
      [
        {
          "Order Date": "04/04/26 01:19:37",
          "Order Number": "330334",
          Store: "Hyper Al Mazar",
          Status: "new",
          "Date d'acceptation prep": "04/04/26 01:25:00",
          "Order Preparation End": "04/04/26 01:35:00",
          "Delivery Type": "Planned Order",
        },
      ],
      { referenceTime: new Date("2026-04-04T02:00:00.000Z") },
    );

    expect(acceptedResult.normalized[0]?.status).toBe("accepted");
    expect(preparedResult.normalized[0]?.status).toBe("prepared");
  });

  it("parses Redash slash dates in Africa/Casablanca and keeps future lifecycle timestamps from advancing the status", () => {
    const result = normalizeRedashRecords(
      [
        {
          "Order Date": "04/04/26 09:50:44",
          "Order Number": "330406",
          Store: "Gourmet Velodrome",
          Status: "new",
          "Date d'acceptation prep": "04/04/26 10:01:03",
          "Order Preparation End": "04/04/26 10:21:24",
          "Delivery Type": "Rapide XL",
        },
      ],
      { referenceTime: new Date("2026-04-04T08:54:00.000Z") },
    );

    expect(result.normalized[0]?.created_at.toISOString()).toBe("2026-04-04T08:50:44.000Z");
    expect(result.normalized[0]?.lifecycle.accepted_at?.toISOString()).toBe(
      "2026-04-04T09:01:03.000Z",
    );
    expect(result.normalized[0]?.lifecycle.preparation_ended_at?.toISOString()).toBe(
      "2026-04-04T09:21:24.000Z",
    );
    expect(result.normalized[0]?.status).toBe("new");
  });

  it("extracts product counts and delivery alert state from the Redash payload", () => {
    const lifecycle = extractOrderLifecycleMetadata({
      "Number Of Products": "5",
      "Number Of Final Products": "4",
      "Etat Shopper": "alert",
      "Date d'acceptation prep": "04/04/26 01:25:00",
    });

    expect(lifecycle.product_count).toBe(5);
    expect(lifecycle.final_product_count).toBe(4);
    expect(lifecycle.delivery_state).toBe("alert");
    expect(lifecycle.delivery_alert_active).toBe(true);
  });
});
