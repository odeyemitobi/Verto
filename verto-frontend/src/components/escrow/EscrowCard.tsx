import {
  RiTimeLine,
  RiCheckLine,
  RiAlertLine,
  RiCloseCircleLine,
  RiRefreshLine,
  RiExternalLinkLine,
} from 'react-icons/ri';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDate, truncateAddress } from '@/lib/utils';
import { getExplorerTxUrl } from '@/lib/stacks';
import type { Escrow } from '@/types';

interface EscrowCardProps {
  escrow: Escrow;
  onAction?: (action: string, escrow: Escrow) => void;
  loadingAction?: string | null;
}

export default function EscrowCard({ escrow, onAction, loadingAction }: EscrowCardProps) {
  const isLoading = (action: string) => loadingAction === `${action}-${escrow.id}`;

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

          {escrow.txId && (
            <a
              href={getExplorerTxUrl(escrow.txId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
            >
              <RiExternalLinkLine className="h-3 w-3" />
              View latest transaction
            </a>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(escrow.amountUsd)}
          </p>
          {escrow.amountStx && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(escrow.amountStx / 1_000_000).toFixed(2)} STX
            </p>
          )}

          {/* Action buttons based on status */}
          {onAction && (
            <div className="flex flex-wrap gap-2">
              {escrow.status === 'created' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onAction('fund', escrow)}
                    isLoading={isLoading('fund')}
                  >
                    Fund Escrow
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<RiCloseCircleLine className="h-3.5 w-3.5" />}
                    onClick={() => onAction('cancel', escrow)}
                    isLoading={isLoading('cancel')}
                  >
                    Cancel
                  </Button>
                </>
              )}
              {escrow.status === 'funded' && (
                <>
                  <Button
                    size="sm"
                    icon={<RiCheckLine className="h-3.5 w-3.5" />}
                    onClick={() => onAction('deliver', escrow)}
                    isLoading={isLoading('deliver')}
                  >
                    Mark Delivered
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<RiAlertLine className="h-3.5 w-3.5" />}
                    onClick={() => onAction('dispute', escrow)}
                    isLoading={isLoading('dispute')}
                  >
                    Dispute
                  </Button>
                </>
              )}
              {escrow.status === 'delivered' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onAction('release', escrow)}
                    isLoading={isLoading('release')}
                  >
                    Release
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<RiRefreshLine className="h-3.5 w-3.5" />}
                    onClick={() => onAction('revision', escrow)}
                    isLoading={isLoading('revision')}
                  >
                    Revision
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<RiAlertLine className="h-3.5 w-3.5" />}
                    onClick={() => onAction('dispute', escrow)}
                    isLoading={isLoading('dispute')}
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
