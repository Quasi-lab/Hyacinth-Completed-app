import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/useTheme';

const EASE = [0.16, 1, 0.3, 1] as const;

export const ThemeFab: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      whileTap={reduceMotion ? undefined : { scale: 0.94 }}
      whileHover={reduceMotion ? undefined : { scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className="fixed bottom-5 left-5 z-40 grid h-12 w-12 place-items-center rounded-full border border-emerald-200/80 bg-white/85 text-emerald-700 shadow-lg shadow-emerald-900/10 backdrop-blur-md transition-colors duration-300 hover:bg-white hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC] dark:border-emerald-500/25 dark:bg-slate-900/85 dark:text-emerald-300 dark:shadow-black/40 dark:hover:bg-slate-800 dark:hover:text-emerald-200 dark:focus-visible:ring-offset-slate-950"
    >
      <span className="relative grid h-5 w-5 place-items-center">
        <AnimatePresence initial={false}>
          <motion.span
            key={isDark ? 'sun' : 'moon'}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -70, scale: 0.55 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, rotate: 0, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0, transition: { duration: 0.1 } }
                : { opacity: 0, rotate: 70, scale: 0.55, transition: { duration: 0.14, ease: EASE } }
            }
            transition={{ duration: reduceMotion ? 0.12 : 0.2, ease: EASE }}
            className="absolute inset-0 grid place-items-center"
          >
            {isDark ? (
              <Sun className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            )}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
};
