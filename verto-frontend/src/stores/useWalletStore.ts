import { create } from 'zustand';

/**
 * @stacks/connect is loaded dynamically to prevent Turbopack SSR module-eval
 * failures — the package contains browser-only code that cannot run during
 * Next.js static prerendering.
 */
async function getStacksConnect() {
  return await import('@stacks/connect');
}

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
    // Dynamic import so nothing runs during SSR
    getStacksConnect()
      .then(({ isConnected: stacksIsConnected, getLocalStorage }) => {
        const connected = stacksIsConnected();
        if (connected) {
          const data = getLocalStorage();
          const stxAddress = data?.addresses?.stx?.[0]?.address ?? null;
          set({ isConnected: !!stxAddress, address: stxAddress, hydrated: true });
        } else {
          set({ hydrated: true });
        }
      })
      .catch(() => {
        set({ hydrated: true });
      });
  },

  connect: async () => {
    if (get().isConnecting) return;
    set({ isConnecting: true });
    try {
      const { connect: stacksConnect, getLocalStorage } = await getStacksConnect();
      const response = await stacksConnect();
      const stxEntry = response?.addresses?.find(
        (a: { symbol?: string }) => a.symbol === 'STX',
      );
      const stxAddr =
        stxEntry?.address ??
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
    getStacksConnect()
      .then(({ disconnect: stacksDisconnect }) => {
        stacksDisconnect();
      })
      .catch(() => {});
    set({ isConnected: false, address: null });
  },

  setNetwork: (network) => set({ network }),
}));
