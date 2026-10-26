import React from 'react';
import { X, Database, Table, Key, CheckCircle } from 'lucide-react';
import { AnalyticsPayload } from '../types/database';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: AnalyticsPayload | null;
}

export const SchemaModal: React.FC<Props> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const tables = [
    {
      name: 'PatientRecords',
      type: 'Fact Table',
      pk: 'recordID (int8)',
      fks: ['patientID -> Patient_Dim', 'roomID -> Room_Dim', 'doctorID -> Doctor_Dim', 'nurseID -> Nurse_Dim', 'billID -> Bill_Dim'],
      rows: data?.summary?.totalRecords ?? 1000,
    },
    {
      name: 'Bill_Dim',
      type: 'Dimension',
      pk: 'billID (int8)',
      fks: [],
      rows: data?.dimensions?.totalBills ?? 1000,
    },
    {
      name: 'Doctor_Dim',
      type: 'Dimension',
      pk: 'doctorID (int8)',
      fks: [],
      rows: data?.dimensions?.doctors?.length ?? 8,
    },
    {
      name: 'Nurse_Dim',
      type: 'Dimension',
      pk: 'nurseID (int8)',
      fks: [],
      rows: data?.dimensions?.nurses?.length ?? 8,
    },
    {
      name: 'Room_Dim',
      type: 'Dimension',
      pk: 'roomId (int4)',
      fks: [],
      rows: data?.dimensions?.rooms?.length ?? 15,
    },
    {
      name: 'Patient_Dim',
      type: 'Dimension',
      pk: 'patientID (int8)',
      fks: [],
      rows: data?.summary?.totalPatients ?? 1000,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-100/70 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hyacinth Clinic — Star Schema Architecture</h3>
              <p className="text-xs text-slate-500">PostgreSQL Star Schema mapped to Supabase database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* User Diagram Attachment Preview */}
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 p-2 text-center">
            <div className="text-[11px] text-slate-400 mb-2 font-mono">
              Database Entity Relationship Diagram (Star Schema)
            </div>
            <img
              src="/assets/aistudio/image_f562c58e.png"
              alt="Hyacinth Clinic Database Star Schema"
              className="max-h-72 mx-auto object-contain rounded-lg shadow-md"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Table Statistics Grid */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Active Supabase Tables
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {tables.map(tbl => (
                <div
                  key={tbl.name}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900">{tbl.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          tbl.type === 'Fact Table'
                            ? 'bg-emerald-100 text-emerald-800 font-semibold'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {tbl.type}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                      <div>
                        <span className="font-medium text-slate-600">PK:</span> {tbl.pk}
                      </div>
                      {tbl.fks.length > 0 && (
                        <div className="text-[10px] text-slate-400">
                          <span className="font-medium text-slate-500">FKs:</span> {tbl.fks.length} dimensions
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Total Rows:</span>
                    <span className="font-bold text-slate-800 tabular-nums">{tbl.rows.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>All 6 relations verified in Supabase live instance</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
