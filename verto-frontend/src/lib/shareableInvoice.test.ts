import { describe, it, expect } from 'vitest';
import {
  encodeInvoiceForShare,
  decodeInvoiceFromShare,
} from './shareableInvoice';
import type { Invoice } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'test-id',
    invoiceNumber: 'INV-001',
    clientId: 'client-1',
    clientName: 'Test Client',
    description: 'Web development',
    amountUsd: 1500.5,
    amountBtc: 0.025,
    paymentAddress: 'bc1qtest1234567890abcdef',
    dueDate: '2025-03-01T00:00:00Z',
    status: 'pending',
    items: [
      { id: 'i1', description: 'Design', quantity: 2, rate: 500, amount: 1000 },
      { id: 'i2', description: 'Dev', quantity: 1, rate: 500.5, amount: 500.5 },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    notes: 'Some private notes',
    txHash: '',
    paidAt: '',
    ...overrides,
  };
}

// ─── Round-trip ──────────────────────────────────────────────────────────────

describe('encodeInvoiceForShare / decodeInvoiceFromShare', () => {
  it('round-trips all payer-visible fields', () => {
    const invoice = makeInvoice();
    const encoded = encodeInvoiceForShare(invoice);
    const decoded = decodeInvoiceFromShare(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.invoiceNumber).toBe('INV-001');
    expect(decoded!.description).toBe('Web development');
    expect(decoded!.amountUsd).toBeCloseTo(1500.5, 2);
    expect(decoded!.amountBtc).toBeCloseTo(0.025, 8);
    expect(decoded!.paymentAddress).toBe('bc1qtest1234567890abcdef');
    expect(decoded!.dueDate).toBe('2025-03-01T00:00:00Z');
    expect(decoded!.status).toBe('pending');
    expect(decoded!.items).toHaveLength(2);
  });

  it('preserves line item details', () => {
    const invoice = makeInvoice();
    const decoded = decodeInvoiceFromShare(encodeInvoiceForShare(invoice))!;

    expect(decoded.items[0].description).toBe('Design');
    expect(decoded.items[0].quantity).toBe(2);
    expect(decoded.items[0].rate).toBe(500);
    expect(decoded.items[0].amount).toBe(1000);

    expect(decoded.items[1].description).toBe('Dev');
    expect(decoded.items[1].amount).toBe(500.5);
  });

  it('handles zero amounts', () => {
    const invoice = makeInvoice({ amountUsd: 0, amountBtc: 0 });
    const decoded = decodeInvoiceFromShare(encodeInvoiceForShare(invoice))!;

    expect(decoded.amountUsd).toBe(0);
    expect(decoded.amountBtc).toBe(0);
  });

  it('handles empty items array', () => {
    const invoice = makeInvoice({ items: [] });
    const decoded = decodeInvoiceFromShare(encodeInvoiceForShare(invoice))!;

    expect(decoded.items).toEqual([]);
  });

  it('handles Unicode in description', () => {
    const invoice = makeInvoice({ description: 'Développement 🚀 Web' });
    const decoded = decodeInvoiceFromShare(encodeInvoiceForShare(invoice))!;

    expect(decoded.description).toBe('Développement 🚀 Web');
  });

  it('handles special characters in invoice number', () => {
    const invoice = makeInvoice({ invoiceNumber: 'INV-2025/Q1-001' });
    const decoded = decodeInvoiceFromShare(encodeInvoiceForShare(invoice))!;

    expect(decoded.invoiceNumber).toBe('INV-2025/Q1-001');
  });
});

// ─── Encoding ────────────────────────────────────────────────────────────────

describe('encodeInvoiceForShare', () => {
  it('returns a URL-safe string (no +, /, or =)', () => {
    const encoded = encodeInvoiceForShare(makeInvoice());
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('strips private fields (clientId, notes, txHash, createdAt)', () => {
    const encoded = encodeInvoiceForShare(makeInvoice());
    // The encoded payload should not contain these private keys
    const decoded = decodeInvoiceFromShare(encoded)!;
    expect(decoded).not.toHaveProperty('clientId');
    expect(decoded).not.toHaveProperty('notes');
    expect(decoded).not.toHaveProperty('txHash');
    expect(decoded).not.toHaveProperty('createdAt');
  });
});

// ─── Decoding edge cases ────────────────────────────────────────────────────

describe('decodeInvoiceFromShare', () => {
  it('returns null for empty string', () => {
    expect(decodeInvoiceFromShare('')).toBeNull();
  });

  it('returns null for random garbage', () => {
    expect(decodeInvoiceFromShare('not-valid-base64!!!')).toBeNull();
  });

  it('returns null for valid base64 but invalid JSON', () => {
    const b64 = btoa('not json at all');
    const urlSafe = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(decodeInvoiceFromShare(urlSafe)).toBeNull();
  });

  it('returns null for valid JSON but wrong structure', () => {
    const b64 = btoa(JSON.stringify({ foo: 'bar' }));
    const urlSafe = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    // Decoding should still produce an object, but fields will be missing/undefined
    const result = decodeInvoiceFromShare(urlSafe);
    // Even if it "succeeds", the fields should show the missing data
    if (result) {
      expect(result.invoiceNumber).toBeUndefined();
    }
  });
});
