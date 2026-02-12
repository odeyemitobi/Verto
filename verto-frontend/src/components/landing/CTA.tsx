'use client';

import { RiWallet3Line, RiArrowRightLine } from 'react-icons/ri';
import Link from 'next/link';
import { useWalletStore } from '@/stores/useWalletStore';

export default function CTA() {
  const { isConnected, connect } = useWalletStore();

  return (
    <section className="px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 to-amber-500 px-6 py-16 text-center shadow-2xl shadow-orange-500/20 sm:px-12 sm:py-20">
          {/* Background pattern */}
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-white/20" />
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/20" />
          </div>

          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Ready to get paid on your terms?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-lg text-orange-100">
              Join the sovereign worker economy. Create your first invoice in
              under a minute.
            </p>

            {isConnected ? (
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-base font-semibold text-orange-600 transition-all hover:bg-orange-50"
              >
                Go to Dashboard
                <RiArrowRightLine className="h-5 w-5" />
              </Link>
            ) : (
              <button
                onClick={connect}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-base font-semibold text-orange-600 transition-all hover:bg-orange-50"
              >
                <RiWallet3Line className="h-5 w-5" />
                Get Started — It&apos;s Free
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
