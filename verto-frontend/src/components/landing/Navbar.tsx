'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RiMenuLine, RiCloseLine, RiWallet3Line, RiLoader4Line } from 'react-icons/ri';
import { cn, truncateAddress } from '@/lib/utils';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { useWalletStore } from '@/stores/useWalletStore';

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isConnected, address, isConnecting, connect } = useWalletStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-gray-200/50 bg-white/80 backdrop-blur-xl dark:border-neutral-800/50 dark:bg-black/80'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/vertologo.png" alt="Verto" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            Verto
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

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
              className="hidden items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-60 sm:flex"
            >
              {isConnecting ? (
                <RiLoader4Line className="h-4 w-4 animate-spin" />
              ) : (
                <RiWallet3Line className="h-4 w-4" />
              )}
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 md:hidden dark:text-gray-400 dark:hover:bg-neutral-800"
          >
            {mobileOpen ? (
              <RiCloseLine className="h-5 w-5" />
            ) : (
              <RiMenuLine className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 pb-4 pt-2 md:hidden dark:border-neutral-800 dark:bg-black">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-neutral-900"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 border-t border-gray-100 pt-2 dark:border-neutral-800">
            {isConnected && address ? (
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-neutral-900">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {truncateAddress(address, 6)}
                </span>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {isConnecting ? (
                  <RiLoader4Line className="h-4 w-4 animate-spin" />
                ) : (
                  <RiWallet3Line className="h-4 w-4" />
                )}
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
