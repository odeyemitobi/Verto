'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { useEscrowStore } from '@/stores/useEscrowStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { generateId } from '@/lib/utils';
import type { Escrow } from '@/types';

const escrowSchema = z.object({
  clientAddress: z.string().min(1, 'Client address is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  projectDescription: z.string().min(1, 'Description is required'),
});

type EscrowFormData = z.infer<typeof escrowSchema>;

interface CreateEscrowFormProps {
  onSuccess: () => void;
}

export default function CreateEscrowForm({ onSuccess }: CreateEscrowFormProps) {
  const { addEscrow, escrows } = useEscrowStore();
  const { address } = useWalletStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EscrowFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(escrowSchema) as any,
  });

  const onSubmit = (data: EscrowFormData) => {
    const escrow: Escrow = {
      id: generateId(),
      escrowId: escrows.length,
      clientAddress: data.clientAddress,
      freelancerAddress: address || '',
      amount: data.amount,
      amountUsd: data.amount, // Simplified: 1:1 for now
      status: 'created',
      projectDescription: data.projectDescription,
      createdAt: new Date().toISOString(),
    };

    addEscrow(escrow);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Client Wallet Address"
        placeholder="SP... or ST..."
        error={errors.clientAddress?.message}
        {...register('clientAddress')}
      />
      <Input
        label="Amount (USD)"
        type="number"
        step="0.01"
        placeholder="1000.00"
        error={errors.amount?.message}
        {...register('amount', { valueAsNumber: true })}
      />
      <Textarea
        label="Project Description"
        placeholder="Describe the scope of work for this escrow..."
        error={errors.projectDescription?.message}
        {...register('projectDescription')}
      />
      <div className="flex justify-end pt-2">
        <Button type="submit" isLoading={isSubmitting}>
          Create Escrow
        </Button>
      </div>
    </form>
  );
}
