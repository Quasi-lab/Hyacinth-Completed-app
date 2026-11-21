import React from 'react';
import {
  Building2,
  HelpCircle,
  Users2,
  Stethoscope,
  HeartPulse,
  TrendingUp,
  MapPin,
  Clock,
  Target,
  Cpu,
  ShieldCheck,
  Award,
} from 'lucide-react';

export const OverviewHero: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Main Hero Card: Introduction */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-emerald-100/80 dark:border-emerald-500/20 shadow-xs relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-100/40 dark:from-emerald-500/10 via-teal-50/20 dark:via-teal-500/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-4xl">
          {/* Header Tagline */}
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 tracking-wider uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Executive Operational Briefing · Clinical Intelligence Architecture</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Hyacinth Clinic Operations & Financial Analytics
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Welcome to the centralized management ecosystem for <strong>Hyacinth Clinic</strong>. This real-time platform
            unifies the clinic's transactional fact admissions with multidimensional clinical registries—integrating
            patient demographics, physician specialties, nursing ward allocations, room bed capacities, and itemized billing
            ledgers into actionable operational intelligence.
          </p>

          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            By transforming raw healthcare records into live visual metrics, Hyacinth Clinic ensures patient-centered care delivery,
            transparent billing governance, optimized ward throughput, and long-term fiscal resilience.
          </p>
        </div>
      </div>

      {/* The 5W's and H Analytical Framework */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-emerald-100/80 dark:border-emerald-500/20 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-emerald-50 dark:border-emerald-500/10 mb-6">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">The 5W's and H Framework</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">System architecture, purpose, operational timeline, and execution methodology</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* WHO */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100/60 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
                <Users2 className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Who Is Involved</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Medical directors, attending physicians across 8 clinical specialties, supervising ward nurses, financial
              controllers, and clinic admissions coordinators orchestrating inpatient and outpatient journeys.
            </p>
          </div>

          {/* WHAT */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-100/60 dark:bg-teal-500/15 text-teal-800 dark:text-teal-400 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">What It Delivers</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              A comprehensive relational star-schema warehouse (<code className="text-emerald-700 dark:text-emerald-400 font-mono">PatientRecords</code> fact table
              joined with 5 dimensional tables) paired with live financial cost timelines, doctor caseload metrics, and affliction distributions.
            </p>
          </div>

          {/* WHERE */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-100/60 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-400 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Where It Operates</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Implemented across Hyacinth Clinic's specialized departments: ICU Suites, Standard Patient Rooms, Semi-Private
              facilities, General Wards, emergency triage stations, and central billing administration.
            </p>
          </div>

          {/* WHEN */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100/60 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-400 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">When It Updates</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Operates in real time with continuous Supabase REST polling, configurable automatic refresh intervals
              (15s, 30s, 60s, or manual sync), and instant updates upon logging clinical admissions.
            </p>
          </div>

          {/* WHY */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100/60 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 flex items-center justify-center">
                <Target className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Why It Matters</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Modern clinics struggle with isolated billing records and bottlenecked bed allocations. This dashboard bridges
              financial metrics with clinical workflow, preventing physician burnout and eliminating revenue leakage.
            </p>
          </div>

          {/* HOW */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100/60 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">How It Functions</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Powered by a full-stack React SPA running on Express with direct Supabase REST endpoints, client-side
              <code className="text-emerald-700 dark:text-emerald-400 font-mono">@supabase/supabase-js</code> integration, and interactive custom SVG charts.
            </p>
          </div>
        </div>
      </div>

      {/* Stakeholders & Key Beneficiaries */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-emerald-100/80 dark:border-emerald-500/20 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-emerald-50 dark:border-emerald-500/10 mb-6">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Key Beneficiaries & Impact</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Measurable value delivered to patients, medical staff, and executive leadership</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Beneficiary 1: Patients & Families */}
          <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-gradient-to-b from-white dark:from-slate-900 to-slate-50/50 dark:to-slate-900/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-2">
              <HeartPulse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Patients & Families</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Transparent, itemized billing statements with zero surprise charges, reduced intake wait times, and verified bed availability.
            </p>
          </div>

          {/* Beneficiary 2: Attending Physicians */}
          <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-gradient-to-b from-white dark:from-slate-900 to-slate-50/50 dark:to-slate-900/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-400 uppercase tracking-wider mb-2">
              <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Attending Physicians</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Real-time caseload monitoring, specialty volume analytics, and streamlined handoffs between doctors and supervising nurses.
            </p>
          </div>

          {/* Beneficiary 3: Nursing & Care Teams */}
          <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-gradient-to-b from-white dark:from-slate-900 to-slate-50/50 dark:to-slate-900/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-800 dark:text-cyan-400 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Ward & Nursing Teams</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Instant visibility into room class occupancy, active patient distributions, and automated clinical area assignments.
            </p>
          </div>

          {/* Beneficiary 4: Executive Leadership & Finance */}
          <div className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-gradient-to-b from-white dark:from-slate-900 to-slate-50/50 dark:to-slate-900/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider mb-2">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Executive & Finance</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Live fiscal metrics (Total Gross Revenue, Average Visit Cost, Bed Utilization) with historical trend modeling to optimize hospital budgeting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
