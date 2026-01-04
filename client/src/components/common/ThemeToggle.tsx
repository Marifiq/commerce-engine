'use client';

import { useTheme } from '@/contexts';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative flex items-center justify-between w-14 h-7 rounded-full bg-black dark:bg-white transition-colors duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <span
                className={`absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-black transition-transform duration-300 ${
                    theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
                }`}
            >
                {theme === 'light' ? (
                    <Sun className="h-3 w-3 text-black" />
                ) : (
                    <Moon className="h-3 w-3 text-white" />
                )}
            </span>
        </button>
    );
}

