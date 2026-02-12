import { create } from 'zustand';
import {
  connect as stacksConnect,
  disconnect as stacksDisconnect,
  isConnected as stacksIsConnected,
  getLocalStorage,
} from '@stacks/connect';

interface WalletStore {
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
  network: 'mainnet' | 'testnet';
  hydrated: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  setNetwork: (network: 'mainnet' | 'testnet') => void;
  hydrate: () => void;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  isConnected: false,
  address: null,
  isConnecting: false,
  network: 'testnet',
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    try {
      const connected = stacksIsConnected();
      if (connected) {
        const data = getLocalStorage();
        const stxAddress = data?.addresses?.stx?.[0]?.address ?? null;
        set({ isConnected: !!stxAddress, address: stxAddress, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      // SSR or localStorage unavailable
      set({ hydrated: true });
    }
  },

  connect: async () => {
    if (get().isConnecting) return;
    set({ isConnecting: true });
    try {
      const response = await stacksConnect();
      // After connect, addresses are stored in localStorage by @stacks/connect
      const stxAddr =
        response?.addresses?.stx?.[0]?.address ??
        getLocalStorage()?.addresses?.stx?.[0]?.address ??
        null;

      set({
        isConnected: !!stxAddr,
        address: stxAddr,
        isConnecting: false,
      });
    } catch {
      set({ isConnecting: false });
    }
  },

  disconnect: () => {
    stacksDisconnect();
    set({ isConnected: false, address: null });
  },

  setNetwork: (network) => set({ network }),
}));
