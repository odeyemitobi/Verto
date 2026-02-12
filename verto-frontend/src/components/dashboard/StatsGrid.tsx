'use client';

import {
  RiMoneyDollarCircleLine,
  RiTimeLine,
  RiFileTextLine,
  RiShieldCheckLine,
  RiArrowUpSLine,
} from 'react-icons/ri';
import { formatCurrency } from '@/lib/utils';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { useEscrowStore } from '@/stores/useEscrowStore';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  accentColor: string;
  iconBg: string;
}

function StatCard({ icon, label, value, subtitle, accentColor, iconBg }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
      {/* Top accent line */}
      <div className={`absolute inset-x-0 top-0 h-0.5 ${accentColor}`} />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <RiArrowUpSLine className="h-3 w-3 text-emerald-500" />
              {subtitle}
            </p>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function StatsGrid() {
  const { invoices } = useInvoiceStore();
  const { escrows } = useEscrowStore();

  const totalRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amountUsd, 0);

  const pendingAmount = invoices
    .filter((i) => i.status === 'pending')
    .reduce((sum, i) => sum + i.amountUsd, 0);

  const activeEscrows = escrows.filter(
    (e) => e.status === 'funded' || e.status === 'delivered',
  ).length;

  const paidCount = invoices.filter((i) => i.status === 'paid').length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<RiMoneyDollarCircleLine className="h-5 w-5 text-emerald-500" />}
        label="Total Revenue"
        value={formatCurrency(totalRevenue)}
        subtitle={paidCount > 0 ? `${paidCount} paid invoice${paidCount !== 1 ? 's' : ''}` : undefined}
        accentColor="bg-emerald-500"
        iconBg="bg-emerald-50 dark:bg-emerald-500/10"
      />
      <StatCard
        icon={<RiTimeLine className="h-5 w-5 text-orange-500" />}
        label="Pending"
        value={formatCurrency(pendingAmount)}
        subtitle={invoices.filter((i) => i.status === 'pending').length > 0 ? `${invoices.filter((i) => i.status === 'pending').length} awaiting payment` : undefined}
        accentColor="bg-orange-500"
        iconBg="bg-orange-50 dark:bg-orange-500/10"
      />
      <StatCard
        icon={<RiFileTextLine className="h-5 w-5 text-blue-500" />}
        label="Total Invoices"
        value={String(invoices.length)}
        subtitle={invoices.length > 0 ? 'All time' : undefined}
        accentColor="bg-blue-500"
        iconBg="bg-blue-50 dark:bg-blue-500/10"
      />
      <StatCard
        icon={<RiShieldCheckLine className="h-5 w-5 text-purple-500" />}
        label="Active Escrows"
        value={String(activeEscrows)}
        subtitle={escrows.length > 0 ? `${escrows.length} total` : undefined}
        accentColor="bg-purple-500"
        iconBg="bg-purple-50 dark:bg-purple-500/10"
      />
    </div>
  );
}
