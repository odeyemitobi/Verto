import { create } from "zustand";
import {
  setCurrentWallet,
  clearCurrentWallet,
  getCurrentWallet,
  rehydrateAll,
} from "./walletStorage";

/**
 * @stacks/connect is loaded dynamically to prevent Turbopack SSR module-eval
 * failures — the package contains browser-only code that cannot run during
 * Next.js static prerendering.
 */
async function getStacksConnect() {
  return await import("@stacks/connect");
}

interface WalletStore {
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
  network: "mainnet" | "testnet";
  hydrated: boolean;
  showMobileWalletModal: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  setNetwork: (network: "mainnet" | "testnet") => void;
  hydrate: () => void;
  closeMobileWalletModal: () => void;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  isConnected: false,
  address: null,
  isConnecting: false,
  network: "testnet",
  hydrated: false,
  showMobileWalletModal: false,

  hydrate: () => {
    if (get().hydrated) return;
    // Restore active wallet from localStorage first
    const savedWallet = getCurrentWallet();
    if (savedWallet) {
      setCurrentWallet(savedWallet);
    }

    // Dynamic import so nothing runs during SSR
    getStacksConnect()
      .then(({ isConnected: stacksIsConnected, getLocalStorage }) => {
        const connected = stacksIsConnected();
        if (connected) {
          const data = getLocalStorage();
          const stxAddress = data?.addresses?.stx?.[0]?.address ?? null;

          if (stxAddress) {
            setCurrentWallet(stxAddress);
          }

          set({
            isConnected: !!stxAddress,
            address: stxAddress,
            hydrated: true,
          });

          // Rehydrate all stores with the wallet's data
          // Use setTimeout to ensure stores are initialized
          setTimeout(() => rehydrateAll(), 0);
        } else {
          clearCurrentWallet();
          set({ hydrated: true });
          setTimeout(() => rehydrateAll(), 0);
        }
      })
      .catch(() => {
        set({ hydrated: true });
      });
  },

  connect: async () => {
    if (get().isConnecting) return;

    // If a wallet extension/provider is injected (desktop extension OR wallet
    // in-app browser like Xverse/Leather), proceed with the native flow.
    // Only show the mobile download modal when on a mobile browser WITHOUT
    // a provider available.
    const hasProvider =
      typeof window !== "undefined" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      !!((window as any).StacksProvider || (window as any).LeatherProvider);

    if (
      !hasProvider &&
      typeof window !== "undefined" &&
      /Mobi|Android/i.test(navigator.userAgent)
    ) {
      set({ showMobileWalletModal: true });
      return;
    }

    set({ isConnecting: true });
    try {
      const { connect: stacksConnect, getLocalStorage } =
        await getStacksConnect();
      const response = await stacksConnect();
      const stxEntry = response?.addresses?.find(
        (a: { symbol?: string }) => a.symbol === "STX",
      );
      const stxAddr =
        stxEntry?.address ??
        getLocalStorage()?.addresses?.stx?.[0]?.address ??
        null;

      // Set the wallet namespace BEFORE updating state
      if (stxAddr) {
        setCurrentWallet(stxAddr);
      } else {
        clearCurrentWallet();
      }

      set({
        isConnected: !!stxAddr,
        address: stxAddr,
        isConnecting: false,
      });

      // Rehydrate all stores from the new wallet's namespace
      setTimeout(() => rehydrateAll(), 0);
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

    // Clear wallet namespace
    clearCurrentWallet();
    set({ isConnected: false, address: null });

    // Rehydrate stores (will get empty state since no wallet is active)
    setTimeout(() => rehydrateAll(), 0);
  },

  setNetwork: (network) => set({ network }),
  closeMobileWalletModal: () => set({ showMobileWalletModal: false }),
}));
