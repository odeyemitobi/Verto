'use client';

import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import { useInvoiceStore } from '@/stores/useInvoiceStore';
import type { Invoice } from '@/types';

export default function NewInvoicePage() {
  const router = useRouter();
  const { addInvoice } = useInvoiceStore();

  const handleSuccess = (invoice: Invoice) => {
    addInvoice(invoice);
    router.push(`/invoices/${invoice.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create Invoice
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Fill in the details below to generate a new invoice.
        </p>
      </div>

      {/* Form */}
      <Card>
        <InvoiceForm onSuccess={handleSuccess} />
      </Card>
    </div>
  );
}
