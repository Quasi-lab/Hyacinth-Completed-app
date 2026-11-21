import React from 'react';
import { JoinedPatientRecord } from '../types/database';
import { X, User, Stethoscope, HeartHandshake, Bed, Receipt, Calendar, FileText } from 'lucide-react';

interface Props {
  record: JoinedPatientRecord | null;
  onClose: () => void;
}

export const RecordDetailModal: React.FC<Props> = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-emerald-100 dark:border-emerald-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-100/70 dark:border-emerald-500/20 bg-gradient-to-r from-emerald-50/80 dark:from-emerald-500/10 to-teal-50/50 dark:to-teal-500/5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-500/15 px-2 py-0.5 rounded">
                Record #{record.recordID}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {record.admission ? new Date(record.admission).toLocaleString() : 'N/A'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              {record.patient?.fullName || 'Patient Case File'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Star Schema Dimension Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Patient Dimension */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Patient_Dim</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient ID:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">#{record.patient?.patientID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{record.patient?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Birth Date:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{record.patient?.birthDate}</span>
                </div>
              </div>
            </div>

            {/* 2. Doctor Dimension */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Doctor_Dim</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Doctor ID:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">#{record.doctor?.doctorID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Physician:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{record.doctor?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Specialization:</span>
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">{record.doctor?.specialization}</span>
                </div>
              </div>
            </div>

            {/* 3. Nurse Dimension */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                <HeartHandshake className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Nurse_Dim</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nurse ID:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">#{record.nurse?.nurseID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Staff Nurse:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{record.nurse?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Area Assigned:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{record.nurse?.areaAssignment}</span>
                </div>
              </div>
            </div>

            {/* 4. Room Dimension */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                <Bed className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Room_Dim</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Room Number:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">Room #{record.room?.roomId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Classification:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{record.room?.roomClass}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Serviceable Beds:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{record.room?.servicableBeds} beds</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Bill Dimension (Highlight Section) */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-500/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                <Receipt className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Bill_Dim & Clinical Charge</span>
              </div>
              <span className="text-xs font-mono text-slate-400">Bill #{record.bill?.billID}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-emerald-100 dark:border-emerald-500/20">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Service / Product:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{record.bill?.productName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-emerald-100 dark:border-emerald-500/20">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Clinical Category:</span>
                <span className="font-semibold text-emerald-800 dark:text-emerald-400">{record.bill?.affliction}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-emerald-100 dark:border-emerald-500/20">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Billed Amount:</span>
                <span className="text-base font-bold font-mono text-emerald-900 dark:text-emerald-300 tabular-nums">
                  ${(record.bill?.financialCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Clinical Procedure Notes:</span>
                <p className="text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20 leading-relaxed text-xs">
                  {record.bill?.details || 'Standard hospital medical services rendered.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200/80 dark:border-slate-700/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
