import React from 'react';
import { RefreshCw, Plus, Database, Sparkles } from 'lucide-react';

interface Props {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenNewRecord: () => void;
  onOpenSchema: () => void;
  lastUpdated: string;
  refreshInterval: number;
  onChangeInterval: (interval: number) => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onRefresh,
  isRefreshing,
  onOpenNewRecord,
  onOpenSchema,
  lastUpdated,
  refreshInterval,
  onChangeInterval,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Strict 3-Zone Top Bar Contract */}
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xs">
              <span className="font-bold text-lg font-serif">H</span>
            </div>
            <a
              href="#overview"
              onClick={e => {
                e.preventDefault();
                onSelectTab('overview');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-emerald-800 transition-colors"
            >
              Hyacinth Clinic
            </a>
          </div>

          {/* Zone 2: 4–5 single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('overview')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'overview' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-600' : ''
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onSelectTab('financials')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'financials' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-600' : ''
              }`}
            >
              Financials
            </button>
            <button
              onClick={() => onSelectTab('physicians')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'physicians' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-600' : ''
              }`}
            >
              Physicians
            </button>
            <button
              onClick={() => onSelectTab('afflictions')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'afflictions' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-600' : ''
              }`}
            >
              Afflictions
            </button>
            <button
              onClick={() => onSelectTab('records')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'records' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-600' : ''
              }`}
            >
              Records
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenNewRecord}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Admission
            </button>
          </div>
        </div>

        {/* Secondary Utility / Telemetry Bar below header */}
        <div className="py-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase REST Live</span>
            </div>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-slate-400">
              Synced: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Connecting...'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto refresh interval control */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px]">Auto:</span>
              <select
                value={refreshInterval}
                onChange={e => onChangeInterval(Number(e.target.value))}
                aria-label="Auto-refresh interval"
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value={0}>Manual</option>
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
            </div>

            {/* Manual Sync Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1 text-slate-500 hover:text-emerald-700 rounded-md hover:bg-emerald-50 transition-colors flex items-center gap-1"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="text-xs">Sync</span>
            </button>

            {/* Star Schema Explorer Button */}
            <button
              onClick={onOpenSchema}
              className="p-1 text-slate-500 hover:text-emerald-700 rounded-md hover:bg-emerald-50 transition-colors flex items-center gap-1"
              title="Inspect Star Schema Database"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="text-xs hidden sm:inline">Schema</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
