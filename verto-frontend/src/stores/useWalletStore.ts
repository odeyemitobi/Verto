import { create } from 'zustand';

interface WalletStore {
  isConnected: boolean;
  address: string | null;
  network: 'mainnet' | 'testnet';
  connect: () => void;
  disconnect: () => void;
  setNetwork: (network: 'mainnet' | 'testnet') => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  isConnected: false,
  address: null,
  network: 'testnet',

  connect: () => {
    // TODO: Replace with real Stacks Connect integration
    set({
      isConnected: true,
      address: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQVX8X0G',
    });
  },

  disconnect: () => {
    set({ isConnected: false, address: null });
  },

  setNetwork: (network) => set({ network }),
}));
