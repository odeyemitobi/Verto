import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Invoice } from "@/types";
import { createWalletStorage, registerRehydrate } from "./walletStorage";

interface InvoiceStore {
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  getInvoice: (id: string) => Invoice | undefined;
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoices: [],

      addInvoice: (invoice) =>
        set((state) => ({ invoices: [invoice, ...state.invoices] })),

      updateInvoice: (id, updates) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...updates } : inv,
          ),
        })),

      deleteInvoice: (id) =>
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
        })),

      getInvoice: (id) => get().invoices.find((inv) => inv.id === id),
    }),
    {
      name: "verto-invoices",
      storage: createWalletStorage(),
    },
  ),
);

registerRehydrate(() => useInvoiceStore.persist.rehydrate());
