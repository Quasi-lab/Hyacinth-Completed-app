import React from 'react';
import { Moon, Sun, Palette } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../lib/useTheme';

export const AppearanceView: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel rounded-2xl p-6 sm:p-8 shadow-sm border border-emerald-100/70 dark:border-emerald-500/20 max-w-3xl"
    >
      <div className="flex items-center gap-2.5 pb-4 border-b border-emerald-50 dark:border-emerald-500/10 mb-6">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
          <Palette className="w-4 h-4" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Appearance</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Choose how Hyacinth Clinic looks on this device</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Dark mode</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Currently using the {isDark ? 'dark' : 'light'} theme. Your choice is saved automatically.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Sun
            className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-amber-500'}`}
            aria-hidden="true"
          />
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Dark mode"
            onClick={toggleTheme}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              isDark ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isDark ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <Moon
            className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-slate-400'}`}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Surfaces</p>
          <p className="mt-1 font-mono text-xs text-slate-900 dark:text-slate-100">Glass cards & panels</p>
        </div>
        <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Charts</p>
          <p className="mt-1 font-mono text-xs text-emerald-700 dark:text-emerald-400">Emerald data accents</p>
        </div>
        <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Default</p>
          <p className="mt-1 font-mono text-xs text-slate-900 dark:text-slate-100">Follows system until set</p>
        </div>
      </div>

      <p className="mt-5 text-[11px] text-slate-400">
        On your first visit the app follows your device preference; switching here overrides it from then on.
      </p>
    </motion.div>
  );
};
