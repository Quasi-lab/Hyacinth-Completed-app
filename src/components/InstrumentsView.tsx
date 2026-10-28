import React, { useState, useEffect } from 'react';
import { supabase, supabaseUrl } from '../lib/supabase';
import {
  Wrench,
  Plus,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Database,
  Info,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Instrument {
  id?: number | string;
  name: string;
  created_at?: string;
  category?: string;
}

// Default initial clinical equipment for demo fallback
const DEFAULT_CLINICAL_INSTRUMENTS: Instrument[] = [
  { id: 1, name: 'Biphasic Defibrillator (Zoll R Series)', category: 'Emergency Resuscitation' },
  { id: 2, name: 'Multiparameter Cardiac Monitor (Philips IntelliVue)', category: 'Cardiac Monitoring' },
  { id: 3, name: 'High-Resolution Ultrasound Probe (GE Logiq)', category: 'Diagnostic Imaging' },
  { id: 4, name: 'Rigid Video Laparoscope (Storz 10mm)', category: 'Minimally Invasive Surgery' },
  { id: 5, name: 'Volumetric Syringe Infusion Pump (Alaris)', category: 'Intravenous Delivery' },
  { id: 6, name: 'Continuous Pulse Oximeter (Masimo Radical-7)', category: 'Respiratory Telemetry' },
  { id: 7, name: 'Electric Surgical Cautery Unit (Covidien ForceTriad)', category: 'Surgical Electrosurgery' },
  { id: 8, name: 'Non-Invasive Blood Pressure Transducer', category: 'Vital Signs' },
];

export const InstrumentsView: React.FC = () => {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newInstrumentName, setNewInstrumentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  // Quickstart useEffect fetch pattern from Supabase documentation
  const fetchInstruments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: sbError } = await supabase.from('instruments').select('*');

      if (sbError) {
        // Table not created yet or RLS policy required
        console.warn('Supabase instruments table query notice:', sbError.message);
        setError(sbError.message);
        setIsUsingFallback(true);
        // Load default instruments so the UI is immediately interactive
        setInstruments(DEFAULT_CLINICAL_INSTRUMENTS);
      } else if (data && data.length > 0) {
        setInstruments(data);
        setIsUsingFallback(false);
      } else {
        // Empty table
        setInstruments([]);
        setIsUsingFallback(false);
      }
    } catch (err: any) {
      console.error('Instruments fetch error:', err);
      setError(err.message || 'Failed to fetch instruments from Supabase');
      setIsUsingFallback(true);
      setInstruments(DEFAULT_CLINICAL_INSTRUMENTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstruments();
  }, []);

  const handleAddInstrument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstrumentName.trim()) return;

    setIsSubmitting(true);
    try {
      if (!isUsingFallback) {
        const { data, error: insertError } = await supabase
          .from('instruments')
          .insert([{ name: newInstrumentName.trim() }])
          .select();

        if (insertError) throw insertError;

        if (data && data.length > 0) {
          setInstruments(prev => [...prev, ...data]);
        } else {
          fetchInstruments();
        }
      } else {
        // Local state append when demo fallback is active
        const newEntry: Instrument = {
          id: Date.now(),
          name: newInstrumentName.trim(),
          category: 'Clinical Medical Asset',
        };
        setInstruments(prev => [newEntry, ...prev]);
      }
      setNewInstrumentName('');
    } catch (err: any) {
      alert(`Error inserting instrument: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sqlSnippet = `-- 1. Create the instruments table
create table instruments (
  id bigint primary key generated always as identity,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table instruments enable row level security;

-- 3. Allow anonymous reads & inserts for the quickstart app
create policy "Public read instruments" 
  on public.instruments for select 
  to anon 
  using (true);

create policy "Public insert instruments" 
  on public.instruments for insert 
  to anon 
  with check (true);

-- 4. Seed initial clinical instrument rows
insert into instruments (name)
values
  ('Defibrillator (Zoll R Series)'),
  ('Cardiac Telemetry Monitor'),
  ('Ultrasound Scanner Probe'),
  ('Laparoscopic Tower'),
  ('Volumetric Infusion Pump'),
  ('Pulse Oximeter Transducer');`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="glass-panel rounded-2xl p-6 shadow-sm border border-emerald-100/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Clinical Instruments & Equipment
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                  Supabase Quickstart
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Client-side queries executed via <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-emerald-800">@supabase/supabase-js</code> inside <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-emerald-800">useEffect</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showSqlGuide ? 'Hide SQL Script' : 'Supabase SQL Guide'}</span>
            </button>

            <button
              onClick={fetchInstruments}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1.5 border border-emerald-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Connection Status Pill Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Target Project:</span>
            <span className="font-mono text-slate-800 font-medium truncate max-w-xs">{supabaseUrl}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Table:</span>
            <span className="font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              public.instruments
            </span>
            {isUsingFallback && (
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                Preview Mode (Run SQL to connect live)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SQL Snippet Collapsible Card */}
      <AnimatePresence>
        {showSqlGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="glass-panel rounded-2xl p-5 border border-emerald-200 bg-white/90 shadow-sm relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Run this in Supabase SQL Editor
                  </h4>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 text-xs font-medium text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied SQL!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Open your Supabase project dashboard at{' '}
                <a
                  href="https://supabase.com/dashboard/project/cpgomiuqhuwyrzzcozcu/sql"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 font-medium underline inline-flex items-center gap-0.5"
                >
                  Supabase SQL Editor <ExternalLink className="w-3 h-3" />
                </a>{' '}
                and execute this query to create and enable read/write permissions for the instruments table:
              </p>

              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {sqlSnippet}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add New Instrument Card */}
      <div className="glass-panel rounded-2xl p-5 border border-emerald-100/70 shadow-xs">
        <form onSubmit={handleAddInstrument} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="e.g. Digital Otoscope, Syringe Infusion Pump, ECG Leads..."
              value={newInstrumentName}
              onChange={e => setNewInstrumentName(e.target.value)}
              className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newInstrumentName.trim()}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Instrument</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Instruments Grid & List */}
      <div className="glass-panel rounded-2xl p-6 shadow-sm border border-emerald-100/70">
        <div className="flex items-center justify-between pb-4 border-b border-emerald-50 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              Registered Hospital Instruments
            </h3>
            <p className="text-xs text-slate-500">
              Fetched from <code className="font-mono text-emerald-700">supabase.from('instruments').select()</code>
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
            {instruments.length} items
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            <span className="text-xs text-slate-500">Fetching instruments from Supabase...</span>
          </div>
        ) : instruments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No instruments found. Add your first clinical instrument above or run the SQL script in Supabase!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {instruments.map((inst, idx) => (
              <motion.div
                key={inst.id ?? idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-white/70 hover:border-emerald-300 hover:shadow-xs transition-all flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-xs text-slate-900 truncate">{inst.name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="font-mono">ID: #{inst.id ?? idx + 1}</span>
                    {inst.category && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-700 truncate">{inst.category}</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
