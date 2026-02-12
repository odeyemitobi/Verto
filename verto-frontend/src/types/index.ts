// ─── Invoice Types ───────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  description: string;
  items: InvoiceItem[];
  amountBtc: number;
  amountUsd: number;
  paymentAddress: string;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  txHash?: string;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

// ─── Client Types ────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

// ─── Escrow Types ────────────────────────────────────────────────────────────

export interface Escrow {
  id: string;
  escrowId: number;
  clientAddress: string;
  freelancerAddress: string;
  amount: number;
  amountUsd: number;
  status: EscrowStatus;
  projectDescription: string;
  createdAt: string;
  fundedAt?: string;
  deliveredAt?: string;
  reviewDeadline?: string;
  completedAt?: string;
  invoiceId?: string;
  txId?: string;
  amountStx?: number;
}

export type EscrowStatus = 'created' | 'funded' | 'delivered' | 'completed' | 'disputed' | 'cancelled';

// ─── Settings Types ──────────────────────────────────────────────────────────

export interface UserSettings {
  businessName: string;
  email: string;
  logo?: string;
  defaultPaymentAddress: string;
  currency: 'USD' | 'EUR' | 'GBP';
  invoicePrefix: string;
  autoNumbering: boolean;
}

// ─── Navigation Types ────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
}
