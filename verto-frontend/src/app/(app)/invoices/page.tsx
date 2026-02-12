'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  RiAddLine,
  RiSearchLine,
  RiFileTextLine,
  RiDeleteBinLine,
} from 'react-icons/ri';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/layout/PageHeader';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import type { InvoiceStatus } from '@/types';

const STATUS_FILTERS: { label: string; value: InvoiceStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Draft', value: 'draft' },
];

export default function InvoicesPage() {
  const { invoices, deleteInvoice } = useInvoiceStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>(
    'all',
  );

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        !search ||
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
        inv.description.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Invoices"
        description="Manage and track all your invoices."
        badge={
          invoices.length > 0 ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-neutral-800 dark:text-gray-400">
              {invoices.length}
            </span>
          ) : undefined
        }
        action={
          <Link href="/invoices/new">
            <Button icon={<RiAddLine className="h-4 w-4" />}>
              New Invoice
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder="Search invoices..."
            icon={<RiSearchLine className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<RiFileTextLine className="h-7 w-7" />}
            title={invoices.length === 0 ? 'No invoices yet' : 'No matches'}
            description={
              invoices.length === 0
                ? 'Create your first invoice to start getting paid in Bitcoin.'
                : 'Try adjusting your search or filter criteria.'
            }
            actionLabel={invoices.length === 0 ? 'Create Invoice' : undefined}
            onAction={
              invoices.length === 0
                ? () => (window.location.href = '/invoices/new')
                : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => (
            <Card key={invoice.id} hover padding="none">
              <Link
                href={`/invoices/${invoice.id}`}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                {/* Invoice info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </span>
                    <Badge status={invoice.status} size="sm" />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-gray-600 dark:text-gray-400">
                    {invoice.clientName} — {invoice.description}
                  </p>
                </div>

                {/* Amount & date */}
                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-0">
                  <span className="text-base font-bold text-gray-900 dark:text-white">
                    {formatCurrency(invoice.amountUsd)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Due {formatDate(invoice.dueDate)}
                  </span>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteInvoice(invoice.id);
                  }}
                  aria-label="Delete invoice"
                  className="self-start rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                >
                  <RiDeleteBinLine className="h-4 w-4" />
                </button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
