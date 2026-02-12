'use client';

import Link from 'next/link';
import { RiWallet3Line, RiArrowRightLine } from 'react-icons/ri';
import { useWalletStore } from '@/stores/useWalletStore';

export default function Hero() {
  const { isConnected, connect } = useWalletStore();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-16">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400/5 blur-2xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 dark:border-orange-500/20 dark:bg-orange-500/10">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
            Built on Bitcoin with Stacks
          </span>
        </div>

        {/* Headline */}
        <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="text-gray-900 dark:text-white">Get Paid.</span>
          <br />
          <span className="bg-linear-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Stay Sovereign.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 sm:text-xl dark:text-gray-400">
          Self-custody invoicing with trustless escrow contracts. Create
          professional invoices, accept Bitcoin payments, and protect every deal
          — all without intermediaries.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          {isConnected ? (
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-orange-500 px-8 text-base font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/30"
            >
              Open Dashboard
              <RiArrowRightLine className="h-5 w-5" />
            </Link>
          ) : (
            <button
              onClick={connect}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-orange-500 px-8 text-base font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/30"
            >
              <RiWallet3Line className="h-5 w-5" />
              Connect Wallet
            </button>
          )}
          <a
            href="#features"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-gray-300 bg-white px-8 text-base font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-300 dark:hover:bg-neutral-800"
          >
            Learn More
          </a>
        </div>

        {/* Stats bar */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-center sm:gap-16">
          {[
            { value: '0%', label: 'Platform Fees' },
            { value: '100%', label: 'Self-Custody' },
            { value: '48hr', label: 'Auto-Release Escrow' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
