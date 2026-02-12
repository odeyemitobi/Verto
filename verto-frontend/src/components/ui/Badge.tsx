import { cn, getStatusColor } from '@/lib/utils';

interface BadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export default function Badge({ status, label, size = 'md' }: BadgeProps) {
  const colors = getStatusColor(status);
  const displayLabel =
    label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        colors.bg,
        colors.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
      {displayLabel}
    </span>
  );
}
