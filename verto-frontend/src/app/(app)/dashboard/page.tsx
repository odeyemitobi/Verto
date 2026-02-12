'use client';

import Link from 'next/link';
import {
  RiAddLine,
  RiArrowRightLine,
  RiShieldCheckLine,
  RiUserAddLine,
  RiSettings3Line,
  RiWallet3Line,
} from 'react-icons/ri';
import StatsGrid from '@/components/dashboard/StatsGrid';
import RecentInvoices from '@/components/dashboard/RecentInvoices';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, truncateAddress } from '@/lib/utils';
import { useEscrowStore } from '@/stores/useEscrowStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useInvoiceStore } from '@/stores/useInvoiceStore';

export default function DashboardPage() {
  const { escrows } = useEscrowStore();
  const { address } = useWalletStore();
  const { invoices } = useInvoiceStore();

  const activeEscrows = escrows
    .filter((e) => e.status !== 'completed')
    .slice(0, 3);

  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;
  const pendingCount = invoices.filter((i) => i.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-6 sm:p-8 dark:border-neutral-800 dark:bg-neutral-900">
        {/* Background decorations */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-amber-500/5 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
              Overview
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Here&apos;s what&apos;s happening with your invoicing and escrow activity.
            </p>

            {/* Quick info pills */}
            <div className="flex flex-wrap items-center gap-2 pt-3">
              {address && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-400">
                  <RiWallet3Line className="h-3 w-3" />
                  {truncateAddress(address, 4)}
                </span>
              )}
              {pendingCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400">
                  {pendingCount} pending
                </span>
              )}
              {overdueCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                  {overdueCount} overdue
                </span>
              )}
            </div>
          </div>

          {/* Quick action */}
          <Link
            href="/invoices/new"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-orange-500 px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/30"
          >
            <RiAddLine className="h-4 w-4" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Stats */}
      <StatsGrid />

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: RiUserAddLine, label: 'Add Client', href: '/clients', color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' },
          { icon: RiShieldCheckLine, label: 'Create Escrow', href: '/escrow', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
          { icon: RiSettings3Line, label: 'Settings', href: '/settings', color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5 transition-all hover:border-gray-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.color}`}>
              <action.icon className="h-4.5 w-4.5" />
            </div>
            <span className="text-sm font-medium text-gray-700 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

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
