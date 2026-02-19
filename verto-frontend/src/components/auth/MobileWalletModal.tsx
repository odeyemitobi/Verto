"use client";

import { useEffect } from "react";
import {
  RiCloseLine,
  RiSmartphoneLine,
  RiExternalLinkLine,
  RiInformationLine,
} from "react-icons/ri";
import { useWalletStore } from "@/stores/useWalletStore";

const WALLETS = [
  {
    name: "Xverse",
    description: "Bitcoin wallet for Web3",
    ios: "https://apps.apple.com/app/xverse-bitcoin-web3-wallet/id1552272513",
    android:
      "https://play.google.com/store/apps/details?id=com.secretkeylabs.xverse",
    color: "from-indigo-500 to-violet-600",
    iconBg: "bg-indigo-100 dark:bg-indigo-500/15",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    name: "Leather",
    description: "Self-custody Bitcoin wallet",
    ios: "https://apps.apple.com/app/leather-bitcoin-wallet/id6471735016",
    android:
      "https://play.google.com/store/apps/details?id=io.leather.mobileapp",
    color: "from-neutral-700 to-neutral-900",
    iconBg: "bg-neutral-100 dark:bg-neutral-700/40",
    iconColor: "text-neutral-700 dark:text-neutral-300",
  },
];

function getStoreLink(wallet: (typeof WALLETS)[number]): string {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return wallet.ios;
  return wallet.android; // default to Android / fallback
}

export default function MobileWalletModal() {
  const { showMobileWalletModal, closeMobileWalletModal } = useWalletStore();

  // Lock body scroll when open
  useEffect(() => {
    if (showMobileWalletModal) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileWalletModal]);

  if (!showMobileWalletModal) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeMobileWalletModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white px-6 pb-8 pt-5 shadow-2xl dark:bg-neutral-900 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pb-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-neutral-700" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/15">
              <RiSmartphoneLine className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Mobile Wallet Required
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Install a Stacks wallet to continue
              </p>
            </div>
          </div>
          <button
            onClick={closeMobileWalletModal}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-400 dark:hover:bg-neutral-700"
            aria-label="Close"
          >
            <RiCloseLine className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Wallet Options */}
        <div className="space-y-3 mb-5">
          {WALLETS.map((wallet) => (
            <a
              key={wallet.name}
              href={getStoreLink(wallet)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-gray-200/80 p-4 transition-all active:scale-[0.98] hover:border-gray-300 hover:shadow-sm dark:border-neutral-700/60 dark:hover:border-neutral-600"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${wallet.iconBg}`}
              >
                <span className={`text-lg font-bold ${wallet.iconColor}`}>
                  {wallet.name[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {wallet.name}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {wallet.description}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-orange-500/25">
                Install
                <RiExternalLinkLine className="h-3 w-3" />
              </div>
            </a>
          ))}
        </div>

        {/* Tip */}
        <div className="flex gap-2.5 rounded-xl bg-blue-50 p-3.5 dark:bg-blue-500/10">
          <RiInformationLine className="h-4 w-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
              Already have a wallet app?
            </p>
            <p className="text-[11px] text-blue-600/80 dark:text-blue-400/70 mt-0.5">
              Open Verto inside your wallet&apos;s built-in browser for the best
              experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
