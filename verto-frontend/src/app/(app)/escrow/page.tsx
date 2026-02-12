'use client';

import { useState } from 'react';
import { RiAddLine, RiShieldCheckLine } from 'react-icons/ri';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import EscrowCard from '@/components/escrow/EscrowCard';
import CreateEscrowForm from '@/components/escrow/CreateEscrowForm';
import { useEscrowStore } from '@/stores/useEscrowStore';
import { useWalletStore } from '@/stores/useWalletStore';
import type { Escrow, EscrowStatus } from '@/types';

const STATUS_TABS: { label: string; value: EscrowStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Created', value: 'created' },
  { label: 'Funded', value: 'funded' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Completed', value: 'completed' },
  { label: 'Disputed', value: 'disputed' },
];

export default function EscrowPage() {
  const { escrows, updateEscrow } = useEscrowStore();
  const { isConnected } = useWalletStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<EscrowStatus | 'all'>('all');

  const filtered = escrows.filter(
    (e) => statusFilter === 'all' || e.status === statusFilter,
  );

  const handleAction = (action: string, escrow: Escrow) => {
    // TODO: Replace with real Stacks contract calls
    switch (action) {
      case 'fund':
        updateEscrow(escrow.id, {
          status: 'funded',
          fundedAt: new Date().toISOString(),
        });
        break;
      case 'deliver':
        updateEscrow(escrow.id, {
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
          reviewDeadline: new Date(
            Date.now() + 48 * 60 * 60 * 1000,
          ).toISOString(),
        });
        break;
      case 'release':
        updateEscrow(escrow.id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
        break;
      case 'dispute':
        updateEscrow(escrow.id, { status: 'disputed' });
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Escrow
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage trustless escrow contracts for your projects.
          </p>
        </div>
        <Button
          icon={<RiAddLine className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
          disabled={!isConnected}
        >
          New Escrow
        </Button>
      </div>

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
                ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800'
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
              escrows.length === 0
                ? 'No escrows yet'
                : 'No matching escrows'
            }
            description={
              escrows.length === 0
                ? 'Create your first escrow contract to protect your payments with smart contracts.'
                : 'Try adjusting your filter.'
            }
            actionLabel={
              escrows.length === 0 && isConnected ? 'Create Escrow' : undefined
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
              onAction={handleAction}
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
