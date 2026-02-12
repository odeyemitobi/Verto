'use client';

import { useEffect } from 'react';
import { useWalletStore } from '@/stores/useWalletStore';

/**
 * Hydrates wallet state from @stacks/connect localStorage.
 * Place this in layouts that need wallet state (e.g. landing page).
 */
export default function WalletHydrator() {
  const hydrate = useWalletStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return null;
}
