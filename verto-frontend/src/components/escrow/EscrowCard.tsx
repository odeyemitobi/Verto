import {
  RiTimeLine,
  RiCheckLine,
  RiAlertLine,
  RiCloseCircleLine,
  RiRefreshLine,
  RiExternalLinkLine,
  RiMoneyDollarCircleLine,
} from "react-icons/ri";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDate, truncateAddress } from "@/lib/utils";
import { getExplorerTxUrl } from "@/lib/stacks";
import type { Escrow } from "@/types";

interface EscrowCardProps {
  escrow: Escrow;
  walletAddress?: string;
  onAction?: (action: string, escrow: Escrow) => void;
  loadingAction?: string | null;
}

export default function EscrowCard({
  escrow,
  walletAddress,
  onAction,
  loadingAction,
}: EscrowCardProps) {
  const isLoading = (action: string) =>
    loadingAction === `${action}-${escrow.id}`;

  // Determine the user's role in this escrow
  const isClient =
    walletAddress?.toLowerCase() === escrow.clientAddress?.toLowerCase();
  const isFreelancer =
    walletAddress?.toLowerCase() === escrow.freelancerAddress?.toLowerCase();

  return (
    <Card hover>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-gray-900 dark:text-white">
              {escrow.projectDescription}
            </h3>
            <Badge status={escrow.status} size="sm" />
            {walletAddress && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  isClient
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                    : "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                }`}
              >
                {isClient ? "Client" : isFreelancer ? "Freelancer" : "Observer"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span>Client: {truncateAddress(escrow.clientAddress)}</span>
            <span>Freelancer: {truncateAddress(escrow.freelancerAddress)}</span>
            <span>Created: {formatDate(escrow.createdAt)}</span>
          </div>

          {escrow.reviewDeadline && escrow.status === "delivered" && (
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

          {/* Role-based action buttons */}
          {onAction && (
            <div className="flex flex-wrap gap-2">
              {/* CREATED status: Client can Fund or Cancel */}
              {escrow.status === "created" && isClient && (
                <>
                  <Button
                    size="sm"
                    icon={<RiMoneyDollarCircleLine className="h-3.5 w-3.5" />}
                    onClick={() => onAction("fund", escrow)}
                    isLoading={isLoading("fund")}
                  >
                    Fund Escrow
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<RiCloseCircleLine className="h-3.5 w-3.5" />}
                    onClick={() => onAction("cancel", escrow)}
                    isLoading={isLoading("cancel")}
                  >
                    Cancel
                  </Button>
                </>
              )}

              {/* CREATED status: Freelancer just waits */}
              {escrow.status === "created" && isFreelancer && (
                <span className="text-xs text-gray-400 italic py-1">
                  Waiting for client to fund...
                </span>
              )}

              {/* FUNDED status: Freelancer can Mark Delivered */}
              {escrow.status === "funded" && isFreelancer && (
                <Button
                  size="sm"
                  icon={<RiCheckLine className="h-3.5 w-3.5" />}
                  onClick={() => onAction("deliver", escrow)}
                  isLoading={isLoading("deliver")}
                >
                  Mark Delivered
                </Button>
              )}

              {/* FUNDED status: Client waits, but can dispute */}
              {escrow.status === "funded" && isClient && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={<RiAlertLine className="h-3.5 w-3.5" />}
                  onClick={() => onAction("dispute", escrow)}
                  isLoading={isLoading("dispute")}
                >
                  Dispute
                </Button>
              )}

              {/* DELIVERED status: Client can Release, Revision, or Dispute */}
              {escrow.status === "delivered" && isClient && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onAction("release", escrow)}
                    isLoading={isLoading("release")}
                  >
                    Release Payment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<RiRefreshLine className="h-3.5 w-3.5" />}
                    onClick={() => onAction("revision", escrow)}
                    isLoading={isLoading("revision")}
                  >
                    Revision
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<RiAlertLine className="h-3.5 w-3.5" />}
                    onClick={() => onAction("dispute", escrow)}
                    isLoading={isLoading("dispute")}
                  >
                    Dispute
                  </Button>
                </>
              )}

              {/* DELIVERED status: Freelancer can dispute */}
              {escrow.status === "delivered" && isFreelancer && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={<RiAlertLine className="h-3.5 w-3.5" />}
                  onClick={() => onAction("dispute", escrow)}
                  isLoading={isLoading("dispute")}
                >
                  Dispute
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
