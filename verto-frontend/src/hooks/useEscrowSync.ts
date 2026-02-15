"use client";

import { useEffect, useCallback, useRef } from "react";
import { useEscrowStore } from "@/stores/useEscrowStore";
import { useWalletStore } from "@/stores/useWalletStore";
import { readEscrow } from "@/lib/stacks";
import type { EscrowStatus } from "@/types";

const SYNC_INTERVAL_MS = 120_000; // 2 minutes

/**
 * Maps on-chain escrow statuses (from the Clarity contract)
 * to our frontend status types.
 */
function mapOnChainStatus(chainStatus: string): EscrowStatus | null {
  const statusMap: Record<string, EscrowStatus> = {
    created: "created",
    funded: "funded",
    delivered: "delivered",
    completed: "completed",
    disputed: "disputed",
    cancelled: "cancelled",
    "revision-requested": "funded", // revision resets to funded
  };
  return statusMap[chainStatus] || null;
}

/**
 * Periodically syncs local escrow state with on-chain contract state.
 * Runs every 2 minutes for escrows that have an `escrowId`.
 */
export function useEscrowSync() {
  const { escrows, updateEscrow } = useEscrowStore();
  const { isConnected } = useWalletStore();
  const syncingRef = useRef(false);

  const syncEscrows = useCallback(async () => {
    if (!isConnected || syncingRef.current) return;

    const activeEscrows = escrows.filter(
      (e) =>
        e.escrowId !== undefined &&
        e.status !== "completed" &&
        e.status !== "cancelled",
    );

    if (activeEscrows.length === 0) return;

    syncingRef.current = true;
    try {
      for (const escrow of activeEscrows) {
        try {
          const onChain = await readEscrow(escrow.escrowId);
          if (!onChain) continue;

          // Extract status from on-chain data
          const chainStatus =
            typeof onChain === "object" &&
            onChain !== null &&
            "status" in onChain
              ? String((onChain as Record<string, unknown>).status)
              : null;

          if (!chainStatus) continue;

          const mappedStatus = mapOnChainStatus(chainStatus);
          if (mappedStatus && mappedStatus !== escrow.status) {
            updateEscrow(escrow.id, { status: mappedStatus });
          }
        } catch {
          // Skip individual escrow sync failures silently
        }
      }
    } finally {
      syncingRef.current = false;
    }
  }, [escrows, isConnected, updateEscrow]);

  useEffect(() => {
    syncEscrows();
    const interval = setInterval(syncEscrows, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [syncEscrows]);
}
