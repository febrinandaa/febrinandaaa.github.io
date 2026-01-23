'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            title={collapsed ? 'Toggle theme' : undefined}
        >
            <div className="relative w-5 h-5 flex-shrink-0">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
                <Moon className="absolute top-0 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" />
            </div>
            {!collapsed && (
                <span className="font-medium text-slate-700 dark:text-slate-300">
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
            )}
        </button>
    );
}
