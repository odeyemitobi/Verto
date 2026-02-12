'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { RiCloseLine, RiWallet3Line, RiLogoutBoxRLine, RiFileCopyLine } from 'react-icons/ri';
import { cn, truncateAddress } from '@/lib/utils';
import { NAV_ITEMS } from './Sidebar';
import { useWalletStore } from '@/stores/useWalletStore';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { isConnected, address, isConnecting, connect, disconnect, network } = useWalletStore();

  const copyAddress = () => {
    if (address) navigator.clipboard.writeText(address);
  };

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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transform bg-white transition-transform duration-300 ease-in-out lg:hidden dark:bg-neutral-950',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <Image src="/vertologo.png" alt="Verto" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
              Verto
            </span>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
              {network === 'mainnet' ? 'Main' : 'Test'}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-gray-100 dark:border-neutral-800/60" />

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Menu
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-800/50 dark:hover:text-white',
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                    isActive
                      ? 'bg-white/20'
                      : 'bg-gray-100 group-hover:bg-gray-200 dark:bg-neutral-800 dark:group-hover:bg-neutral-700',
                  )}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Wallet */}
        <div className="mx-3 mb-3">
          {isConnected && address ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
                  <RiWallet3Line className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {truncateAddress(address, 4)}
                    </span>
                    <button
                      onClick={copyAddress}
                      className="rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label="Copy address"
                    >
                      <RiFileCopyLine className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      Connected
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={disconnect}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-400 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              >
                <RiLogoutBoxRLine className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 py-3 text-sm font-semibold text-white shadow-sm shadow-orange-500/25 transition-all hover:bg-orange-600 hover:shadow-md hover:shadow-orange-500/30 disabled:opacity-60"
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
