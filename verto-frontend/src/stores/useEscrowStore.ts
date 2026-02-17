import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Escrow } from "@/types";
import { createWalletStorage, registerRehydrate } from "./walletStorage";

interface EscrowStore {
  escrows: Escrow[];
  addEscrow: (escrow: Escrow) => void;
  updateEscrow: (id: string, updates: Partial<Escrow>) => void;
  deleteEscrow: (id: string) => void;
  getEscrow: (id: string) => Escrow | undefined;
}

export const useEscrowStore = create<EscrowStore>()(
  persist(
    (set, get) => ({
      escrows: [],

      addEscrow: (escrow) =>
        set((state) => ({ escrows: [escrow, ...state.escrows] })),

      updateEscrow: (id, updates) =>
        set((state) => ({
          escrows: state.escrows.map((e) =>
            e.id === id ? { ...e, ...updates } : e,
          ),
        })),

      deleteEscrow: (id) =>
        set((state) => ({
          escrows: state.escrows.filter((e) => e.id !== id),
        })),

      getEscrow: (id) => get().escrows.find((e) => e.id === id),
    }),
    {
      name: "verto-escrows",
      storage: createWalletStorage(),
    },
  ),
);

registerRehydrate(() => useEscrowStore.persist.rehydrate());
