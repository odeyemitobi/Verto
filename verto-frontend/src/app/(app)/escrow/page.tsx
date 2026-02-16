"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { RiAddLine, RiShieldCheckLine, RiRefreshLine } from "react-icons/ri";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/layout/PageHeader";
import EscrowCard from "@/components/escrow/EscrowCard";
import CreateEscrowForm from "@/components/escrow/CreateEscrowForm";
import { useEscrowStore } from "@/stores/useEscrowStore";
import { useWalletStore } from "@/stores/useWalletStore";
import {
  contractFundEscrow,
  contractMarkDelivered,
  contractReleasePayment,
  contractInitiateDispute,
  contractCancelEscrow,
  contractRequestRevision,
  getExplorerTxUrl,
  fetchOnChainEscrows,
} from "@/lib/stacks";
import type { Escrow, EscrowStatus } from "@/types";

const STATUS_TABS: { label: string; value: EscrowStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Created", value: "created" },
  { label: "Funded", value: "funded" },
  { label: "Delivered", value: "delivered" },
  { label: "Completed", value: "completed" },
  { label: "Disputed", value: "disputed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function EscrowPage() {
  const { escrows, updateEscrow, addEscrow } = useEscrowStore();
  const { isConnected, address } = useWalletStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<EscrowStatus | "all">("all");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync escrows from the blockchain
  const syncFromChain = useCallback(async () => {
    if (!isConnected || !address) return;
    setIsSyncing(true);
    try {
      console.log("[Escrow Sync] Starting sync for address:", address);
      const onChain = await fetchOnChainEscrows(address);
      console.log(
        "[Escrow Sync] Found on-chain escrows:",
        onChain.length,
        onChain,
      );
      // Merge: add any on-chain escrows not already in local store
      let added = 0;
      let updated = 0;
      for (const esc of onChain) {
        const existing = escrows.find((e) => e.escrowId === esc.escrowId);
        if (!existing) {
          addEscrow(esc);
          added++;
        } else {
          // Update local status + addresses from chain (source of truth)
          updateEscrow(existing.id, {
            status: esc.status,
            clientAddress: esc.clientAddress,
            freelancerAddress: esc.freelancerAddress,
          });
          updated++;
        }
      }
      if (added > 0 || updated > 0) {
        toast.success(`Synced from blockchain`, {
          description: `${added} new, ${updated} updated`,
        });
      } else if (onChain.length === 0) {
        toast.info("No escrows found on-chain for your address");
      }
    } catch (err) {
      console.error("[Escrow Sync] Error:", err);
      toast.error("Sync failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, address, escrows, addEscrow, updateEscrow]);

  // Auto-sync on mount when connected
  useEffect(() => {
    if (isConnected && address) {
      syncFromChain();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  const filtered = escrows.filter(
    (e) => statusFilter === "all" || e.status === statusFilter,
  );

  const handleAction = async (action: string, escrow: Escrow) => {
    setLoadingAction(`${action}-${escrow.id}`);
    try {
      let txId: string | null = null;

      switch (action) {
        case "fund":
          txId = await contractFundEscrow(escrow.escrowId);
          if (txId) {
            updateEscrow(escrow.id, {
              status: "funded",
              fundedAt: new Date().toISOString(),
              txId,
            });
            toast.success("Escrow funded!", {
              description: "Transaction submitted to the blockchain.",
              action: {
                label: "View TX",
                onClick: () => window.open(getExplorerTxUrl(txId!), "_blank"),
              },
            });
          }
          break;

        case "deliver":
          txId = await contractMarkDelivered(escrow.escrowId);
          if (txId) {
            updateEscrow(escrow.id, {
              status: "delivered",
              deliveredAt: new Date().toISOString(),
              reviewDeadline: new Date(
                Date.now() + 48 * 60 * 60 * 1000,
              ).toISOString(),
              txId,
            });
            toast.success("Work marked as delivered!", {
              description: "Client has 48 hours to review and release payment.",
            });
          }
          break;

        case "release":
          txId = await contractReleasePayment(escrow.escrowId);
          if (txId) {
            updateEscrow(escrow.id, {
              status: "completed",
              completedAt: new Date().toISOString(),
              txId,
            });
            toast.success("Payment released!", {
              description: "Funds have been sent to the freelancer.",
            });
          }
          break;

        case "revision":
          txId = await contractRequestRevision(escrow.escrowId);
          if (txId) {
            updateEscrow(escrow.id, {
              status: "funded",
              deliveredAt: undefined,
              reviewDeadline: undefined,
              txId,
            });
            toast.info("Revision requested", {
              description: "Escrow reverted to funded status for redelivery.",
            });
          }
          break;

        case "dispute":
          txId = await contractInitiateDispute(escrow.escrowId);
          if (txId) {
            updateEscrow(escrow.id, { status: "disputed", txId });
            toast.warning("Dispute initiated", {
              description: "Funds are frozen pending resolution.",
            });
          }
          break;

        case "cancel":
          txId = await contractCancelEscrow(escrow.escrowId);
          if (txId) {
            updateEscrow(escrow.id, { status: "cancelled", txId });
            toast.info("Escrow cancelled");
          }
          break;
      }

      if (!txId && action !== "cancel") {
        toast.info("Transaction cancelled by user.");
      }
    } catch (error) {
      toast.error("Transaction failed", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred.",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Escrow"
        description="Manage trustless escrow contracts for your projects."
        badge={
          escrows.length > 0 ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-neutral-800 dark:text-gray-400">
              {escrows.length}
            </span>
          ) : undefined
        }
        action={
          <div className="flex gap-2">
            {isConnected && (
              <Button
                variant="outline"
                icon={
                  <RiRefreshLine
                    className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
                  />
                }
                onClick={syncFromChain}
                disabled={isSyncing}
              >
                {isSyncing ? "Syncing..." : "Sync"}
              </Button>
            )}
            <Button
              icon={<RiAddLine className="h-4 w-4" />}
              onClick={() => setIsModalOpen(true)}
              disabled={!isConnected}
            >
              New Escrow
            </Button>
          </div>
        }
      />

      {/* Wallet warning */}
      {!isConnected && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/10">
          <p className="text-sm text-orange-700 dark:text-orange-400">
            Connect your wallet to create and manage escrow contracts.
          </p>
        </Card>
      )}

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Escrow list */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<RiShieldCheckLine className="h-7 w-7" />}
            title={
              escrows.length === 0 ? "No escrows yet" : "No matching escrows"
            }
            description={
              escrows.length === 0
                ? "Create your first escrow contract to protect your payments with smart contracts."
                : "Try adjusting your filter."
            }
            actionLabel={
              escrows.length === 0 && isConnected ? "Create Escrow" : undefined
            }
            onAction={
              escrows.length === 0 && isConnected
                ? () => setIsModalOpen(true)
                : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((escrow) => (
            <EscrowCard
              key={escrow.id}
              escrow={escrow}
              walletAddress={address || undefined}
              onAction={handleAction}
              loadingAction={loadingAction}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Escrow Contract"
      >
        <CreateEscrowForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
