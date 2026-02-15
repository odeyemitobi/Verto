"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useInvoiceStore } from "@/stores/useInvoiceStore";
import {
  checkPaymentReceived,
  btcToSats,
  getMempoolTxUrl,
} from "@/lib/mempool";
import { formatBtcAmount } from "@/lib/price";

const POLL_INTERVAL_MS = 60_000; // Check every 60 seconds

/**
 * Send a browser notification if the user has granted permission.
 */
function sendBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });
  }
}

/**
 * Hook that monitors pending invoices for BTC payment arrival
 * Runs in the background and auto-updates invoice status
 */
export function usePaymentMonitor() {
  const { invoices, updateInvoice } = useInvoiceStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  const checkPayments = useCallback(async () => {
    const pendingInvoices = invoices.filter(
      (inv) =>
        inv.status === "pending" && inv.paymentAddress && inv.amountBtc > 0,
    );

    if (pendingInvoices.length === 0) return;

    for (const invoice of pendingInvoices) {
      try {
        const expectedSats = btcToSats(invoice.amountBtc);
        const result = await checkPaymentReceived(
          invoice.paymentAddress,
          expectedSats,
        );

        if (result) {
          updateInvoice(invoice.id, {
            status: "paid",
            paidAt: new Date().toISOString(),
            txHash: result.txHash,
          });

          const description = result.confirmed
            ? "Transaction confirmed on-chain."
            : "Transaction detected in mempool, awaiting confirmation.";

          toast.success(`Payment received for ${invoice.invoiceNumber}!`, {
            description,
            action: {
              label: "View TX",
              onClick: () =>
                window.open(getMempoolTxUrl(result.txHash), "_blank"),
            },
          });

          // Also send browser notification
          sendBrowserNotification(
            `💰 Payment received — ${invoice.invoiceNumber}`,
            `${formatBtcAmount(invoice.amountBtc)} BTC received. ${description}`,
          );
        }
      } catch {
        // Silently continue - don't spam errors for each invoice
      }
    }
  }, [invoices, updateInvoice]);

  useEffect(() => {
    // Initial check
    checkPayments();

    // Set up polling
    intervalRef.current = setInterval(checkPayments, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkPayments]);
}
