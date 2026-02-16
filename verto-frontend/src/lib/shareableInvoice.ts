/**
 * Shareable Invoice Encoding/Decoding
 *
 * Encodes minimal invoice data into a URL-safe base64 string so payment links
 * can be shared across browsers without needing a backend or Gaia storage.
 *
 * Format: JSON → UTF-8 → base64url
 */

import type { Invoice, InvoiceItem } from "@/types";

// ─── Minimal payload (only what the payer needs) ─────────────────────────────

interface ShareableInvoice {
  /** Invoice number */
  n: string;
  /** Description */
  d: string;
  /** Amount USD (cents to avoid floats) */
  u: number;
  /** Amount BTC (satoshis) */
  b: number;
  /** Payment address */
  a: string;
  /** Due date ISO string */
  dd: string;
  /** Status */
  s: string;
  /** Line items: [description, quantity, rate, amount][] */
  i: [string, number, number, number][];
}

// ─── Encode ──────────────────────────────────────────────────────────────────

export function encodeInvoiceForShare(invoice: Invoice): string {
  const payload: ShareableInvoice = {
    n: invoice.invoiceNumber,
    d: invoice.description,
    u: Math.round(invoice.amountUsd * 100),
    b: Math.round(invoice.amountBtc * 1e8),
    a: invoice.paymentAddress,
    dd: invoice.dueDate,
    s: invoice.status,
    i: invoice.items.map((item) => [
      item.description,
      item.quantity,
      item.rate,
      item.amount,
    ]),
  };

  const json = JSON.stringify(payload);
  // btoa works on latin1 — encode UTF-8 first
  const encoded = btoa(
    encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    ),
  );
  // Make URL-safe: + → -, / → _, strip trailing =
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ─── Decode ──────────────────────────────────────────────────────────────────

export interface DecodedInvoice {
  invoiceNumber: string;
  description: string;
  amountUsd: number;
  amountBtc: number;
  paymentAddress: string;
  dueDate: string;
  status: string;
  items: InvoiceItem[];
}

export function decodeInvoiceFromShare(encoded: string): DecodedInvoice | null {
  try {
    // Restore base64 padding and standard chars
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";

    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const p: ShareableInvoice = JSON.parse(json);

    return {
      invoiceNumber: p.n,
      description: p.d,
      amountUsd: p.u / 100,
      amountBtc: p.b / 1e8,
      paymentAddress: p.a,
      dueDate: p.dd,
      status: p.s,
      items: p.i.map(([desc, qty, rate, amt], idx) => ({
        id: `shared-${idx}`,
        description: desc,
        quantity: qty,
        rate,
        amount: amt,
      })),
    };
  } catch {
    return null;
  }
}
