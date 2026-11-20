import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { FinalsResult } from '../../finals';

type Bar = { label: string; value: number; count?: number };
const number = new Intl.NumberFormat('en-PH');
const pesos = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
const percent = (value: number | null) => value === null ? 'Unavailable' : `${(value * 100).toFixed(1)}%`;
const total = (rows: Bar[]) => rows.reduce((sum, row) => sum + row.value, 0);
const panel = 'rounded-2xl border border-slate-200 bg-white p-5 sm:p-6';

function Bars({ rows, max, currency }: { rows: Bar[]; max: number; currency?: boolean }) {
  if (!rows.length) return <p className="text-sm text-slate-500">No matching rows</p>;
  return <ul className="space-y-2">
    {rows.map(row => <li key={row.label}>
      <div className="flex justify-between gap-2 text-xs">
        <span className="text-slate-700">{row.label}</span>
        <span className="whitespace-nowrap font-mono font-semibold text-slate-900">
          {currency ? pesos.format(row.value) : number.format(row.value)}
          {row.count !== undefined && <span className="ml-2 text-slate-500">({number.format(row.count)})</span>}
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded bg-slate-100">
        <div className="h-full rounded bg-emerald-600" style={{ width: `${100 * row.value / max}%` }} />
      </div>
    </li>)}
  </ul>;
}

export function FinalsView() {
  const [result, setResult] = useState<FinalsResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestMs, setRequestMs] = useState(0);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const started = performance.now();
      const response = await fetch('/api/finals', { signal });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Finals analysis failed.');
      setRequestMs(performance.now() - started);
      setResult(body);
    } catch (caught) {
      if (!signal?.aborted) setError(caught instanceof Error ? caught.message : 'Finals analysis failed.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const before = result?.before.scenarios;
  const after = result?.after.scenarios;
  const scenarios = before && after && result ? [
    {
      title: 'August 2026 admissions by attending physician',
      before: before.admissions, after: after.admissions,
      explanation: `August admissions increased from ${number.format(total(before.admissions))} to ${number.format(total(after.admissions))}. The leading physician went from ${before.admissions[0]?.label ?? 'unassigned'} (${before.admissions[0]?.value ?? 0}) to ${after.admissions[0]?.label ?? 'unassigned'} (${after.admissions[0]?.value ?? 0}). The August batch concentrates dengue screening, so clinician assignments for those encounters shape the ranking.`,
    },
    {
      title: 'Room 301 usage in May 2026',
      before: before.roomUsage.filter((row, i) => row.value || after.roomUsage[i].value),
      after: after.roomUsage.filter((row, i) => row.value || before.roomUsage[i].value),
      explanation: `Distinct patients increased from ${number.format(result.before.distinctRoomPatients)} to ${number.format(result.after.distinctRoomPatients)}. The synthetic May encounters are concentrated in the first 19 days. Room assignments follow the one-hour capacity model.`,
    },
    {
      title: 'Room 303 staffing',
      before: before.staffing, after: after.staffing,
      explanation: `Distinct staff increased from ${total(before.staffing)} to ${total(after.staffing)} as synthetic visits add new clinician assignments. Headcount counts each clinician once per role.`,
      roster: true,
    },
    {
      title: 'May 2026 services and billed revenue',
      before: before.revenue, after: after.revenue, currency: true,
      explanation: `Revenue increased from ${pesos.format(total(before.revenue))} to ${pesos.format(total(after.revenue))}. The top service by revenue was ${before.revenue[0]?.label ?? 'unavailable'} at midterm and ${after.revenue[0]?.label ?? 'unavailable'} at finals. The May batch emphasizes ECG demand, and synthetic duplicate charges also contribute to billed revenue.`,
    },
  ] : [];
  const mining = result?.mining;

  return <div className="space-y-6">
    <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Warehouse Scale-Up</h1>
          <p className="mt-1 text-sm text-slate-600">Midterm and finals cohorts from live Supabase. Scenario dates use Philippine time.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={loading} onClick={() => void refresh()}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Running analysis…' : 'Run live analysis'}
        </button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {result && <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[[result.before.facts, 'Midterm facts'], [result.batchCount, 'Synthetic additions'], [result.after.facts, 'Finals facts']].map(([value, label]) =>
          <div key={label} className="rounded-xl bg-slate-50 p-3"><div className="text-xl font-bold">{number.format(Number(value))}</div><div className="text-xs text-slate-600">{label}</div></div>)}
      </div>}
      {result && <p className="mt-4 text-xs text-slate-600">
        Latest run took {requestMs.toFixed(0)} ms through browser JSON parsing. The full warehouse read took {result.readMs.toFixed(1)} ms.
        In-memory scenario aggregation took {result.before.analysisMs.toFixed(1)} ms for midterm and {result.after.analysisMs.toFixed(1)} ms for finals.
      </p>}
    </section>
    {scenarios.map(scenario => {
      const max = Math.max(1, ...[...scenario.before, ...scenario.after].map(row => row.value));
      return <section key={scenario.title} className={panel} data-scenario>
        <h2 className="mb-4 text-lg font-bold text-slate-900">{scenario.title}</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {([['Midterm', scenario.before], ['Finals', scenario.after]] as const).map(([label, rows]) =>
            <div key={label} className="min-w-0">
              <h3 className="mb-3 text-sm font-semibold text-emerald-800">{label}</h3>
              <Bars rows={rows} max={max} currency={scenario.currency} />
              {scenario.roster && result && <p className="mt-3 text-xs text-slate-600">
                {(label === 'Midterm' ? result.before.staff : result.after.staff).join(', ')}
              </p>}
            </div>)}
        </div>
        <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-700">{scenario.explanation}</p>
      </section>;
    })}
    {mining && <section className={panel} data-mining>
      <h2 className="text-lg font-bold text-slate-900">Billing anomaly detection</h2>
      <p className="mt-2 text-sm text-slate-700">Different services have different price ranges. The model joins admissions to bills and flags a financial charge above its service’s third quartile plus 1.5 times its interquartile range. It fits on one third of the synthetic batch and evaluates on the remaining synthetic rows using injected duplicate-charge labels. Services with fewer than 20 fitting examples and missing or invalid charges are excluded.</p>
      <dl className="my-4 grid gap-2 sm:grid-cols-3">
        {[
          ['Precision', percent(mining.precision)], ['Recall', percent(mining.recall)], ['F1', percent(mining.f1)],
          ['Amounts scored', number.format(mining.scored)], ['Charges flagged', number.format(mining.flagged)], ['Excluded', number.format(mining.skipped)],
        ].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-600">{label}</dt><dd className="font-mono font-semibold">{value}</dd></div>)}
      </dl>
      <p className="mb-3 text-xs text-slate-600">Holdout counts were {mining.tp} true positives, {mining.fp} false positives, {mining.fn} false negatives, and {mining.tn} true negatives.</p>
      <h3 className="mb-2 text-sm font-semibold">Largest charges above the service threshold</h3>
      <Bars rows={mining.alerts.map(alert => ({
        label: `#${alert.recordID} · ${alert.service} · limit ${pesos.format(alert.fence)}`,
        value: alert.cost,
      }))} max={Math.max(1, ...mining.alerts.map(alert => alert.cost))} currency />
      <p className="mt-4 text-sm text-slate-700">Prioritize unusually large charges for reconciliation against invoices and procedure codes. Review service tariffs with recurring flags, and validate thresholds against audited cases before using them in a billing workflow.</p>
    </section>}
  </div>;
}
