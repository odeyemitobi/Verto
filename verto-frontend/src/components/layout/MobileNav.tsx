'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RiCloseLine, RiWallet3Line, RiLogoutBoxRLine } from 'react-icons/ri';
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
  const lastPathnameRef = useRef<string | null>(null);

  // Close on route change
  useEffect(() => {
    if (lastPathnameRef.current === null) {
      lastPathnameRef.current = pathname;
      return;
    }

    if (lastPathnameRef.current !== pathname && isOpen) {
      onClose();
    }

    lastPathnameRef.current = pathname;
  }, [pathname, isOpen, onClose]);

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
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Bottom Sheet */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-[100] max-h-[80vh] transform rounded-t-3xl border-t bg-white pb-6 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden dark:border-neutral-800 dark:bg-neutral-950',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-neutral-700" />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between px-5 pb-3">
          <span className="text-base font-bold text-gray-900 dark:text-white">
            Menu
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400"
          >
            <RiCloseLine className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Navigation grid */}
        <nav className="grid grid-cols-5 gap-1 px-4 pb-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-2xl py-3 text-center transition-all duration-200',
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                    : 'text-gray-500 active:bg-gray-100 dark:text-gray-400 dark:active:bg-neutral-800',
                )}
              >
                <item.icon className="h-5.5 w-5.5" />
                <span className="text-[11px] font-semibold leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Wallet section */}
        <div className="border-t border-gray-100 px-5 py-4 dark:border-neutral-800/60">
          {isConnected && address ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
                <RiWallet3Line className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {truncateAddress(address, 5)}
                </span>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">Connected</span>
                </div>
              </div>
              <button
                onClick={disconnect}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-medium text-gray-600 transition-colors active:bg-red-50 active:text-red-600 dark:border-neutral-700 dark:text-gray-400 dark:active:bg-red-500/10 dark:active:text-red-400"
              >
                <RiLogoutBoxRLine className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 py-3 text-sm font-semibold text-white shadow-sm shadow-orange-500/25 transition-all active:bg-orange-600 disabled:opacity-60"
            >
              <RiWallet3Line className="h-4.5 w-4.5" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
