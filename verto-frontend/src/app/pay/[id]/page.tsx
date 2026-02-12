'use client';

import { use, useState, useEffect } from 'react';
import { RiFileCopyLine, RiBitCoinLine, RiTimeLine } from 'react-icons/ri';
import { toast } from 'sonner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDate, formatBtc } from '@/lib/utils';
import { formatBtcAmount } from '@/lib/price';
import { useInvoiceStore } from '@/stores/useInvoiceStore';

export default function PublicPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getInvoice } = useInvoiceStore();
  const invoice = getInvoice(id);

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black">
        <Card className="mx-4 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Invoice Not Found
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This invoice link may be invalid or has been removed.
          </p>
        </Card>
      </div>
    );
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(invoice.paymentAddress);
    toast.success('Payment address copied!');
  };

  const isPaid = invoice.status === 'paid';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-black">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/20">
            <RiBitCoinLine className="h-7 w-7 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {invoice.invoiceNumber}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Payment requested
          </p>
        </div>

        {/* Invoice Card */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
              <Badge status={invoice.status} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(invoice.amountUsd)}
                </p>
                {invoice.amountBtc > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ≈ {formatBtcAmount(invoice.amountBtc)} BTC
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Description</span>
              <p className="text-sm text-right text-gray-900 dark:text-white max-w-[60%]">
                {invoice.description}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Due Date</span>
              <div className="flex items-center gap-1.5 text-sm text-gray-900 dark:text-white">
                <RiTimeLine className="h-3.5 w-3.5 text-gray-400" />
                {formatDate(invoice.dueDate)}
              </div>
            </div>

            {/* Line items */}
            {invoice.items.length > 0 && (
              <div className="border-t border-gray-100 pt-4 dark:border-neutral-800">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Items
                </h3>
                <div className="space-y-2">
                  {invoice.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {item.description} × {item.quantity}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Payment Address */}
        {!isPaid && (
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Send payment to
            </h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-hidden text-ellipsis rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-700 dark:bg-neutral-800 dark:text-gray-300 font-mono">
                {invoice.paymentAddress}
              </code>
              <Button
                size="sm"
                variant="outline"
                icon={<RiFileCopyLine className="h-4 w-4" />}
                onClick={handleCopyAddress}
              >
                Copy
              </Button>
            </div>
            <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
              Send exactly {invoice.amountBtc > 0 ? formatBtcAmount(invoice.amountBtc) + ' BTC' : formatCurrency(invoice.amountUsd)} to the address above
            </p>
          </Card>
        )}

        {/* Paid confirmation */}
        {isPaid && (
          <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <div className="text-center">
              <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                Payment Received
              </p>
              {invoice.paidAt && (
                <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-500">
                  Paid on {formatDate(invoice.paidAt)}
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600">
          Powered by Verto — Invoicing for Sovereign Workers
        </p>
      </div>
    </div>
  );
}
