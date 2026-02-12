'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { RiSunLine, RiMoonLine, RiComputerLine } from 'react-icons/ri';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  if (!mounted) return <div className="h-9 w-9" />;

  const cycle = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const Icon =
    theme === 'dark'
      ? RiMoonLine
      : theme === 'light'
        ? RiSunLine
        : RiComputerLine;

  return (
    <button
      onClick={cycle}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
      aria-label="Toggle theme"
    >
      <Icon className="h-4.5 w-4.5" />
    </button>
  );
}
