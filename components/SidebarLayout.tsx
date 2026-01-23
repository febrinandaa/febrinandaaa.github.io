'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FANPAGES } from '@/lib/config';
import {
    Folder,
    Settings,
    LayoutDashboard,
    ChevronLeft,
    ChevronRight,
    Home,
    LogOut
} from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface SidebarLayoutProps {
    children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors flex">
            {/* Sidebar */}
            <aside
                className={`${collapsed ? 'w-20' : 'w-64'
                    } bg-white/80 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-700/50 backdrop-blur-xl flex flex-col transition-all duration-300 fixed h-full z-20`}
            >
                {/* Logo */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <LayoutDashboard className="w-5 h-5 text-white" />
                        </div>
                        {!collapsed && (
                            <div className="overflow-hidden">
                                <h1 className="text-lg font-bold text-slate-800 dark:text-white truncate">FB Auto Poster</h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">CMS</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4">
                    {/* Dashboard Link */}
                    <div className="px-3 mb-2">
                        <Link
                            href="/"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === '/'
                                ? 'bg-indigo-50/80 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <Home className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span className="font-medium">Dashboard</span>}
                        </Link>
                    </div>

                    {/* Fanpages Section */}
                    {!collapsed && (
                        <div className="px-4 py-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Fanpages
                            </p>
                        </div>
                    )}

                    <div className="px-3 space-y-1">
                        {FANPAGES.map((fp, index) => (
                            <Link
                                key={fp.id}
                                href={`/content/${fp.id}`}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${pathname === `/content/${fp.id}`
                                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                title={collapsed ? fp.name : undefined}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${pathname === `/content/${fp.id}`
                                    ? 'bg-indigo-100 dark:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300'
                                    : 'bg-slate-100 dark:bg-slate-700/50 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 text-slate-500 dark:text-slate-400'
                                    }`}>
                                    <span className="text-xs font-bold">{index + 1}</span>
                                </div>
                                {!collapsed && (
                                    <span className="font-medium truncate">{fp.name}</span>
                                )}
                            </Link>
                        ))}
                    </div>
                </nav>

                {/* Settings, Toggle, Logout & Collapse */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-700/50 space-y-2">
                    <Link
                        href="/settings"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === '/settings'
                            ? 'bg-indigo-50/80 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <Settings className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="font-medium">Settings</span>}
                    </Link>

                    <ThemeToggle collapsed={collapsed} />

                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
                    </button>

                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        {collapsed ? (
                            <ChevronRight className="w-5 h-5 flex-shrink-0" />
                        ) : (
                            <>
                                <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                                <span className="font-medium">Collapse</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 ${collapsed ? 'ml-20' : 'ml-64'} transition-all duration-300`}>
                {children}
            </main>
        </div>
    );
}
