import { describe, it, expect, beforeEach } from 'vitest';
import { useInvoiceStore } from './useInvoiceStore';
import { useEscrowStore } from './useEscrowStore';
import { useClientStore } from './useClientStore';
import { useSettingsStore } from './useSettingsStore';
import type { Invoice, Client, Escrow } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeInvoice(id: string): Invoice {
  return {
    id,
    invoiceNumber: `INV-${id}`,
    clientId: 'c1',
    clientName: 'Alice',
    description: 'Test',
    amountUsd: 100,
    amountBtc: 0.002,
    paymentAddress: 'bc1qtest',
    dueDate: '2025-03-01',
    status: 'pending',
    items: [],
    createdAt: new Date().toISOString(),
    notes: '',
    txHash: '',
    paidAt: '',
  };
}

function makeClient(id: string): Client {
  return {
    id,
    name: `Client ${id}`,
    email: `client${id}@test.com`,
    company: 'TestCo',
    address: '123 Test St',
    notes: '',
    createdAt: new Date().toISOString(),
  };
}

function makeEscrow(id: string): Escrow {
  return {
    id,
    escrowId: 1,
    clientAddress: 'ST1...',
    freelancerAddress: 'ST2...',
    amountStx: 100,
    status: 'created',
    createdAt: new Date().toISOString(),
  };
}

// ─── InvoiceStore ────────────────────────────────────────────────────────────

describe('useInvoiceStore', () => {
  beforeEach(() => {
    useInvoiceStore.setState({ invoices: [] });
  });

  it('starts with empty invoices', () => {
    expect(useInvoiceStore.getState().invoices).toEqual([]);
  });

  it('adds invoice to the beginning', () => {
    const { addInvoice } = useInvoiceStore.getState();
    addInvoice(makeInvoice('1'));
    addInvoice(makeInvoice('2'));

    const invoices = useInvoiceStore.getState().invoices;
    expect(invoices).toHaveLength(2);
    expect(invoices[0].id).toBe('2'); // newest first
    expect(invoices[1].id).toBe('1');
  });

  it('updates an existing invoice', () => {
    const { addInvoice, updateInvoice } = useInvoiceStore.getState();
    addInvoice(makeInvoice('1'));
    updateInvoice('1', { status: 'paid', paidAt: '2025-02-01' });

    const invoice = useInvoiceStore.getState().getInvoice('1');
    expect(invoice?.status).toBe('paid');
    expect(invoice?.paidAt).toBe('2025-02-01');
  });

  it('deletes an invoice', () => {
    const { addInvoice, deleteInvoice } = useInvoiceStore.getState();
    addInvoice(makeInvoice('1'));
    addInvoice(makeInvoice('2'));
    deleteInvoice('1');

    expect(useInvoiceStore.getState().invoices).toHaveLength(1);
    expect(useInvoiceStore.getState().getInvoice('1')).toBeUndefined();
  });

  it('getInvoice returns correct invoice', () => {
    const { addInvoice } = useInvoiceStore.getState();
    addInvoice(makeInvoice('target'));

    const found = useInvoiceStore.getState().getInvoice('target');
    expect(found?.id).toBe('target');
  });

  it('getInvoice returns undefined for missing id', () => {
    expect(useInvoiceStore.getState().getInvoice('nonexistent')).toBeUndefined();
  });
});

// ─── EscrowStore ─────────────────────────────────────────────────────────────

describe('useEscrowStore', () => {
  beforeEach(() => {
    useEscrowStore.setState({ escrows: [] });
  });

  it('starts with empty escrows', () => {
    expect(useEscrowStore.getState().escrows).toEqual([]);
  });

  it('adds escrow', () => {
    useEscrowStore.getState().addEscrow(makeEscrow('e1'));
    expect(useEscrowStore.getState().escrows).toHaveLength(1);
  });

  it('updates escrow', () => {
    useEscrowStore.getState().addEscrow(makeEscrow('e1'));
    useEscrowStore.getState().updateEscrow('e1', { status: 'funded' });

    const escrow = useEscrowStore.getState().getEscrow('e1');
    expect(escrow?.status).toBe('funded');
  });

  it('deletes escrow', () => {
    useEscrowStore.getState().addEscrow(makeEscrow('e1'));
    useEscrowStore.getState().deleteEscrow('e1');
    expect(useEscrowStore.getState().escrows).toHaveLength(0);
  });
});

// ─── ClientStore ─────────────────────────────────────────────────────────────

describe('useClientStore', () => {
  beforeEach(() => {
    useClientStore.setState({ clients: [] });
  });

  it('adds client', () => {
    useClientStore.getState().addClient(makeClient('c1'));
    expect(useClientStore.getState().clients).toHaveLength(1);
  });

  it('updates client', () => {
    useClientStore.getState().addClient(makeClient('c1'));
    useClientStore.getState().updateClient('c1', { name: 'Updated' });

    const client = useClientStore.getState().getClient('c1');
    expect(client?.name).toBe('Updated');
  });

  it('deletes client', () => {
    useClientStore.getState().addClient(makeClient('c1'));
    useClientStore.getState().deleteClient('c1');
    expect(useClientStore.getState().clients).toHaveLength(0);
  });

  it('getClient returns undefined for missing id', () => {
    expect(useClientStore.getState().getClient('missing')).toBeUndefined();
  });
});

// ─── SettingsStore ───────────────────────────────────────────────────────────

describe('useSettingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: {
        businessName: '',
        email: '',
        defaultPaymentAddress: '',
        currency: 'USD',
        invoicePrefix: 'INV',
        autoNumbering: true,
      },
    });
  });

  it('has default settings', () => {
    const { settings } = useSettingsStore.getState();
    expect(settings.currency).toBe('USD');
    expect(settings.invoicePrefix).toBe('INV');
    expect(settings.autoNumbering).toBe(true);
  });

  it('updates individual fields without overwriting others', () => {
    useSettingsStore.getState().updateSettings({ businessName: 'Acme Corp' });

    const { settings } = useSettingsStore.getState();
    expect(settings.businessName).toBe('Acme Corp');
    expect(settings.currency).toBe('USD'); // unchanged
    expect(settings.invoicePrefix).toBe('INV'); // unchanged
  });

  it('updates multiple fields at once', () => {
    useSettingsStore.getState().updateSettings({
      businessName: 'Verto Labs',
      email: 'hello@verto.io',
      currency: 'EUR',
    });

    const { settings } = useSettingsStore.getState();
    expect(settings.businessName).toBe('Verto Labs');
    expect(settings.email).toBe('hello@verto.io');
    expect(settings.currency).toBe('EUR');
  });
});
