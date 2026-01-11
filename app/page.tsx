import Link from 'next/link';
import { FANPAGES } from '@/lib/config';
import { Folder, Settings, LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">FB Auto Poster</h1>
              <p className="text-xs text-slate-400">Content Management System</p>
            </div>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Fanpages</h2>
          <p className="text-slate-400">Select a fanpage to manage content</p>
        </div>

        {/* Fanpage Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FANPAGES.map((fp, index) => (
            <Link
              key={fp.id}
              href={`/content/${fp.id}`}
              className="group relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-xl flex items-center justify-center group-hover:from-indigo-500/30 group-hover:to-purple-600/30 transition-colors">
                  <Folder className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="text-xs font-medium text-slate-500 bg-slate-700/50 px-2 py-1 rounded-md">
                  #{index + 1}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{fp.name}</h3>
              <p className="text-sm text-slate-400">ID: {fp.id}</p>
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
