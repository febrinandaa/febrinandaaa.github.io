'use client';

import SidebarLayout from '@/components/SidebarLayout';
import { BarChart3, Upload, Clock, CheckCircle, AlertTriangle, CheckSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FANPAGES, getFanpageById } from '@/lib/config';
import Link from 'next/link';
import Image from 'next/image';

interface StockData {
  stock: Record<string, number>;
  target: number;
  config: {
    interval: number;
    duration: number;
  };
}

export default function Dashboard() {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/content/stock')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (count: number, target: number) => {
    const percentage = (count / target) * 100;
    if (percentage >= 120) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (percentage >= 100) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  const getStatusText = (count: number, target: number) => {
    const percentage = (count / target) * 100;
    if (percentage >= 120) return 'Safe';
    if (percentage >= 100) return 'Warning';
    return 'Critical';
  };

  return (
    <SidebarLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400">Content Stock Monitoring</p>
          </div>
          {data && (
            <div className="text-right">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Target Stock</div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{data.target} Posts</div>
              <div className="text-xs text-slate-400">({data.config.duration} days @ {data.config.interval}h interval)</div>
            </div>
          )}
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Pages */}
          <div className="bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{FANPAGES.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Pages</p>
              </div>
            </div>
          </div>

          {/* Total Pending Stock */}
          <div className="bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  {data ? Object.values(data.stock).reduce((a, b) => a + b, 0) : '...'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Pending Posts</p>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">Active</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">System Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fanpage Status Grid */}
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Stock Status per Page</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FANPAGES.map((fp) => {
            const count = data?.stock[fp.id] || 0;
            const target = data?.target || 1;
            const statusColor = getStatusColor(count, target);
            const statusText = getStatusText(count, target);

            return (
              <Link
                href={`/content/${fp.id}`}
                key={fp.id}
                className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 hover:border-indigo-500/50 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Profile Pic */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 border border-slate-100 dark:border-slate-600">
                      {fp.fbPageId ? (
                        <Image
                          src={`https://graph.facebook.com/${fp.fbPageId}/picture?type=large`}
                          alt={fp.name}
                          fill
                          className="object-cover"
                          unoptimized // specific for external FB images to avoid next/image optimizing strictly
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{fp.id.replace('FP_', '')}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">{fp.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-2 h-2 rounded-full ${count >= target ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{statusText}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                    {Math.round((count / target) * 100)}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${count >= target ? 'bg-emerald-500' : count >= target * 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    style={{ width: `${Math.min(100, (count / target) * 100)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Stock: <b className="text-slate-900 dark:text-white">{count}</b></span>
                  <span className="text-slate-400 dark:text-slate-500">Target: {target}</span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </SidebarLayout>
  );
}
