'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RiArrowLeftLine } from 'react-icons/ri';
import { toast } from 'sonner';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/layout/PageHeader';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import type { Invoice } from '@/types';

export default function NewInvoicePage() {
  const router = useRouter();
  const { addInvoice } = useInvoiceStore();

  const handleSuccess = (invoice: Invoice) => {
    addInvoice(invoice);
    toast.success('Invoice created', {
      description: `${invoice.invoiceNumber} — ${invoice.clientName}`,
    });
    router.push(`/invoices/${invoice.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/invoices"
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <RiArrowLeftLine className="h-4 w-4" />
        Back to Invoices
      </Link>

      {/* Header */}
      <PageHeader
        title="Create Invoice"
        description="Fill in the details below to generate a new invoice."
      />

      {/* Form */}
      <Card>
        <InvoiceForm onSuccess={handleSuccess} />
      </Card>
    </div>
  );
}
