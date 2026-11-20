import React, { useState } from 'react';
import { X, Plus, Loader2, Check } from 'lucide-react';
import { DoctorDim, NurseDim, RoomDim } from '../types/database';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  doctors: DoctorDim[];
  nurses: NurseDim[];
  rooms: RoomDim[];
}

export const NewRecordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  doctors,
  nurses,
  rooms,
}) => {
  const [patientName, setPatientName] = useState('Elena Rostova');
  const [birthDate, setBirthDate] = useState('1994-06-20');
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(doctors[0]?.doctorID || 101);
  const [selectedNurseId, setSelectedNurseId] = useState<number>(nurses[0]?.nurseID || 3001);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(rooms[0]?.roomId || 301);
  const [productName, setProductName] = useState('Cardiovascular Stress ECG');
  const [cost, setCost] = useState('1850.00');
  const [details, setDetails] = useState('Comprehensive inpatient stress ECG evaluation and continuous cardiac telemetry.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/seed-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          birthDate,
          doctorID: selectedDoctorId,
          nurseID: selectedNurseId,
          roomID: selectedRoomId,
          productName,
          cost,
          details,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit admission record');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-emerald-100 dark:border-emerald-500/20 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-100/70 dark:border-emerald-500/20 bg-gradient-to-r from-emerald-50 dark:from-emerald-500/10 to-teal-50 dark:to-teal-500/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Log New Clinical Admission</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Insert record into live Supabase star-schema tables</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30">
              {error}
            </div>
          )}

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Patient Full Name</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Doctor & Nurse Assignment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Attending Physician</label>
              <select
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 truncate"
              >
                {doctors.map(d => (
                  <option key={d.doctorID} value={d.doctorID}>
                    Dr. {d.firstName} {d.lastName} ({d.medicalSpecialization})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Supervising Nurse</label>
              <select
                value={selectedNurseId}
                onChange={e => setSelectedNurseId(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 truncate"
              >
                {nurses.map(n => (
                  <option key={n.nurseID} value={n.nurseID}>
                    {n.firstName} {n.lastName} ({n.areaAssignment})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Room Selection */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Room Assignment</label>
            <select
              value={selectedRoomId}
              onChange={e => setSelectedRoomId(Number(e.target.value))}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
            >
              {rooms.map(r => (
                <option key={r.roomId} value={r.roomId}>
                  Room #{r.roomId} — {r.roomClass} ({r.servicableBeds} beds, {r.currentAvailability ? 'Available' : 'Occupied'})
                </option>
              ))}
            </select>
          </div>

          {/* Bill Service & Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Procedure / Service Name</label>
              <input
                type="text"
                required
                value={productName}
                onChange={e => setProductName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Financial Cost ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={cost}
                onChange={e => setCost(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Clinical Procedure Notes</label>
            <textarea
              rows={2}
              value={details}
              onChange={e => setDetails(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors font-medium flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Writing to Supabase...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Save Admission
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
