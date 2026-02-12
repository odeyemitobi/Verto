'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletStore } from '@/stores/useWalletStore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isConnected, hydrated, hydrate } = useWalletStore();
  const router = useRouter();

  // Hydrate wallet state from localStorage on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Redirect to landing if not connected after hydration
  useEffect(() => {
    if (hydrated && !isConnected) {
      router.replace('/');
    }
  }, [hydrated, isConnected, router]);

  // Show loading while hydrating
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children until connected
  if (!isConnected) {
    return null;
  }

  return <>{children}</>;
}
