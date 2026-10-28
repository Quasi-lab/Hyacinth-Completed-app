import React from 'react';
import { AnalyticsSummary } from '../types/database';
import { DollarSign, Users, BedDouble, ReceiptText } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  summary: AnalyticsSummary;
}

export const KpiCards: React.FC<Props> = ({ summary }) => {
  const cards = [
    {
      label: 'Total Gross Revenue',
      icon: DollarSign,
      iconColor: 'bg-emerald-100/70 text-emerald-800',
      value: `$${summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      meta: (
        <>
          <span className="font-medium text-emerald-700">100% Star-Schema Synced</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-400 font-mono">{summary.totalRecords} bills</span>
        </>
      ),
    },
    {
      label: 'Average Bill / Visit',
      icon: ReceiptText,
      iconColor: 'bg-teal-100/70 text-teal-800',
      value: `$${summary.averageBill.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      meta: <span className="text-slate-500">Per inpatient admission</span>,
    },
    {
      label: 'Patient Admissions',
      icon: Users,
      iconColor: 'bg-cyan-100/70 text-cyan-800',
      value: summary.totalRecords.toLocaleString(),
      meta: <span className="text-slate-500">Across {summary.totalDoctors} attending physicians</span>,
    },
    {
      label: 'Room Bed Utilization',
      icon: BedDouble,
      iconColor: 'bg-emerald-100/70 text-emerald-800',
      value: `${summary.occupancyRate.toFixed(1)}%`,
      meta: (
        <>
          <span className="font-mono tabular-nums text-emerald-700 font-semibold">{summary.availableBeds} beds free</span>
          <span className="text-slate-300">/</span>
          <span className="font-mono tabular-nums">{summary.totalBeds} total beds</span>
        </>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="glass-panel rounded-2xl p-5 border border-emerald-100/80 shadow-xs relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-emerald-300/80"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg ${card.iconColor} flex items-center justify-center shadow-2xs`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums tracking-tight">
                {card.value}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                {card.meta}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
