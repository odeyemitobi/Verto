import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client } from '@/types';

interface ClientStore {
  clients: Client[];
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set, get) => ({
      clients: [],

      addClient: (client) =>
        set((state) => ({ clients: [client, ...state.clients] })),

      updateClient: (id, updates) =>
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        })),

      deleteClient: (id) =>
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        })),

      getClient: (id) => get().clients.find((c) => c.id === id),
    }),
    { name: 'verto-clients' },
  ),
);
