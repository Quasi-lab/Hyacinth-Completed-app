import React, { useState } from 'react';
import { DoctorWorkloadItem } from '../types/database';
import { Stethoscope, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  data: DoctorWorkloadItem[];
  selectedDoctorId: number | null;
  onSelectDoctor: (doctorId: number | null) => void;
}

type SortBy = 'patients' | 'revenue';

export const DoctorBarChart: React.FC<Props> = ({ data, selectedDoctorId, onSelectDoctor }) => {
  const [sortBy, setSortBy] = useState<SortBy>('patients');

  if (!data || data.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-emerald-100/70 dark:border-emerald-500/20 text-center text-slate-500 dark:text-slate-400 text-sm">
        No doctor caseload records found.
      </div>
    );
  }

  // Sort list according to active preference
  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
    return b.patientCount - a.patientCount;
  });

  const maxPatients = Math.max(...data.map(d => d.patientCount), 1);
  const maxRevenue = Math.max(...data.map(d => d.totalRevenue), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel rounded-2xl p-6 shadow-sm border border-emerald-100/70 dark:border-emerald-500/20 flex flex-col justify-between transition-all duration-300 hover:shadow-md"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-50 dark:border-emerald-500/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Doctor Patient Caseload</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Distribution of admitted patients across clinic physicians</p>
          </div>
        </div>

        {/* Sort and Filter controls */}
        <div className="flex items-center gap-2">
          {selectedDoctorId !== null && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => onSelectDoctor(null)}
              className="text-xs px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200/80 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-colors flex items-center gap-1"
            >
              <Filter className="w-3 h-3" />
              Clear Filter
            </motion.button>
          )}

          <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs">
            {(['patients', 'revenue'] as SortBy[]).map(mode => (
              <button
                key={mode}
                onClick={() => setSortBy(mode)}
                className={`relative px-2.5 py-1 rounded-md font-medium transition-colors ${
                  sortBy === mode ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className="relative z-10 capitalize">{mode}</span>
                {sortBy === mode && (
                  <motion.div
                    layoutId="doctorSortBadge"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-2xs z-0"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bar List with smooth animated layout reordering */}
      <motion.div layout className="space-y-3.5 mt-4">
        <AnimatePresence>
          {sortedData.map(doc => {
            const isSelected = selectedDoctorId === doc.doctorID;
            const patientPercent = (doc.patientCount / maxPatients) * 100;
            const revenuePercent = (doc.totalRevenue / maxRevenue) * 100;
            const displayPercent = sortBy === 'revenue' ? revenuePercent : patientPercent;

            return (
              <motion.div
                layout
                key={doc.doctorID}
                onClick={() => onSelectDoctor(isSelected ? null : doc.doctorID)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`group cursor-pointer p-2.5 rounded-xl transition-colors duration-150 ${
                  isSelected
                    ? 'bg-emerald-50/90 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/50 ring-2 ring-emerald-400/20 shadow-xs'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                {/* Doctor details and counts */}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{doc.fullName}</span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">·</span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium truncate">
                      {doc.specialization}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                      {doc.experienceYears}y exp
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] hidden sm:inline">
                      ${doc.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums text-xs">
                      {doc.patientCount} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 font-sans">pts</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar Track with Motion Width animation */}
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(4, displayPercent)}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className={`h-full rounded-full ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-xs'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-400 group-hover:from-emerald-600 group-hover:to-teal-500'
                    }`}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Footer instruction note */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Click any physician to isolate their cases in the ledger</span>
        <span className="font-mono">{sortedData.length} active physicians</span>
      </div>
    </motion.div>
  );
};
