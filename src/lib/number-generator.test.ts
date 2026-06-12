import { describe, expect, it } from "vitest";
import {
  buildStockSummary,
  createDateFromDateKey,
  formatDateKey,
  getDateKeyInTimeZone,
  parseDateKey,
} from "./number-generator";

describe("number-generator helpers", () => {
  describe("date keys", () => {
    it("formats local document dates as yyyy-MM-dd", () => {
      expect(formatDateKey(new Date(2026, 5, 1))).toBe("2026-06-01");
    });

    it("parses valid date-only values", () => {
      expect(parseDateKey("2026-06-01")).toEqual({
        dateKey: "2026-06-01",
        year: 2026,
        month: 6,
        day: 1,
      });
    });

    it("rejects invalid date-only values", () => {
      expect(parseDateKey("2026-02-31")).toBeNull();
      expect(parseDateKey("2026-6-1")).toBeNull();
      expect(parseDateKey("2026-06-01T00:00:00.000Z")).toBeNull();
    });

    it("creates local dates from date keys", () => {
      const date = createDateFromDateKey("2026-06-01");

      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(5);
      expect(date.getDate()).toBe(1);
    });

    it("uses Jakarta calendar days for daily limits", () => {
      expect(
        getDateKeyInTimeZone(
          new Date("2026-05-31T17:00:00.000Z"),
          "Asia/Jakarta",
        ),
      ).toBe("2026-06-01");
    });
  });

  describe("stock summary", () => {
    it("builds yearly stock matrices with dynamic categories", () => {
      const summary = buildStockSummary(
        [
          { category: "um.000", year: 2026, month: 6 },
          { category: "XX.100", year: 2026, month: 12 },
        ],
        [{ category: "xx.100", name: "Kategori Uji", types: ["DOC UJI"] }],
      );

      expect(summary.years).toEqual(["2026"]);
      expect(summary.periodsByYear["2026"]).toHaveLength(12);
      expect(summary.rawMatrix["UM.000"]["2026-06"]).toBe(1);
      expect(summary.rawMatrix["XX.100"]["2026-12"]).toBe(1);
      expect(summary.categoryDetails).toContainEqual({
        code: "XX.100",
        name: "Kategori Uji",
        sourceCategories: ["XX.100"],
      });
    });

    it("combines justification fallback categories in the effective matrix", () => {
      const summary = buildStockSummary(
        [
          { category: "LG.000", year: 2026, month: 7 },
          { category: "LG.270", year: 2026, month: 7 },
        ],
        [],
      );

      expect(summary.rawMatrix["LG.000"]["2026-07"]).toBe(1);
      expect(summary.rawMatrix["LG.270"]["2026-07"]).toBe(1);
      expect(summary.matrix["LG.000"]["2026-07"]).toBe(2);
      expect(summary.matrix["LG.270"]["2026-07"]).toBe(2);
      expect(summary.categoryDetails).toContainEqual({
        code: "LG.000",
        name: "Justifikasi",
        sourceCategories: ["LG.000", "LG.270"],
      });
    });

    it("keeps an empty but valid summary when no stock exists", () => {
      const summary = buildStockSummary([], []);

      expect(summary.years).toEqual([]);
      expect(summary.periodsByYear).toEqual({});
      expect(summary.categories).toContain("UM.000");
      expect(summary.rawMatrix["UM.000"]).toEqual({});
      expect(summary.matrix["UM.000"]).toEqual({});
    });
  });
});
