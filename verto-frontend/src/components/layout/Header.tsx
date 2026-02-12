'use client';

import Image from 'next/image';
import { RiMenuLine, RiWallet3Line, RiNotification3Line, RiCalendarLine } from 'react-icons/ri';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { useWalletStore } from '@/stores/useWalletStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { truncateAddress } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { isConnected, address, isConnecting, connect } = useWalletStore();
  const { settings } = useSettingsStore();
  const displayName = settings.businessName || 'stacker';

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl dark:border-neutral-800/40 dark:bg-neutral-950/80">
      <div className="flex py-3.5 items-center gap-3 px-4 lg:px-6">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <Image src="/vertologo.png" alt="Verto" width={24} height={24} className="h-6 w-6 rounded-md object-contain" />
          <span className="font-bold text-gray-900 dark:text-white">Verto</span>
        </div>

        {/* Greeting + date (desktop) */}
        <div className="hidden lg:flex lg:flex-col">
          <span className="text-2xl pb-1 text-gray-900 dark:text-white">
            {getGreeting()}, {displayName}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <RiCalendarLine className="h-3 w-3" />
            {getFormattedDate()}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-1.5">
          {/* Notifications placeholder */}
          <button className="relative hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-gray-300" aria-label="Notifications">
            <RiNotification3Line className="h-4.5 w-4.5" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-500" />
          </button>

          <ThemeToggle />

          {/* Wallet pill */}
          {isConnected && address ? (
            <div className="hidden items-center gap-2 rounded-xl border border-gray-200/80 bg-gray-50 px-3 py-1.5 sm:flex dark:border-neutral-700/60 dark:bg-neutral-800/50">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {truncateAddress(address, 4)}
              </span>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="hidden items-center gap-1.5 rounded-xl bg-orange-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-orange-500/25 transition-all hover:bg-orange-600 hover:shadow-md disabled:opacity-60 sm:flex lg:hidden"
            >
              <RiWallet3Line className="h-3.5 w-3.5" />
              {isConnecting ? '...' : 'Connect'}
            </button>
          )}

          {/* Mobile menu (moved to right) */}
          <button
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-neutral-800"
            aria-label="Open menu"
          >
            <RiMenuLine className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
