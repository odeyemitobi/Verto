'use client';

import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RiSaveLine, RiUploadLine, RiCloseLine } from 'react-icons/ri';
import { toast } from 'sonner';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    toast.success('Settings saved');
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
          {/* Logo Upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Business Logo
            </label>
            <div className="flex items-center gap-4">
              {settings.logo ? (
                <div className="relative">
                  <img
                    src={settings.logo}
                    alt="Business logo"
                    className="h-16 w-16 rounded-lg border border-gray-200 object-contain dark:border-neutral-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({ logo: undefined });
                      toast.success('Logo removed');
                    }}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white shadow hover:bg-red-600"
                  >
                    <RiCloseLine className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 dark:border-neutral-700">
                  <RiUploadLine className="h-5 w-5 text-gray-400" />
                </div>
              )}
              <div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  icon={<RiUploadLine className="h-3.5 w-3.5" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Logo
                </Button>
                <p className="mt-1 text-xs text-gray-400">PNG, JPG up to 500KB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 512_000) {
                    toast.error('File too large', { description: 'Max 500KB' });
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    updateSettings({ logo: reader.result as string });
                    toast.success('Logo uploaded');
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </div>
          </div>

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
