/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnalyticsPayload, JoinedPatientRecord } from './types/database';
import { Header } from './components/Header';
import { OverviewHero } from './components/OverviewHero';
import { LandingHero } from './components/LandingHero';
import { KpiCards } from './components/KpiCards';
import { FinancialLineChart } from './components/FinancialLineChart';
import { DoctorBarChart } from './components/DoctorBarChart';
import { AfflictionPieChart } from './components/AfflictionPieChart';
import { InstrumentsView } from './components/InstrumentsView';
import { PatientTable } from './components/PatientTable';
import { RecordDetailModal } from './components/RecordDetailModal';
import { NewRecordModal } from './components/NewRecordModal';
import { SchemaModal } from './components/SchemaModal';
import { ClinicChatbot } from './components/ClinicChatbot';
import { ThemeFab } from './components/ThemeFab';
import { Loader2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active navigation tab & filter states
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [selectedAffliction, setSelectedAffliction] = useState<string | null>(null);

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<JoinedPatientRecord | null>(null);
  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Auto-refresh interval (in seconds, 0 = manual)
  const [refreshInterval, setRefreshInterval] = useState<number>(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAnalytics = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      if (!data) setIsLoading(true);
      else setIsRefreshing(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/analytics?refresh=true');
      if (!res.ok) {
        throw new Error(`Failed to load analytics: ${res.status} ${res.statusText}`);
      }
      const json: AnalyticsPayload = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Error communicating with Supabase database.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [data]);

  // Initial load
  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Auto-refresh timer hook
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (refreshInterval > 0) {
      timerRef.current = setInterval(() => {
        fetchAnalytics(true);
      }, refreshInterval * 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refreshInterval, fetchAnalytics]);

  const handleClearFilters = () => {
    setSelectedDoctorId(null);
    setSelectedAffliction(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col selection:bg-emerald-100 dark:selection:bg-emerald-500/15 selection:text-emerald-900 dark:selection:text-emerald-300">
      <LandingHero>
      {/* 3-Zone Header with Supabase telemetry */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onRefresh={() => fetchAnalytics(false)}
        isRefreshing={isRefreshing}
        onOpenNewRecord={() => setIsNewRecordOpen(true)}
        onOpenSchema={() => setIsSchemaModalOpen(true)}
        lastUpdated={data?.timestamp || ''}
        refreshInterval={refreshInterval}
        onChangeInterval={setRefreshInterval}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Loading Skeleton */}
        {isLoading && !data && (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Connecting to Hyacinth Clinic Star Schema...</p>
            <p className="text-xs text-slate-400">Loading PatientRecords, Bill_Dim, Room_Dim, and Physician details</p>
          </div>
        )}

        {/* Error Boundary View */}
        {error && (
          <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <h4 className="font-semibold">Database Sync Error</h4>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">{error}</p>
              <button
                onClick={() => fetchAnalytics(false)}
                className="mt-3 px-3 py-1.5 text-xs font-medium bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Populated Dashboard Experience with Fluid Tab Transitions */}
        {data && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {activeTab === 'instruments' ? (
                <InstrumentsView />
              ) : (
                <>
                  {/* Active Filter Notification Bar (if doctor or disease selected) */}
                  {(selectedDoctorId !== null || selectedAffliction !== null) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-emerald-50/90 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/30 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Active Filter:</span>
                        {selectedDoctorId !== null && (
                          <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30 font-medium">
                            Physician: {data.charts.doctorWorkload.find(d => d.doctorID === selectedDoctorId)?.fullName}
                          </span>
                        )}
                        {selectedAffliction !== null && (
                          <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30 font-medium">
                            Affliction: {selectedAffliction}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={handleClearFilters}
                        className="font-medium underline hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                      >
                        Clear all filters
                      </button>
                    </motion.div>
                  )}

                  {/* 1. Comprehensive Introductory Summary (5Ws and H & Beneficiaries) */}
                  {activeTab === 'overview' && (
                    <section id="briefing" className="space-y-6">
                      <OverviewHero />
                    </section>
                  )}

                  {/* 2. Executive Financial & Capacity KPI Strip */}
                  {(activeTab === 'overview' || activeTab === 'financials') && (
                    <section id="overview" className="space-y-4">
                      <KpiCards summary={data.summary} />
                    </section>
                  )}

                  {/* 3. Graph 1: Financial Costs Timeline Line Graph */}
                  {(activeTab === 'overview' || activeTab === 'financials') && (
                    <section id="financials" className="space-y-4">
                      <FinancialLineChart data={data.charts.timeline} />
                    </section>
                  )}

                  {/* 4. Graphs 2 & 3: Doctor Patient Load Bar Graph & Afflictions Pie Graph */}
                  {(activeTab === 'overview' || activeTab === 'physicians' || activeTab === 'afflictions') && (
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Graph 2: Doctor Patient Caseload Bar Graph */}
                      {(activeTab === 'overview' || activeTab === 'physicians') && (
                        <div id="physicians" className={`${activeTab === 'physicians' ? 'lg:col-span-12' : 'lg:col-span-6'} h-full`}>
                          <DoctorBarChart
                            data={data.charts.doctorWorkload}
                            selectedDoctorId={selectedDoctorId}
                            onSelectDoctor={setSelectedDoctorId}
                          />
                        </div>
                      )}

                      {/* Graph 3: Diseases & Afflictions Pie Graph */}
                      {(activeTab === 'overview' || activeTab === 'afflictions') && (
                        <div id="afflictions" className={`${activeTab === 'afflictions' ? 'lg:col-span-12' : 'lg:col-span-6'} h-full`}>
                          <AfflictionPieChart
                            data={data.charts.diseaseDistribution}
                            selectedAffliction={selectedAffliction}
                            onSelectAffliction={setSelectedAffliction}
                          />
                        </div>
                      )}
                    </section>
                  )}

                  {/* 5. Live Patient Records & Billing Ledger Table */}
                  {(activeTab === 'overview' || activeTab === 'records') && (
                    <section id="records" className="space-y-4">
                      <PatientTable
                        records={data.joinedRecords}
                        selectedDoctorId={selectedDoctorId}
                        selectedAffliction={selectedAffliction}
                        onSelectRecord={setSelectedRecord}
                        onClearFilters={handleClearFilters}
                      />
                    </section>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Hyacinth Clinic</span>
            <span>·</span>
            <span>Live Star-Schema Hospital Analytics</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>PatientRecords Fact · 5 Dimension Tables</span>
            <span>·</span>
            <button
              onClick={() => setIsSchemaModalOpen(true)}
              className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
            >
              View Schema Diagram
            </button>
          </div>
        </div>
      </footer>
      </LandingHero>

      {/* Modals */}
      <RecordDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      {data && (
        <NewRecordModal
          isOpen={isNewRecordOpen}
          onClose={() => setIsNewRecordOpen(false)}
          onSuccess={() => fetchAnalytics(false)}
          doctors={data.dimensions.doctors}
          nurses={data.dimensions.nurses}
          rooms={data.dimensions.rooms}
        />
      )}

      <SchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        data={data}
      />

      {/* Multi-turn Gemini Clinic AI Analyst */}
      <ClinicChatbot />
      <ThemeFab />
    </div>
  );
}
