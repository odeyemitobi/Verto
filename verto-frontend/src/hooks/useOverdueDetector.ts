'use client';

import { useEffect, useCallback } from 'react';
import { useInvoiceStore } from '@/stores/useInvoiceStore';

/**
 * Automatically transitions pending invoices past their due date
 * to "overdue" status. Runs once on mount and every 60 seconds.
 */
export function useOverdueDetector() {
  const { invoices, updateInvoice } = useInvoiceStore();

  const checkOverdue = useCallback(() => {
    const now = new Date();

    invoices.forEach((invoice) => {
      if (invoice.status === 'pending' && invoice.dueDate) {
        const due = new Date(invoice.dueDate);
        // Set due date to end of day so it's overdue the NEXT day
        due.setHours(23, 59, 59, 999);

        if (now > due) {
          updateInvoice(invoice.id, { status: 'overdue' });
        }
      }
    });
  }, [invoices, updateInvoice]);

  useEffect(() => {
    // Check immediately
    checkOverdue();

    // Then check every 60 seconds
    const interval = setInterval(checkOverdue, 60_000);
    return () => clearInterval(interval);
  }, [checkOverdue]);
}
