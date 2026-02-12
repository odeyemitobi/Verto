'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { useClientStore } from '@/stores/useClientStore';
import { generateId } from '@/lib/utils';
import type { Client } from '@/types';

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  onSuccess: () => void;
  initialData?: Client;
}

export default function ClientForm({ onSuccess, initialData }: ClientFormProps) {
  const { addClient, updateClient } = useClientStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      company: initialData?.company || '',
      address: initialData?.address || '',
      notes: initialData?.notes || '',
    },
  });

  const onSubmit = (data: ClientFormData) => {
    if (initialData) {
      updateClient(initialData.id, data);
      toast.success('Client updated');
    } else {
      const client: Client = {
        id: generateId(),
        ...data,
        createdAt: new Date().toISOString(),
      };
      addClient(client);
      toast.success('Client added', {
        description: `${data.name} has been added to your clients.`,
      });
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Name"
          placeholder="John Doe"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Company (optional)"
          placeholder="Acme Inc."
          {...register('company')}
        />
        <Input
          label="Address (optional)"
          placeholder="123 Main St"
          {...register('address')}
        />
      </div>
      <Textarea
        label="Notes (optional)"
        placeholder="Internal notes about this client..."
        {...register('notes')}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" isLoading={isSubmitting}>
          {initialData ? 'Update Client' : 'Add Client'}
        </Button>
      </div>
    </form>
  );
}
