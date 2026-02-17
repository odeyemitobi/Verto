/**
 * Wallet-namespaced localStorage adapter for Zustand persist.
 *
 * Each wallet address gets its own isolated storage namespace so that
 * switching wallets in the same browser profile shows only that wallet's
 * clients, invoices, escrows, and settings.
 *
 * Flow:
 *  1. On wallet connect  → call setCurrentWallet(address), then rehydrateAll()
 *  2. On wallet disconnect → call clearCurrentWallet(), then rehydrateAll()
 *  3. Each Zustand store uses createWalletStorage() as its storage engine
 */
import { createJSONStorage } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";

// ─── Module-level wallet address ─────────────────────────────────────────────

let currentWallet: string | null = null;

/** Key used to remember the last-connected wallet across refreshes */
const ACTIVE_WALLET_KEY = "verto-active-wallet";

export function setCurrentWallet(address: string | null) {
  currentWallet = address;
  if (typeof window !== "undefined") {
    if (address) {
      localStorage.setItem(ACTIVE_WALLET_KEY, address);
    } else {
      localStorage.removeItem(ACTIVE_WALLET_KEY);
    }
  }
}

export function clearCurrentWallet() {
  setCurrentWallet(null);
}

export function getCurrentWallet(): string | null {
  if (currentWallet) return currentWallet;
  if (typeof window !== "undefined") {
    return localStorage.getItem(ACTIVE_WALLET_KEY);
  }
  return null;
}

// ─── Namespaced storage factory ──────────────────────────────────────────────

/**
 * Creates a Zustand-compatible storage engine that namespaces keys
 * by the current wallet address. When no wallet is connected, it
 * returns empty state (no reads/writes) so the UI starts clean.
 */
export function createWalletStorage() {
  const rawStorage: StateStorage = {
    getItem(name: string): string | null {
      const wallet = getCurrentWallet();
      if (!wallet) return null; // No wallet → empty store
      const key = `${name}::${wallet}`;
      return localStorage.getItem(key);
    },

    setItem(name: string, value: string): void {
      const wallet = getCurrentWallet();
      if (!wallet) return; // Don't persist when no wallet
      const key = `${name}::${wallet}`;
      localStorage.setItem(key, value);
    },

    removeItem(name: string): void {
      const wallet = getCurrentWallet();
      if (!wallet) return;
      const key = `${name}::${wallet}`;
      localStorage.removeItem(key);
    },
  };

  return createJSONStorage(() => rawStorage);
}

// ─── Rehydration registry ────────────────────────────────────────────────────

type RehydrateFn = () => void;
const registry: RehydrateFn[] = [];

/** Register a store's rehydrate function so we can trigger it on wallet swap */
export function registerRehydrate(fn: RehydrateFn) {
  registry.push(fn);
}

/** Call after changing wallet to reload all stores from the new namespace */
export function rehydrateAll() {
  for (const fn of registry) {
    fn();
  }
}
