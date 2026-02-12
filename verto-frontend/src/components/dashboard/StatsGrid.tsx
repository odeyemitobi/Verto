'use client';

import {
  RiMoneyDollarCircleLine,
  RiTimeLine,
  RiFileTextLine,
  RiShieldCheckLine,
} from 'react-icons/ri';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { useEscrowStore } from '@/stores/useEscrowStore';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-500/10">
          {icon}
        </div>
      </div>
    </Card>
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<RiMoneyDollarCircleLine className="h-5 w-5" />}
        label="Total Revenue"
        value={formatCurrency(totalRevenue)}
      />
      <StatCard
        icon={<RiTimeLine className="h-5 w-5" />}
        label="Pending"
        value={formatCurrency(pendingAmount)}
      />
      <StatCard
        icon={<RiFileTextLine className="h-5 w-5" />}
        label="Total Invoices"
        value={String(invoices.length)}
      />
      <StatCard
        icon={<RiShieldCheckLine className="h-5 w-5" />}
        label="Active Escrows"
        value={String(activeEscrows)}
      />
    </div>
  );
}
