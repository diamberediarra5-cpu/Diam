import { describe, expect, it } from "vitest";
import { isExpired, startOfMonthUtc } from "@/lib/dates";
import { eurosToCents, formatCents } from "@/lib/money";

describe("money", () => {
  it("convierte euros a céntimos aceptando coma española", () => {
    expect(eurosToCents("12,50")).toBe(1250);
    expect(eurosToCents("1.234,56")).toBe(123456);
    expect(eurosToCents(19.99)).toBe(1999);
    expect(Number.isNaN(eurosToCents("abc"))).toBe(true);
  });
  it("formatea en euros con formato español", () => {
    expect(formatCents(123456)).toMatch(/^1\.?234,56\s€$/);
    expect(formatCents(990)).toContain("9,90");
  });
});

describe("dates", () => {
  it("un presupuesto es válido durante todo su último día", () => {
    const validUntil = new Date("2026-10-10T00:00:00Z");
    expect(isExpired(validUntil, new Date("2026-10-10T20:00:00Z"))).toBe(false);
    expect(isExpired(validUntil, new Date("2026-10-11T00:00:01Z"))).toBe(true);
    expect(isExpired(null)).toBe(false);
  });
  it("inicio de mes en UTC", () => {
    expect(startOfMonthUtc(new Date("2026-10-17T12:00:00Z")).toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });
});
