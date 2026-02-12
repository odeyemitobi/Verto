'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RiSaveLine } from 'react-icons/ri';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { CURRENCIES } from '@/lib/constants';

const settingsSchema = z.object({
  businessName: z.string().optional(),
  email: z.string().email('Valid email required').or(z.literal('')),
  defaultPaymentAddress: z.string().optional(),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  invoicePrefix: z.string().min(1, 'Prefix is required'),
  autoNumbering: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { settings, updateSettings } = useSettingsStore();
  const { isConnected, address, network, setNetwork, disconnect } =
    useWalletStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  const onSubmit = (data: SettingsFormData) => {
    updateSettings(data);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <PageHeader
        title="Settings"
        description="Configure your Verto workspace."
      />

      {/* Business settings */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Business Details
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Business Name"
              placeholder="Your Business"
              {...register('businessName')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <Input
            label="Default Payment Address"
            placeholder="bc1q... or SP..."
            hint="Pre-fills the payment address on new invoices."
            {...register('defaultPaymentAddress')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Currency"
              options={CURRENCIES.map((c) => ({
                value: c.value,
                label: c.label,
              }))}
              {...register('currency')}
            />
            <Input
              label="Invoice Prefix"
              placeholder="INV"
              error={errors.invoicePrefix?.message}
              {...register('invoicePrefix')}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoNumbering"
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-800"
              {...register('autoNumbering')}
            />
            <label
              htmlFor="autoNumbering"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Automatic invoice numbering
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={!isDirty}
              icon={<RiSaveLine className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Wallet settings */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
          Wallet & Network
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-neutral-800">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Status
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isConnected
                  ? `Connected: ${address}`
                  : 'Not connected'}
              </p>
            </div>
            <span
              className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-gray-300 dark:bg-gray-600'}`}
            />
          </div>

          <Select
            label="Network"
            options={[
              { value: 'testnet', label: 'Testnet' },
              { value: 'mainnet', label: 'Mainnet' },
            ]}
            value={network}
            onChange={(e) =>
              setNetwork(e.target.value as 'mainnet' | 'testnet')
            }
          />

          {isConnected && (
            <Button variant="outline" onClick={disconnect}>
              Disconnect Wallet
            </Button>
          )}
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200 dark:border-red-500/20">
        <h2 className="mb-2 text-base font-semibold text-red-600 dark:text-red-400">
          Danger Zone
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Clear all local data including invoices, clients, and settings. This
          action cannot be undone.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (
              confirm(
                'Are you sure? This will delete all your local data.',
              )
            ) {
              localStorage.clear();
              window.location.reload();
            }
          }}
        >
          Clear All Data
        </Button>
      </Card>
    </div>
  );
}
