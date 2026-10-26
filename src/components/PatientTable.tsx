import React, { useState, useMemo } from 'react';
import { JoinedPatientRecord } from '../types/database';
import { Search, ChevronLeft, ChevronRight, Eye, Filter, ArrowUpDown } from 'lucide-react';

interface Props {
  records: JoinedPatientRecord[];
  selectedDoctorId: number | null;
  selectedAffliction: string | null;
  onSelectRecord: (record: JoinedPatientRecord) => void;
  onClearFilters: () => void;
}

export const PatientTable: React.FC<Props> = ({
  records,
  selectedDoctorId,
  selectedAffliction,
  onSelectRecord,
  onClearFilters,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter records
  const filtered = useMemo(() => {
    return records.filter(rec => {
      // Doctor filter
      if (selectedDoctorId !== null && rec.doctor?.doctorID !== selectedDoctorId) {
        return false;
      }

      // Affliction filter
      if (selectedAffliction !== null && rec.bill?.affliction !== selectedAffliction) {
        return false;
      }

      // Room class filter
      if (roomFilter !== 'ALL' && rec.room?.roomClass !== roomFilter) {
        return false;
      }

      // Search query (matches patient name, doctor name, procedure, or record ID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pName = rec.patient?.fullName?.toLowerCase() || '';
        const dName = rec.doctor?.fullName?.toLowerCase() || '';
        const bProd = rec.bill?.productName?.toLowerCase() || '';
        const recId = String(rec.recordID);
        if (!pName.includes(q) && !dName.includes(q) && !bProd.includes(q) && !recId.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [records, selectedDoctorId, selectedAffliction, roomFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  // Reset to page 1 if filtered changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roomFilter, selectedDoctorId, selectedAffliction]);

  const hasActiveFilters = selectedDoctorId !== null || selectedAffliction !== null || roomFilter !== 'ALL' || searchQuery !== '';

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-sm border border-emerald-100/70">
      {/* Title & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-50">
        <div>
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">Patient Records & Billing Ledger</h3>
          <p className="text-xs text-slate-500">Live joined star-schema fact records with dimensional details</p>
        </div>

        {/* Search & Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, doctor, bill..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-52 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Room Class Filter */}
          <select
            value={roomFilter}
            onChange={e => setRoomFilter(e.target.value)}
            aria-label="Filter by room class"
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Rooms</option>
            <option value="Standard">Standard</option>
            <option value="ICU Suite">ICU Suite</option>
            <option value="Semi-Private">Semi-Private</option>
            <option value="General Ward">General Ward</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs px-2.5 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <th className="py-2.5 px-3">Rec #</th>
              <th className="py-2.5 px-3">Admission</th>
              <th className="py-2.5 px-3">Patient</th>
              <th className="py-2.5 px-3">Attending Doctor</th>
              <th className="py-2.5 px-3">Room</th>
              <th className="py-2.5 px-3">Procedure / Affliction</th>
              <th className="py-2.5 px-3 text-right">Cost</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                  No matching admission records found.
                </td>
              </tr>
            ) : (
              paginatedRecords.map(rec => {
                const dateStr = rec.admission ? rec.admission.slice(0, 10) : '—';
                const cost = rec.bill?.financialCost || 0;

                return (
                  <tr
                    key={rec.recordID}
                    onClick={() => onSelectRecord(rec)}
                    className="hover:bg-emerald-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-500 tabular-nums">#{rec.recordID}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 tabular-nums">{dateStr}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{rec.patient?.fullName || 'Anonymous'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {rec.patient?.patientID}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800">{rec.doctor?.fullName || 'Unassigned'}</div>
                      <div className="text-[10px] text-emerald-700">{rec.doctor?.specialization}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-slate-800 font-medium">#{rec.room?.roomId}</span>
                      <span className="text-slate-400 text-[10px] ml-1">({rec.room?.roomClass})</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800 truncate max-w-[200px]">
                        {rec.bill?.productName || 'Consultation'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                        {rec.bill?.affliction}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      ${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectRecord(rec);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/60 transition-colors inline-flex items-center"
                        title="View Full Itemized Case"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div>
          Showing <span className="font-mono tabular-nums font-semibold text-slate-700">{filtered.length}</span> total
          admissions
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
