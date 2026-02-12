'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  RiArrowLeftLine,
  RiDeleteBinLine,
  RiEditLine,
  RiCheckLine,
  RiFileCopyLine,
  RiDownloadLine,
  RiRefreshLine,
  RiShareLine,
} from 'react-icons/ri';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate, formatBtc } from '@/lib/utils';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { downloadInvoicePdf } from '@/lib/pdf';
import { fetchBtcPrice, formatBtcAmount } from '@/lib/price';
import { checkPaymentReceived, btcToSats, getMempoolTxUrl } from '@/lib/mempool';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import type { Invoice } from '@/types';

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { getInvoice, updateInvoice, deleteInvoice } = useInvoiceStore();
  const { settings } = useSettingsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  const invoice = getInvoice(id);

  if (!invoice) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            Invoice not found
          </p>
          <Link
            href="/invoices"
            className="mt-2 text-sm text-orange-500 hover:underline"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const handleMarkPaid = () => {
    updateInvoice(invoice.id, {
      status: 'paid',
      paidAt: new Date().toISOString(),
    });
    toast.success('Invoice marked as paid');
  };

  const handleDelete = () => {
    deleteInvoice(invoice.id);
    toast.success('Invoice deleted');
    router.push('/invoices');
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(invoice.paymentAddress);
    toast.success('Payment address copied to clipboard');
  };

  const handleDownloadPdf = () => {
    downloadInvoicePdf(invoice, settings.businessName, settings.email);
    toast.success('PDF downloaded');
  };

  const handleCheckPayment = async () => {
    if (!invoice.amountBtc || invoice.amountBtc <= 0) {
      toast.error('Cannot check payment — no BTC amount set');
      return;
    }
    setIsCheckingPayment(true);
    try {
      const expectedSats = btcToSats(invoice.amountBtc);
      const result = await checkPaymentReceived(
        invoice.paymentAddress,
        expectedSats,
      );
      if (result) {
        updateInvoice(invoice.id, {
          status: 'paid',
          paidAt: new Date().toISOString(),
          txHash: result.txHash,
        });
        toast.success('Payment found!', {
          description: result.confirmed ? 'Confirmed on-chain.' : 'In mempool, awaiting confirmation.',
          action: {
            label: 'View TX',
            onClick: () => window.open(getMempoolTxUrl(result.txHash), '_blank'),
          },
        });
      } else {
        toast.info('No payment detected yet', {
          description: 'We\'ll keep checking in the background.',
        });
      }
    } catch {
      toast.error('Failed to check payment');
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleEditSuccess = (updated: Invoice) => {
    updateInvoice(invoice.id, updated);
    setIsEditing(false);
    toast.success('Invoice updated');
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}/pay/${invoice.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Payment link copied to clipboard', {
      description: url,
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <RiArrowLeftLine className="h-4 w-4" />
        Back to Invoices
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {invoice.invoiceNumber}
            </h1>
            <Badge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Created {formatDate(invoice.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status === 'pending' && (
            <>
              <Button
                size="sm"
                icon={<RiCheckLine className="h-4 w-4" />}
                onClick={handleMarkPaid}
              >
                Mark Paid
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<RiRefreshLine className="h-4 w-4" />}
                onClick={handleCheckPayment}
                isLoading={isCheckingPayment}
              >
                Check Payment
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            icon={<RiDownloadLine className="h-4 w-4" />}
            onClick={handleDownloadPdf}
          >
            PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<RiShareLine className="h-4 w-4" />}
            onClick={handleShareLink}
          >
            Share
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<RiEditLine className="h-4 w-4" />}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={<RiDeleteBinLine className="h-4 w-4" />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Invoice details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Client info */}
        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Bill To
          </h3>
          <p className="font-medium text-gray-900 dark:text-white">
            {invoice.clientName}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {invoice.description}
          </p>
        </Card>

        {/* Payment info */}
        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Payment
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(invoice.amountUsd)}
          </p>
          {invoice.amountBtc > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ≈ {formatBtc(invoice.amountBtc)}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Due: {formatDate(invoice.dueDate)}
          </p>
        </Card>
      </div>

      {/* Line items */}
      <Card padding="none">
        <div className="border-b border-gray-100 px-5 py-3 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Line Items
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-neutral-800/50">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
                  Description
                </th>
                <th className="px-5 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400">
                  Qty
                </th>
                <th className="px-5 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400">
                  Rate
                </th>
                <th className="px-5 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3 text-gray-900 dark:text-white">
                    {item.description}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">
                    {item.quantity}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-400">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-white">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-neutral-800/50">
                <td
                  colSpan={3}
                  className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white"
                >
                  Total
                </td>
                <td className="px-5 py-3 text-right text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(invoice.amountUsd)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Payment address */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Payment Address
        </h3>
        <div className="flex items-center gap-2">
          <code className="flex-1 overflow-hidden text-ellipsis rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
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
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Notes
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {invoice.notes}
          </p>
        </Card>
      )}

      {/* Transaction Hash */}
      {invoice.txHash && (
        <Card>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Transaction
          </h3>
          <a
            href={getMempoolTxUrl(invoice.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:text-blue-600 break-all transition-colors"
          >
            {invoice.txHash}
          </a>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Edit Invoice"
      >
        <InvoiceForm
          onSuccess={handleEditSuccess}
          initialData={invoice}
        />
      </Modal>
    </div>
  );
}
