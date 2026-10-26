import React, { useState, useMemo } from 'react';
import { TimelinePoint } from '../types/database';
import { Calendar, TrendingUp, Layers } from 'lucide-react';

interface Props {
  data: TimelinePoint[];
}

type PeriodFilter = 'ALL' | 'Q1' | 'Q2' | 'Q3' | '30D';
type ViewMode = 'daily' | 'cumulative';

export const FinancialLineChart: React.FC<Props> = ({ data }) => {
  const [period, setPeriod] = useState<PeriodFilter>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Filter data based on selected time window
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let result = [...data];
    if (period === 'Q1') {
      result = result.filter(d => d.date >= '2026-01-01' && d.date <= '2026-03-31');
    } else if (period === 'Q2') {
      result = result.filter(d => d.date >= '2026-04-01' && d.date <= '2026-06-30');
    } else if (period === 'Q3') {
      result = result.filter(d => d.date >= '2026-07-01' && d.date <= '2026-09-30');
    } else if (period === '30D') {
      // Last 30 distinct recorded dates
      result = result.slice(-30);
    }

    if (viewMode === 'cumulative') {
      let runTotal = 0;
      return result.map(pt => {
        runTotal += pt.cost;
        return {
          ...pt,
          cost: runTotal,
        };
      });
    }

    return result;
  }, [data, period, viewMode]);

  // SVG Chart Geometry Math
  const width = 800;
  const height = 300;
  const padding = { top: 25, right: 30, bottom: 40, left: 65 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const { points, maxVal, minVal, pathD, areaD, yTicks } = useMemo(() => {
    if (filteredData.length === 0) {
      return { points: [], maxVal: 0, minVal: 0, pathD: '', areaD: '', yTicks: [] };
    }

    const values = filteredData.map(d => d.cost);
    const max = Math.max(...values, 1000);
    const min = 0;

    // Nice round tick values
    const ticksCount = 5;
    const tickStep = max / ticksCount;
    const ticks = Array.from({ length: ticksCount + 1 }, (_, i) => Math.round(i * tickStep));

    const pts = filteredData.map((d, i) => {
      const x = padding.left + (i / Math.max(1, filteredData.length - 1)) * innerWidth;
      const y = padding.top + innerHeight - ((d.cost - min) / (max - min || 1)) * innerHeight;
      return { x, y, data: d };
    });

    if (pts.length === 1) {
      const p = pts[0];
      const d = `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`;
      return { points: pts, maxVal: max, minVal: min, pathD: d, areaD: '', yTicks: ticks };
    }

    // Generate smooth Bézier or straight path
    const dStr = pts.reduce((acc, curr, idx, arr) => {
      if (idx === 0) return `M ${curr.x} ${curr.y}`;
      const prev = arr[idx - 1];
      const cx = (prev.x + curr.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }, '');

    const areaStr = `${dStr} L ${pts[pts.length - 1].x} ${padding.top + innerHeight} L ${pts[0].x} ${padding.top + innerHeight} Z`;

    return {
      points: pts,
      maxVal: max,
      minVal: min,
      pathD: dStr,
      areaD: areaStr,
      yTicks: ticks,
    };
  }, [filteredData, innerWidth, innerHeight, padding.left, padding.top]);

  // Aggregate stats for current window
  const currentTotal = useMemo(() => {
    if (viewMode === 'cumulative' && filteredData.length > 0) {
      return filteredData[filteredData.length - 1].cost;
    }
    return filteredData.reduce((acc, curr) => acc + curr.cost, 0);
  }, [filteredData, viewMode]);

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-sm border border-emerald-100/70 relative">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-50">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">Financial Costs Over Time</h3>
              <p className="text-xs text-slate-500">Timeline analysis of clinical and inpatient billing charges</p>
            </div>
          </div>
        </div>

        {/* Filters and View toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switch */}
          <div className="flex items-center bg-emerald-50/70 p-0.5 rounded-lg border border-emerald-100 text-xs">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === 'daily' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Cost
            </button>
            <button
              onClick={() => setViewMode('cumulative')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                viewMode === 'cumulative' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cumulative
            </button>
          </div>

          {/* Time Window Buttons */}
          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/80 text-xs">
            {(['ALL', 'Q1', 'Q2', 'Q3', '30D'] as PeriodFilter[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  period === p ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === 'ALL' ? 'All Time' : p === '30D' ? 'Last 30D' : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric highlight banner */}
      <div className="flex items-baseline gap-4 mt-3 mb-2">
        <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
          ${currentTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-slate-500">
          {viewMode === 'cumulative' ? 'Total Period Gross' : `Sum over ${filteredData.length} active billing days`}
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="financialGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#10B981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines and Y-axis labels */}
          {yTicks.map((val, idx) => {
            const y = padding.top + innerHeight - ((val - minVal) / (maxVal - minVal || 1)) * innerHeight;
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] font-mono fill-slate-400 tabular-nums"
                >
                  ${val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                </text>
              </g>
            );
          })}

          {/* Shaded Area Fill */}
          {areaD && <path d={areaD} fill="url(#financialGradient)" />}

          {/* Stroke Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="url(#strokeGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X-axis date labels */}
          {points.length > 0 &&
            [0, Math.floor(points.length / 4), Math.floor(points.length / 2), Math.floor((points.length * 3) / 4), points.length - 1]
              .filter((idx, i, arr) => arr.indexOf(idx) === i)
              .map(idx => {
                const pt = points[idx];
                if (!pt) return null;
                const dStr = pt.data.date;
                return (
                  <text
                    key={idx}
                    x={pt.x}
                    y={height - 12}
                    textAnchor="middle"
                    className="text-[11px] font-mono fill-slate-400 tabular-nums"
                  >
                    {dStr.slice(5)}
                  </text>
                );
              })}

          {/* Interactive Voronoi / Hit testing rectangles */}
          {points.map((pt, idx) => {
            const prevX = idx > 0 ? (points[idx - 1].x + pt.x) / 2 : padding.left;
            const nextX = idx < points.length - 1 ? (pt.x + points[idx + 1].x) / 2 : width - padding.right;
            return (
              <rect
                key={idx}
                x={prevX}
                y={padding.top}
                width={Math.max(1, nextX - prevX)}
                height={innerHeight}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(idx)}
              />
            );
          })}

          {/* Active Hover Guideline and Dot */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={padding.top + innerHeight}
                stroke="#059669"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="6"
                fill="#FFFFFF"
                stroke="#059669"
                strokeWidth="2.5"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Card */}
        {activePoint && (
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white text-xs py-2 px-3 rounded-lg shadow-lg border border-slate-700/50 z-20"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${Math.max(10, (activePoint.y / height) * 100 - 25)}%`,
            }}
          >
            <div className="font-mono text-emerald-300 font-semibold mb-0.5">{activePoint.data.date}</div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">{viewMode === 'cumulative' ? 'Cumulative:' : 'Daily Billed:'}</span>
              <span className="font-mono font-bold text-white tabular-nums">
                ${activePoint.data.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {viewMode === 'daily' && (
              <div className="flex items-center justify-between gap-4 text-[11px] text-slate-400 mt-0.5">
                <span>Admissions:</span>
                <span className="font-mono font-medium">{activePoint.data.admissions} patients</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
