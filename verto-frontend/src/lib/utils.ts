export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatBtc(amount: number): string {
  return `${amount.toFixed(8)} BTC`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateInvoiceNumber(prefix = 'INV', count: number): string {
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

export function getStatusColor(status: string): {
  bg: string;
  text: string;
  dot: string;
} {
  const colors: Record<string, { bg: string; text: string; dot: string }> = {
    draft: {
      bg: 'bg-gray-100 dark:bg-neutral-800',
      text: 'text-gray-600 dark:text-gray-400',
      dot: 'bg-gray-400',
    },
    pending: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-700 dark:text-yellow-400',
      dot: 'bg-yellow-400',
    },
    paid: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-400',
    },
    overdue: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      dot: 'bg-red-400',
    },
    cancelled: {
      bg: 'bg-gray-100 dark:bg-neutral-800',
      text: 'text-gray-500 dark:text-gray-500',
      dot: 'bg-gray-300',
    },
    created: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-400',
      dot: 'bg-blue-400',
    },
    funded: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-700 dark:text-purple-400',
      dot: 'bg-purple-400',
    },
    delivered: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      text: 'text-orange-700 dark:text-orange-400',
      dot: 'bg-orange-400',
    },
    completed: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-400',
    },
    disputed: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      dot: 'bg-red-400',
    },
  };

  return colors[status] || colors.draft;
}
