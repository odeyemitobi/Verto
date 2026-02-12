'use client';

import { useState } from 'react';
import {
  RiAddLine,
  RiSearchLine,
  RiUserLine,
  RiDeleteBinLine,
  RiMailLine,
  RiBuildingLine,
} from 'react-icons/ri';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/layout/PageHeader';
import ClientForm from '@/components/clients/ClientForm';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { useClientStore } from '@/stores/useClientStore';
import { useInvoiceStore } from '@/stores/useInvoiceStore';

export default function ClientsPage() {
  const { clients, deleteClient } = useClientStore();
  const { invoices } = useInvoiceStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = clients.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase()),
  );

  const getClientInvoiceCount = (clientId: string) =>
    invoices.filter((i) => i.clientId === clientId).length;

  const getClientTotal = (clientId: string) =>
    invoices
      .filter((i) => i.clientId === clientId && i.status === 'paid')
      .reduce((sum, i) => sum + i.amountUsd, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Clients"
        description="Manage your client relationships."
        badge={
          clients.length > 0 ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-neutral-800 dark:text-gray-400">
              {clients.length}
            </span>
          ) : undefined
        }
        action={
          <Button
            icon={<RiAddLine className="h-4 w-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Client
          </Button>
        }
      />

      {/* Search */}
      <div className="w-full sm:max-w-xs">
        <Input
          placeholder="Search clients..."
          icon={<RiSearchLine className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Client grid */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<RiUserLine className="h-7 w-7" />}
            title={clients.length === 0 ? 'No clients yet' : 'No matches'}
            description={
              clients.length === 0
                ? 'Add your first client to start creating invoices.'
                : 'Try adjusting your search.'
            }
            actionLabel={clients.length === 0 ? 'Add Client' : undefined}
            onAction={
              clients.length === 0 ? () => setIsModalOpen(true) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <Card key={client.id} hover>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                    {client.name}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <RiMailLine className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.company && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <RiBuildingLine className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{client.company}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    deleteClient(client.id);
                    toast.success('Client deleted');
                  }}
                  aria-label="Delete client"
                  className="ml-2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                >
                  <RiDeleteBinLine className="h-4 w-4" />
                </button>
              </div>

              {/* Stats */}
              <div className="mt-4 flex gap-4 border-t border-gray-100 pt-3 dark:border-neutral-800">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Invoices
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {getClientInvoiceCount(client.id)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total Paid
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ${getClientTotal(client.id).toLocaleString()}
                  </p>
                </div>
                <div className="ml-auto">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Added
                  </p>
                  <p className="text-xs text-gray-900 dark:text-white">
                    {formatDate(client.createdAt)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add client modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Client"
      >
        <ClientForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
