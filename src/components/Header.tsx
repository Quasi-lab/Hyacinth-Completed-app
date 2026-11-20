import React, { useState } from 'react';
import { RefreshCw, Plus, Database, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'financials', label: 'Financials' },
  { id: 'physicians', label: 'Physicians' },
  { id: 'afflictions', label: 'Afflictions' },
  { id: 'instruments', label: 'Instruments' },
  { id: 'records', label: 'Records' },
];

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-emerald-100/80 dark:border-emerald-500/20 shadow-xs transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Strict 3-Zone Top Bar Contract */}
        <div className="flex items-center justify-between gap-4 sm:gap-8 h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xs cursor-pointer"
              onClick={() => onSelectTab('overview')}
            >
              <span className="font-bold text-lg font-serif">H</span>
            </motion.div>
            <a
              href="#overview"
              onClick={e => {
                e.preventDefault();
                onSelectTab('overview');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors"
            >
              Hyacinth Clinic
            </a>
          </div>

          {/* Zone 2: Desktop Navigation with Animated Sliding Indicator */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 relative">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative px-3.5 py-1.5 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 ${
                    isActive ? 'text-emerald-900 dark:text-emerald-300 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBadge"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="absolute inset-0 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/30 rounded-lg shadow-2xs z-0"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action + Mobile Trigger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={onOpenNewRecord}
              className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Log Admission</span>
              <span className="xs:hidden">Log</span>
            </motion.button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden border-t border-slate-100 dark:border-slate-800 py-3 overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-1.5">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onSelectTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-lg text-center transition-colors ${
                      activeTab === tab.id
                        ? 'bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-500/50'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Secondary Utility / Telemetry Bar below header */}
        <div className="py-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-medium">
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
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value={0}>Manual</option>
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
            </div>

            {/* Manual Sync Button */}
            <motion.button
              whileTap={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors flex items-center gap-1"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
              <span className="text-xs">Sync</span>
            </motion.button>

            {/* Star Schema Explorer Button */}
            <button
              onClick={onOpenSchema}
              className="p-1 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors flex items-center gap-1"
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
