import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatBtc,
  formatDate,
  formatRelativeTime,
  truncateAddress,
  generateId,
  generateInvoiceNumber,
  getStatusColor,
} from "./utils";

// ─── cn (classname joiner) ───────────────────────────────────────────────────

describe("cn", () => {
  it("joins string classes", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("returns empty string for no classes", () => {
    expect(cn()).toBe("");
  });
});

// ─── formatCurrency ──────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("handles large amounts", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000.00");
  });

  it("rounds small amounts to 2 decimals", () => {
    const result = formatCurrency(0.999);
    expect(result).toBe("$1.00");
  });
});

// ─── formatBtc ───────────────────────────────────────────────────────────────

describe("formatBtc", () => {
  it("formats with 8 decimal places", () => {
    expect(formatBtc(1.23456789)).toBe("1.23456789 BTC");
  });

  it("pads zeroes", () => {
    expect(formatBtc(0.1)).toBe("0.10000000 BTC");
  });

  it("handles zero", () => {
    expect(formatBtc(0)).toBe("0.00000000 BTC");
  });
});

// ─── formatDate ──────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("formats ISO date string", () => {
    const result = formatDate("2025-01-15T00:00:00Z");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2025");
  });

  it("formats Date object", () => {
    const result = formatDate(new Date("2025-06-01"));
    expect(result).toContain("2025");
  });
});

// ─── formatRelativeTime ──────────────────────────────────────────────────────

describe("formatRelativeTime", () => {
  it('shows "Just now" for recent times', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe("Just now");
  });

  it("shows minutes for times < 1 hour ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000);
    expect(formatRelativeTime(fiveMinAgo)).toBe("5m ago");
  });

  it("shows hours for times < 1 day ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3_600_000);
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
  });

  it("shows days for times < 30 days ago", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86_400_000);
    expect(formatRelativeTime(tenDaysAgo)).toBe("10d ago");
  });

  it("falls back to formatted date for old times", () => {
    const oldDate = new Date(Date.now() - 60 * 86_400_000);
    const result = formatRelativeTime(oldDate);
    // Should not contain "ago" — should be a formatted date
    expect(result).not.toContain("ago");
  });
});

// ─── truncateAddress ─────────────────────────────────────────────────────────

describe("truncateAddress", () => {
  it("truncates with default chars", () => {
    const addr = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    const result = truncateAddress(addr);
    expect(result).toBe("ST1PQH...GZGM");
  });

  it("handles custom char count", () => {
    const addr = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    const result = truncateAddress(addr, 6);
    expect(result).toBe("ST1PQHQK...TPGZGM");
  });

  it("returns empty string for empty input", () => {
    expect(truncateAddress("")).toBe("");
  });
});

// ─── generateId ──────────────────────────────────────────────────────────────

describe("generateId", () => {
  it("returns a UUID string", () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("generates unique IDs", () => {
    const a = generateId();
    const b = generateId();
    expect(a).not.toBe(b);
  });
});

// ─── generateInvoiceNumber ───────────────────────────────────────────────────

describe("generateInvoiceNumber", () => {
  it("generates with default prefix", () => {
    expect(generateInvoiceNumber("INV", 0)).toBe("INV-001");
  });

  it("pads to 3 digits", () => {
    expect(generateInvoiceNumber("INV", 99)).toBe("INV-100");
  });

  it("uses custom prefix", () => {
    expect(generateInvoiceNumber("VRT", 4)).toBe("VRT-005");
  });
});

// ─── getStatusColor ──────────────────────────────────────────────────────────

describe("getStatusColor", () => {
  it("returns colors for known statuses", () => {
    const statuses = [
      "draft",
      "pending",
      "paid",
      "overdue",
      "cancelled",
      "created",
      "funded",
      "delivered",
      "completed",
      "disputed",
    ];
    for (const status of statuses) {
      const colors = getStatusColor(status);
      expect(colors).toHaveProperty("bg");
      expect(colors).toHaveProperty("text");
      expect(colors).toHaveProperty("dot");
    }
  });

  it("falls back to draft colors for unknown status", () => {
    const unknown = getStatusColor("nonexistent");
    const draft = getStatusColor("draft");
    expect(unknown).toEqual(draft);
  });
});
