import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSettings } from '@/types';

interface SettingsStore {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: {
        businessName: '',
        email: '',
        defaultPaymentAddress: '',
        currency: 'USD',
        invoicePrefix: 'INV',
        autoNumbering: true,
      },
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
    }),
    { name: 'verto-settings' },
  ),
);
