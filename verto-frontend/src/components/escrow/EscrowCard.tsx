import {
  RiTimeLine,
  RiCheckLine,
  RiAlertLine,
} from 'react-icons/ri';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDate, truncateAddress } from '@/lib/utils';
import type { Escrow } from '@/types';

interface EscrowCardProps {
  escrow: Escrow;
  onAction?: (action: string, escrow: Escrow) => void;
}

export default function EscrowCard({ escrow, onAction }: EscrowCardProps) {
  return (
    <Card hover>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-gray-900 dark:text-white">
              {escrow.projectDescription}
            </h3>
            <Badge status={escrow.status} size="sm" />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span>Client: {truncateAddress(escrow.clientAddress)}</span>
            <span>
              Freelancer: {truncateAddress(escrow.freelancerAddress)}
            </span>
            <span>Created: {formatDate(escrow.createdAt)}</span>
          </div>

          {escrow.reviewDeadline && escrow.status === 'delivered' && (
            <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
              <RiTimeLine className="h-3.5 w-3.5" />
              Review deadline: {formatDate(escrow.reviewDeadline)}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(escrow.amountUsd)}
          </p>

          {/* Action buttons based on status */}
          {onAction && (
            <div className="flex gap-2">
              {escrow.status === 'created' && (
                <Button
                  size="sm"
                  onClick={() => onAction('fund', escrow)}
                >
                  Fund Escrow
                </Button>
              )}
              {escrow.status === 'funded' && (
                <Button
                  size="sm"
                  icon={<RiCheckLine className="h-3.5 w-3.5" />}
                  onClick={() => onAction('deliver', escrow)}
                >
                  Mark Delivered
                </Button>
              )}
              {escrow.status === 'delivered' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onAction('release', escrow)}
                  >
                    Release
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<RiAlertLine className="h-3.5 w-3.5" />}
                    onClick={() => onAction('dispute', escrow)}
                  >
                    Dispute
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
