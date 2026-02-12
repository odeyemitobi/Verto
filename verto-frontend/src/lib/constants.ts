export const APP_NAME = 'Verto';
export const APP_TAGLINE = 'Invoicing for sovereign workers';
export const APP_DESCRIPTION =
  'Self-custody invoicing platform with trustless escrow contracts. Get paid in Bitcoin without fees or surveillance.';

export const INVOICE_STATUSES = {
  draft: { label: 'Draft', color: 'gray' },
  pending: { label: 'Pending', color: 'yellow' },
  paid: { label: 'Paid', color: 'emerald' },
  overdue: { label: 'Overdue', color: 'red' },
  cancelled: { label: 'Cancelled', color: 'gray' },
} as const;

export const ESCROW_STATUSES = {
  created: { label: 'Created', color: 'blue' },
  funded: { label: 'Funded', color: 'purple' },
  delivered: { label: 'Delivered', color: 'orange' },
  completed: { label: 'Completed', color: 'emerald' },
  disputed: { label: 'Disputed', color: 'red' },
  cancelled: { label: 'Cancelled', color: 'gray' },
} as const;

export const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
] as const;

export const STACKS_NETWORK = 'testnet';
export const MEMPOOL_API = 'https://mempool.space/api';
