import React, { useState } from 'react';
import { DoctorWorkloadItem } from '../types/database';
import { UserCheck, Stethoscope, ArrowUpDown, DollarSign, Filter } from 'lucide-react';

interface Props {
  data: DoctorWorkloadItem[];
  selectedDoctorId: number | null;
  onSelectDoctor: (doctorId: number | null) => void;
}

type SortBy = 'patients' | 'revenue' | 'experience';

export const DoctorBarChart: React.FC<Props> = ({ data, selectedDoctorId, onSelectDoctor }) => {
  const [sortBy, setSortBy] = useState<SortBy>('patients');

  if (!data || data.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-emerald-100/70 text-center text-slate-500 text-sm">
        No doctor caseload records found.
      </div>
    );
  }

  // Sort list according to active preference
  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
    if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
    return b.patientCount - a.patientCount;
  });

  const maxPatients = Math.max(...data.map(d => d.patientCount), 1);
  const maxRevenue = Math.max(...data.map(d => d.totalRevenue), 1);

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-sm border border-emerald-100/70 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">Doctor Patient Caseload</h3>
            <p className="text-xs text-slate-500">Distribution of admitted patients across clinic physicians</p>
          </div>
        </div>

        {/* Sort and Filter controls */}
        <div className="flex items-center gap-2">
          {selectedDoctorId !== null && (
            <button
              onClick={() => onSelectDoctor(null)}
              className="text-xs px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 transition-colors flex items-center gap-1"
            >
              <Filter className="w-3 h-3" />
              Clear Filter
            </button>
          )}

          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/80 text-xs">
            <button
              onClick={() => setSortBy('patients')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                sortBy === 'patients' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Patients
            </button>
            <button
              onClick={() => setSortBy('revenue')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                sortBy === 'revenue' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revenue
            </button>
          </div>
        </div>
      </div>

      {/* Bar List */}
      <div className="space-y-3.5 mt-4">
        {sortedData.map(doc => {
          const isSelected = selectedDoctorId === doc.doctorID;
          const patientPercent = (doc.patientCount / maxPatients) * 100;
          const revenuePercent = (doc.totalRevenue / maxRevenue) * 100;
          const displayPercent = sortBy === 'revenue' ? revenuePercent : patientPercent;

          return (
            <div
              key={doc.doctorID}
              onClick={() => onSelectDoctor(isSelected ? null : doc.doctorID)}
              className={`group cursor-pointer p-2.5 rounded-xl transition-all duration-150 ${
                isSelected
                  ? 'bg-emerald-50/90 border border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs'
                  : 'hover:bg-slate-50/80 border border-transparent hover:border-slate-200'
              }`}
            >
              {/* Doctor details and counts */}
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-slate-900 truncate">{doc.fullName}</span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">·</span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium truncate">
                    {doc.specialization}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                    {doc.experienceYears}y exp
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono">
                  <span className="text-slate-500 text-[11px] hidden sm:inline">
                    ${doc.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums text-xs">
                    {doc.patientCount} <span className="text-[10px] font-normal text-slate-500 font-sans">pts</span>
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-xs'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-400 group-hover:from-emerald-600 group-hover:to-teal-500'
                  }`}
                  style={{ width: `${Math.max(4, displayPercent)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer instruction note */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Click any physician to isolate their cases in the ledger</span>
        <span className="font-mono">{sortedData.length} active physicians</span>
      </div>
    </div>
  );
};
