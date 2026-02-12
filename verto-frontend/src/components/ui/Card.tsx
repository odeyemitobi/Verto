import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export default function Card({
  children,
  className,
  padding = 'md',
  hover = false,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900',
        paddingStyles[padding],
        hover &&
          'transition-shadow duration-200 hover:shadow-md dark:hover:border-neutral-700',
        className,
      )}
    >
      {children}
    </div>
  );
}
