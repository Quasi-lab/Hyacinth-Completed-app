import React, { useState, useMemo } from 'react';
import { DiseaseDistributionItem } from '../types/database';
import { Activity, PieChart, ShieldAlert } from 'lucide-react';

interface Props {
  data: DiseaseDistributionItem[];
  selectedAffliction: string | null;
  onSelectAffliction: (name: string | null) => void;
}

// Sophisticated clinical palette with green/teal dominance
const COLORS = [
  '#059669', // Emerald
  '#0D9488', // Teal
  '#10B981', // Mint
  '#0284C7', // Sky Blue
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#84CC16', // Lime
  '#64748B', // Slate
];

export const AfflictionPieChart: React.FC<Props> = ({ data, selectedAffliction, onSelectAffliction }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalPatients = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.count, 0);
  }, [data]);

  // Compute SVG arcs
  const size = 260;
  const center = size / 2;
  const radius = 95;
  const innerRadius = 55; // Donut style for modern glassmorphism

  const slices = useMemo(() => {
    if (totalPatients === 0) return [];

    let currentAngle = -Math.PI / 2; // Start from 12 o'clock

    return data.map((item, idx) => {
      const sliceAngle = (item.count / totalPatients) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      // Outer arc points
      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);

      // Inner arc points
      const x3 = center + innerRadius * Math.cos(endAngle);
      const y3 = center + innerRadius * Math.sin(endAngle);
      const x4 = center + innerRadius * Math.cos(startAngle);
      const y4 = center + innerRadius * Math.sin(startAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      const pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
        'Z',
      ].join(' ');

      const percentage = ((item.count / totalPatients) * 100).toFixed(1);
      const color = COLORS[idx % COLORS.length];

      return {
        ...item,
        pathData,
        percentage,
        color,
        index: idx,
      };
    });
  }, [data, totalPatients, center, radius, innerRadius]);

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : selectedAffliction ? slices.find(s => s.name === selectedAffliction) : null;

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-sm border border-emerald-100/70 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-emerald-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">Diseases & Clinical Afflictions</h3>
            <p className="text-xs text-slate-500">Distribution of patient diagnoses and clinical admissions</p>
          </div>
        </div>

        {selectedAffliction && (
          <button
            onClick={() => onSelectAffliction(null)}
            className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Center Donut + Legend Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center mt-4">
        {/* Donut Chart SVG */}
        <div className="md:col-span-5 flex justify-center relative select-none">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            {slices.map((slice, idx) => {
              const isHovered = hoveredIndex === idx;
              const isSelected = selectedAffliction === slice.name;
              const scale = isHovered || isSelected ? 1.05 : 1;

              return (
                <path
                  key={idx}
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-200 cursor-pointer hover:opacity-90"
                  style={{
                    transformOrigin: `${center}px ${center}px`,
                    transform: isHovered || isSelected ? 'scale(1.04)' : 'scale(1)',
                    filter: isHovered || isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' : 'none',
                  }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onSelectAffliction(selectedAffliction === slice.name ? null : slice.name)}
                />
              );
            })}

            {/* Center Summary Content */}
            <circle cx={center} cy={center} r={innerRadius - 4} fill="#FFFFFF" className="shadow-inner" />
            <text
              x={center}
              y={center - 8}
              textAnchor="middle"
              className="text-[10px] uppercase tracking-wider fill-slate-400 font-medium"
            >
              {activeSlice ? 'Selected' : 'Total Cases'}
            </text>
            <text
              x={center}
              y={center + 14}
              textAnchor="middle"
              className="text-lg font-bold font-mono fill-slate-900 tabular-nums"
            >
              {activeSlice ? activeSlice.count : totalPatients}
            </text>
            {activeSlice && (
              <text
                x={center}
                y={center + 28}
                textAnchor="middle"
                className="text-[11px] font-mono font-semibold fill-emerald-600"
              >
                {activeSlice.percentage}%
              </text>
            )}
          </svg>
        </div>

        {/* Legend and Itemized Percentages */}
        <div className="md:col-span-7 space-y-2">
          {slices.map((slice, idx) => {
            const isHovered = hoveredIndex === idx;
            const isSelected = selectedAffliction === slice.name;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelectAffliction(selectedAffliction === slice.name ? null : slice.name)}
                className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-all ${
                  isHovered || isSelected
                    ? 'bg-emerald-50/80 border border-emerald-200'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="font-medium text-slate-800 truncate">{slice.name}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono">
                  <span className="text-slate-400 text-[11px] tabular-nums">{slice.count} cases</span>
                  <span className="font-semibold text-slate-900 tabular-nums w-12 text-right">
                    {slice.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Click any disease slice to filter ledger records</span>
        <span className="font-mono">8 clinical categories</span>
      </div>
    </div>
  );
};
