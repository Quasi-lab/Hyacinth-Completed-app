import React from 'react';
import { AnalyticsSummary } from '../types/database';
import { DollarSign, Users, BedDouble, ReceiptText } from 'lucide-react';

interface Props {
  summary: AnalyticsSummary;
}

export const KpiCards: React.FC<Props> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Total Revenue */}
      <div className="glass-panel glass-card-hover rounded-2xl p-5 border border-emerald-100/80 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Gross Revenue</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-emerald-800 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            ${summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
            <span className="font-medium">100% Star-Schema Synced</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400 font-mono">{summary.totalRecords} bills</span>
          </div>
        </div>
      </div>

      {/* KPI 2: Average Patient Bill */}
      <div className="glass-panel glass-card-hover rounded-2xl p-5 border border-emerald-100/80 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average Bill / Visit</span>
          <div className="w-8 h-8 rounded-lg bg-teal-100/60 text-teal-800 flex items-center justify-center">
            <ReceiptText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            ${summary.averageBill.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Per inpatient admission</span>
          </div>
        </div>
      </div>

      {/* KPI 3: Total Admitted Patients */}
      <div className="glass-panel glass-card-hover rounded-2xl p-5 border border-emerald-100/80 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Patient Admissions</span>
          <div className="w-8 h-8 rounded-lg bg-cyan-100/60 text-cyan-800 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {summary.totalRecords.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Across {summary.totalDoctors} attending physicians</span>
          </div>
        </div>
      </div>

      {/* KPI 4: Room & Bed Capacity */}
      <div className="glass-panel glass-card-hover rounded-2xl p-5 border border-emerald-100/80 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Room Bed Utilization</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-emerald-800 flex items-center justify-center">
            <BedDouble className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {summary.occupancyRate.toFixed(1)}%
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-mono tabular-nums text-emerald-700 font-semibold">{summary.availableBeds} beds free</span>
            <span className="text-slate-300">/</span>
            <span className="font-mono tabular-nums">{summary.totalBeds} total beds</span>
          </div>
        </div>
      </div>
    </div>
  );
};
