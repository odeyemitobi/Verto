'use client';

import Link from 'next/link';
import { RiAddLine, RiArrowRightLine, RiShieldCheckLine } from 'react-icons/ri';
import StatsGrid from '@/components/dashboard/StatsGrid';
import RecentInvoices from '@/components/dashboard/RecentInvoices';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useEscrowStore } from '@/stores/useEscrowStore';

export default function DashboardPage() {
  const { escrows } = useEscrowStore();
  const activeEscrows = escrows
    .filter((e) => e.status !== 'completed')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Overview of your invoicing and escrow activity.
          </p>
        </div>
        <Link href="/invoices/new">
          <Button icon={<RiAddLine className="h-4 w-4" />}>
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <StatsGrid />

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent invoices — wider */}
        <div className="lg:col-span-3">
          <RecentInvoices />
        </div>

        {/* Active escrows — narrower */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-neutral-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Active Escrows
              </h3>
              <Link
                href="/escrow"
                className="flex items-center gap-1 text-sm font-medium text-orange-500 transition-colors hover:text-orange-600"
              >
                View all
                <RiArrowRightLine className="h-4 w-4" />
              </Link>
            </div>

            {activeEscrows.length === 0 ? (
              <EmptyState
                icon={<RiShieldCheckLine className="h-7 w-7" />}
                title="No active escrows"
                description="Create an escrow to protect your payments."
              />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                {activeEscrows.map((escrow) => (
                  <div
                    key={escrow.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {escrow.projectDescription}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(escrow.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={escrow.status} size="sm" />
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap dark:text-white">
                        {formatCurrency(escrow.amountUsd)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
