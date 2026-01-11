'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Power, Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const [isEnabled, setIsEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await fetch('/api/settings/status');
            const data = await response.json();
            setIsEnabled(data.enabled);
        } catch (error) {
            console.error('Failed to fetch status:', error);
        } finally {
            setIsFetching(false);
        }
    };

    const toggleSystem = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/settings/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !isEnabled }),
            });

            if (response.ok) {
                setIsEnabled(!isEnabled);
            }
        } catch (error) {
            console.error('Failed to toggle:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link
                        href="/"
                        className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-300" />
                    </Link>
                    <h1 className="text-xl font-bold text-white">Settings</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 py-8">
                {/* Kill Switch */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isEnabled
                                    ? 'bg-emerald-500/20'
                                    : 'bg-red-500/20'
                                }`}>
                                <Power className={`w-6 h-6 ${isEnabled ? 'text-emerald-400' : 'text-red-400'
                                    }`} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">System Status</h2>
                                <p className="text-sm text-slate-400">
                                    {isEnabled ? 'Auto-posting is active' : 'Auto-posting is disabled'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={toggleSystem}
                            disabled={isLoading || isFetching}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isEnabled ? 'bg-emerald-500' : 'bg-slate-600'
                                } disabled:opacity-50`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin mx-auto text-white" />
                            ) : (
                                <span
                                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-7' : 'translate-x-1'
                                        }`}
                                />
                            )}
                        </button>
                    </div>

                    {!isEnabled && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                            <p className="text-sm text-red-300">
                                ⚠️ Emergency Kill Switch is ON. All auto-posting is stopped.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
