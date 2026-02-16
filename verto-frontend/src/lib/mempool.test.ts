import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  satsToBtc,
  btcToSats,
  getMempoolTxUrl,
  checkPaymentReceived,
  getAddressBalance,
} from "./mempool";

// ─── Pure functions ──────────────────────────────────────────────────────────

describe("satsToBtc", () => {
  it("converts 100M sats to 1 BTC", () => {
    expect(satsToBtc(100_000_000)).toBe(1);
  });

  it("converts 1 sat", () => {
    expect(satsToBtc(1)).toBe(0.00000001);
  });

  it("converts 0 sats", () => {
    expect(satsToBtc(0)).toBe(0);
  });
});

describe("btcToSats", () => {
  it("converts 1 BTC to 100M sats", () => {
    expect(btcToSats(1)).toBe(100_000_000);
  });

  it("rounds correctly", () => {
    expect(btcToSats(0.00000001)).toBe(1);
  });

  it("handles fractional sats by rounding", () => {
    // 0.000000015 BTC * 1e8 = 1.4999... due to float precision → rounds to 1
    expect(btcToSats(0.000000015)).toBe(1);
  });
});

describe("getMempoolTxUrl", () => {
  it("constructs correct URL", () => {
    const hash = "abc123def456";
    expect(getMempoolTxUrl(hash)).toBe(`https://mempool.space/tx/${hash}`);
  });
});

// ─── Functions with fetch (mocked) ──────────────────────────────────────────

describe("checkPaymentReceived", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("finds matching payment within tolerance", async () => {
    const mockTxs = [
      {
        txid: "tx123",
        status: { confirmed: true },
        vout: [
          { scriptpubkey_address: "bc1qaddr", value: 100_000 },
          { scriptpubkey_address: "other", value: 50_000 },
        ],
      },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockTxs,
    } as Response);

    const result = await checkPaymentReceived("bc1qaddr", 100_000);
    expect(result).not.toBeNull();
    expect(result!.txHash).toBe("tx123");
    expect(result!.amountSats).toBe(100_000);
    expect(result!.confirmed).toBe(true);
  });

  it("accepts payment within tolerance", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          txid: "tx456",
          status: { confirmed: false },
          vout: [{ scriptpubkey_address: "bc1qaddr", value: 99_500 }],
        },
      ],
    } as Response);

    // 99500 is within 1% of 100000
    const result = await checkPaymentReceived("bc1qaddr", 100_000);
    expect(result).not.toBeNull();
  });

  it("returns null when no matching payment", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          txid: "tx789",
          status: { confirmed: true },
          vout: [{ scriptpubkey_address: "bc1qaddr", value: 50_000 }],
        },
      ],
    } as Response);

    const result = await checkPaymentReceived("bc1qaddr", 100_000);
    expect(result).toBeNull();
  });

  it("returns null on API failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("fail"));
    const result = await checkPaymentReceived("bc1qaddr", 100_000);
    expect(result).toBeNull();
  });
});

describe("getAddressBalance", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("computes confirmed + unconfirmed balance", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        address: "bc1q...",
        chain_stats: {
          funded_txo_sum: 200_000,
          spent_txo_sum: 50_000,
          funded_txo_count: 2,
          spent_txo_count: 1,
          tx_count: 3,
        },
        mempool_stats: {
          funded_txo_sum: 10_000,
          spent_txo_sum: 0,
          funded_txo_count: 1,
          spent_txo_count: 0,
          tx_count: 1,
        },
      }),
    } as Response);

    const balance = await getAddressBalance("bc1q...");
    expect(balance).not.toBeNull();
    expect(balance!.confirmed).toBe(150_000);
    expect(balance!.unconfirmed).toBe(10_000);
    expect(balance!.total).toBe(160_000);
  });

  it("returns null on API failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
    } as Response);

    const balance = await getAddressBalance("bc1q...");
    expect(balance).toBeNull();
  });
});
