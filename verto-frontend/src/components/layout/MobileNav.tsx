'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { RiCloseLine, RiWallet3Line } from 'react-icons/ri';
import { cn, truncateAddress } from '@/lib/utils';
import { NAV_ITEMS } from './Sidebar';
import { useWalletStore } from '@/stores/useWalletStore';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { isConnected, address, isConnecting, connect, disconnect } = useWalletStore();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transform bg-white transition-transform duration-300 ease-in-out lg:hidden dark:bg-black',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Image src="/vertologo.png" alt="Verto" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Verto
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-900 dark:hover:text-white',
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Wallet */}
        <div className="border-t border-gray-200 p-4 dark:border-neutral-800">
          {isConnected && address ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-neutral-900">
                <RiWallet3Line className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {truncateAddress(address, 6)}
                </span>
                <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <button
                onClick={disconnect}
                className="w-full rounded-lg px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-neutral-900 dark:hover:text-gray-300"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
            >
              <RiWallet3Line className="h-4 w-4" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
