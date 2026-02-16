import Link from 'next/link';
import Image from 'next/image';
import { RiTwitterXLine, RiGithubLine, RiDiscordLine } from 'react-icons/ri';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-12 dark:border-neutral-800 dark:bg-black">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo & tagline */}
          <div className="flex items-center gap-2">
            <Image src="/vertologo.png" alt="Verto" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
            <span className="font-bold text-gray-900 dark:text-white">
              Verto
            </span>
            <span className="text-sm text-gray-400">
              — Invoicing for sovereign workers
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              How It Works
            </Link>
          </div>

          {/* Social */}
          <div className="flex items-center gap-3">
            {[
              { icon: RiTwitterXLine, href: 'https://twitter.com/Odeyemitobi95', label: 'Twitter' },
              { icon: RiGithubLine, href: 'https://github.com/odeyemitobi/Verto', label: 'GitHub' },
              { icon: RiDiscordLine, href: '', label: 'Discord' },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-gray-300"
                aria-label={social.label}
              >
                <social.icon className="h-4.5 w-4.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-gray-100 pt-6 text-center dark:border-neutral-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} Verto. Built on Bitcoin with
            Stacks. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
