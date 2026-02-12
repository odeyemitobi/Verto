'use client';

import Link from 'next/link';
import { RiArrowRightLine, RiFileTextLine } from 'react-icons/ri';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useInvoiceStore } from '@/stores/useInvoiceStore';

export default function RecentInvoices() {
  const { invoices } = useInvoiceStore();
  const recent = invoices.slice(0, 5);

  return (
    <Card padding="none">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-neutral-800">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Recent Invoices
        </h3>
        <Link
          href="/invoices"
          className="flex items-center gap-1 text-sm font-medium text-orange-500 transition-colors hover:text-orange-600"
        >
          View all
          <RiArrowRightLine className="h-4 w-4" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          icon={<RiFileTextLine className="h-7 w-7" />}
          title="No invoices yet"
          description="Create your first invoice to start tracking payments."
        />
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-neutral-800">
          {recent.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/invoices/${invoice.id}`}
              className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/50"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {invoice.invoiceNumber} — {invoice.clientName}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  Due {formatDate(invoice.dueDate)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge status={invoice.status} size="sm" />
                <span className="text-sm font-semibold text-gray-900 whitespace-nowrap dark:text-white">
                  {formatCurrency(invoice.amountUsd)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
