'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Power, Loader2, Save, AlertTriangle, Recycle } from 'lucide-react';
import { useTheme } from 'next-themes';
import SettingsLayout from '@/components/SidebarLayout';

interface StockConfig {
    interval: number;
    duration: number;
    recycleEnabled: boolean;
    recycleMinDays: number;
}

export default function SettingsPage() {
    const { theme } = useTheme();
    const [isEnabled, setIsEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // Config State
    const [stockConfig, setStockConfig] = useState<StockConfig>({
        interval: 1,
        duration: 30,
        recycleEnabled: false,
        recycleMinDays: 14
    });

    // Calculation State
    const [calculation, setCalculation] = useState({
        postsPerDay: 0,
        totalRequired: 0
    });

    useEffect(() => {
        // Calculate requirement immediately on load & change
        const activeHours = 17; // 05:00 - 22:00
        const postsPerDay = Math.ceil(activeHours / stockConfig.interval);
        const basePosts = postsPerDay * stockConfig.duration;
        const totalRequired = Math.ceil(basePosts * 1.25); // 25% buffer

        setCalculation({ postsPerDay, totalRequired });
    }, [stockConfig.interval, stockConfig.duration]);

    // Fetch Config on Load
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/settings/config');
                if (response.ok) {
                    const data = await response.json();
                    setStockConfig(prev => ({ ...prev, ...data }));
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setIsFetching(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/settings/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stockConfig),
            });

            if (response.ok) {
                alert('Settings saved successfully!');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save settings');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsLayout>
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">System Settings</h1>
                    <p className="text-slate-500 dark:text-slate-400">Configure automation rules and safety limits</p>
                </div>

                <div className="max-w-2xl space-y-6">
                    {/* Stock Configuration Card */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                📊
                            </span>
                            Smart Stock Calculator
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Posting Interval
                                </label>
                                <select
                                    value={stockConfig.interval}
                                    onChange={(e) => setStockConfig({ ...stockConfig, interval: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value={1}>Every 1 Hour (Aggressive)</option>
                                    <option value={2}>Every 2 Hours (Standard)</option>
                                    <option value={3}>Every 3 Hours (Relaxed)</option>
                                </select>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Active hours: 05:00 - 22:00 (17 hours/day)</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Stock Duration Goal
                                </label>
                                <select
                                    value={stockConfig.duration}
                                    onChange={(e) => setStockConfig({ ...stockConfig, duration: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value={7}>7 Days (Weekly)</option>
                                    <option value={14}>14 Days (Bi-Weekly)</option>
                                    <option value={30}>30 Days (Monthly)</option>
                                </select>
                            </div>
                        </div>

                        {/* Calculation Result */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">
                                    Requirement Prediction
                                </h3>
                                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                    Based on your settings (+25% buffer)
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                                    {calculation.totalRequired} <span className="text-sm font-normal text-slate-500">posts/page</span>
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    ~{calculation.postsPerDay} posts per day
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Recycle Mode Card */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <Recycle className="w-5 h-5" />
                                    </span>
                                    Recycle Mode (Fail-Safe)
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Automatically repost old content if stock runs out.
                                </p>
                            </div>
                            <button
                                onClick={() => setStockConfig(prev => ({ ...prev, recycleEnabled: !prev.recycleEnabled }))}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${stockConfig.recycleEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                    }`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${stockConfig.recycleEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        {stockConfig.recycleEnabled && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/30">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                        <p>Strict rules active: Content must be at least 14 days old and used less than 3 times.</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                            Minimum Age (Days)
                                        </label>
                                        <input
                                            type="number"
                                            min="14"
                                            value={stockConfig.recycleMinDays}
                                            onChange={(e) => setStockConfig({ ...stockConfig, recycleMinDays: Math.max(14, parseInt(e.target.value)) })}
                                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Recommended: 21-30 days for best variety.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>
        </SettingsLayout>
    );
}
