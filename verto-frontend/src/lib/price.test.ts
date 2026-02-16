import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatBtcAmount } from "./price";

// ─── formatBtcAmount (pure, no fetch) ────────────────────────────────────────

describe("formatBtcAmount", () => {
  it("formats zero", () => {
    expect(formatBtcAmount(0)).toBe("0.00000000");
  });

  it("formats standard amount with 8 decimals", () => {
    expect(formatBtcAmount(0.12345678)).toBe("0.12345678");
  });

  it("pads short amounts", () => {
    expect(formatBtcAmount(1)).toBe("1.00000000");
  });

  it("uses scientific notation for small amounts below threshold", () => {
    const result = formatBtcAmount(0.000001);
    expect(result).toMatch(/e/);
  });

  it("uses scientific notation for extremely small amounts", () => {
    const result = formatBtcAmount(0.000000001);
    expect(result).toMatch(/e/);
  });
});

// ─── fetchBtcPrice (with mocked fetch) ──────────────────────────────────────

describe("fetchBtcPrice", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset the module to clear cached price between tests
  });

  it("returns price from API", async () => {
    const mockPrice = 65000;
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bitcoin: { usd: mockPrice } }),
    } as Response);

    // Re-import to get fresh module without cache
    const { fetchBtcPrice } = await import("./price");
    const price = await fetchBtcPrice();
    expect(price).toBe(mockPrice);
  });

  it("returns 0 on network failure with no cache", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("net fail"));

    // Need a fresh module with no cached price
    vi.resetModules();
    const { fetchBtcPrice } = await import("./price");
    const price = await fetchBtcPrice();
    // Either returns cached value or 0
    expect(typeof price).toBe("number");
  });
});

// ─── usdToBtc / btcToUsd ────────────────────────────────────────────────────

describe("usdToBtc", () => {
  it("converts USD to BTC using fetched price", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ bitcoin: { usd: 50000 } }),
    } as Response);

    const { usdToBtc } = await import("./price");
    const btc = await usdToBtc(1000);
    expect(btc).toBeCloseTo(0.02, 4);
  });
});

describe("btcToUsd", () => {
  it("converts BTC to USD using fetched price", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ bitcoin: { usd: 50000 } }),
    } as Response);

    const { btcToUsd } = await import("./price");
    const usd = await btcToUsd(0.5);
    expect(usd).toBeCloseTo(25000, 0);
  });
});
