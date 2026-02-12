'use client';

import Image from 'next/image';
import { RiMenuLine, RiWallet3Line } from 'react-icons/ri';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { useWalletStore } from '@/stores/useWalletStore';
import { truncateAddress } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { isConnected, address, isConnecting, connect } = useWalletStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-xl dark:border-neutral-800 dark:bg-black/80 lg:px-6">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-neutral-800"
        aria-label="Open menu"
      >
        <RiMenuLine className="h-5 w-5" />
      </button>

      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <Image src="/vertologo.png" alt="Verto" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
        <span className="font-bold text-gray-900 dark:text-white">Verto</span>
      </div>

      {/* Page title (desktop) */}
      {title && (
        <h1 className="hidden text-lg font-semibold text-gray-900 lg:block dark:text-white">
          {title}
        </h1>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* Wallet button (mobile / header) */}
        {isConnected && address ? (
          <div className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 sm:flex dark:border-neutral-700">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {truncateAddress(address, 4)}
            </span>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="hidden items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-60 sm:flex lg:hidden"
          >
            <RiWallet3Line className="h-3.5 w-3.5" />
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        )}
      </div>
    </header>
  );
}
