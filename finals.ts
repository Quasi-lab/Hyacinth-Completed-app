type Fact = {
  recordID: number;
  admission: string | null;
  patientID: number;
  doctorID: number;
  nurseID: number;
  roomID: number;
  billID: number;
};
type Bill = { billID: number; purchasedAt: string | null; productName: string | null; financialCost: number | string | null; details: string | null };
type Person = { firstName: string | null; lastName: string | null };
type Warehouse = {
  patientRecords: Fact[];
  bills: Bill[];
  doctors: (Person & { doctorID: number })[];
  nurses: (Person & { nurseID: number })[];
  rooms: { roomId: number }[];
  patients: { patientID: number }[];
};

// Reserved primary keys from the Finals ETL in commit 18adf9b.
export const isFinalsBatch = (id: number) => id >= -5000 && id <= -1;
// The initial Finals implementation documented the original baseline range.
const isMidterm = (id: number) => id >= 1 && id <= 1504;
const manilaCalendar = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
});
export function manilaDate(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parts = manilaCalendar.formatToParts(new Date(value));
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
}
const monthOf = (date: string | null) => manilaDate(date).slice(0, 7);
const money = (value: number) => Math.round(value * 100) / 100;
const nameOf = (person: Person) => [person.firstName, person.lastName].filter(Boolean).join(' ');
const charge = (bill?: Bill) => bill?.financialCost == null || bill.financialCost === ''
  ? NaN : Number(bill.financialCost);

function rank<T extends { label: string; value: number }>(rows: T[]) {
  return rows.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function quantile(sorted: number[], fraction: number) {
  const index = (sorted.length - 1) * fraction;
  const lower = Math.floor(index);
  return sorted[lower] + (sorted[Math.ceil(index)] - sorted[lower]) * (index - lower);
}

export function analyzeFinals(warehouse: Warehouse, readMs: number) {
  const { patientRecords, bills, doctors, nurses } = warehouse;
  const billMap = new Map(bills.map(bill => [bill.billID, bill]));
  const doctorMap = new Map(doctors.map(doctor => [doctor.doctorID, nameOf(doctor)]));
  const nurseMap = new Map(nurses.map(nurse => [nurse.nurseID, nameOf(nurse)]));

  function summarize(facts: Fact[]) {
    const started = performance.now();
    const admissions = new Map<number, number>();
    const roomDays = new Map<string, number>();
    const roomPatients = new Set<number>();
    const roomDoctors = new Set<number>();
    const roomNurses = new Set<number>();
    const services = new Map<string, { value: number; count: number }>();
    const cohortBillIds = new Set(facts.map(fact => fact.billID));
    for (const fact of facts) {
      const date = manilaDate(fact.admission);
      const month = date.slice(0, 7);
      if (month === '2026-08') {
        admissions.set(fact.doctorID, (admissions.get(fact.doctorID) ?? 0) + 1);
      }
      if (fact.roomID === 303) {
        if (doctorMap.has(fact.doctorID)) roomDoctors.add(fact.doctorID);
        if (nurseMap.has(fact.nurseID)) roomNurses.add(fact.nurseID);
      }
      if (month !== '2026-05') continue;
      if (fact.roomID === 301 && fact.admission) {
        roomPatients.add(fact.patientID);
        const day = date.slice(8);
        roomDays.set(day, (roomDays.get(day) ?? 0) + 1);
      }
    }
    for (const id of cohortBillIds) {
      const bill = billMap.get(id);
      if (!bill || monthOf(bill.purchasedAt) !== '2026-05') continue;
      const cost = charge(bill);
      if (!Number.isFinite(cost)) continue;
      const label = bill.productName?.trim() || 'Unspecified service';
      const previous = services.get(label) ?? { value: 0, count: 0 };
      services.set(label, { value: previous.value + cost, count: previous.count + 1 });
    }
    const scenarios = {
      admissions: rank(Array.from(admissions, ([id, value]) => ({ label: doctorMap.get(id) || `Doctor ${id}`, value }))),
      roomUsage: Array.from({ length: 31 }, (_, index) => {
        const day = String(index + 1).padStart(2, '0');
        return { label: `May ${day}`, value: roomDays.get(day) ?? 0 };
      }),
      staffing: [{ label: 'Doctors', value: roomDoctors.size }, { label: 'Nurses', value: roomNurses.size }],
      revenue: rank(Array.from(services, ([label, entry]) => ({ label, value: money(entry.value), count: entry.count }))),
    };
    return {
      facts: facts.length, scenarios, distinctRoomPatients: roomPatients.size,
      staff: [
        ...Array.from(roomDoctors, id => `Dr. ${doctorMap.get(id)}`),
        ...Array.from(roomNurses, id => nurseMap.get(id) ?? ''),
      ].sort(),
      analysisMs: performance.now() - started,
    };
  }

  const baseline = patientRecords.filter(fact => isMidterm(fact.recordID));
  const before = summarize(baseline);
  const batch = patientRecords.filter(fact => isFinalsBatch(fact.recordID));
  const after = summarize([...baseline, ...batch]);
  const patientIds = new Set(warehouse.patients.map(patient => patient.patientID));
  const roomIds = new Set(warehouse.rooms.map(room => room.roomId));
  const missingReferences = patientRecords.filter(fact =>
    !patientIds.has(fact.patientID) || !roomIds.has(fact.roomID) ||
    !billMap.has(fact.billID) || !doctorMap.has(fact.doctorID) || !nurseMap.has(fact.nurseID)
  ).length;
  const duplicateIds = patientRecords.length - new Set(patientRecords.map(fact => fact.recordID)).size;
  const training = new Map<string, number[]>();
  for (const fact of batch) {
    if (fact.recordID % 3 !== 0) continue;
    const bill = billMap.get(fact.billID);
    const cost = charge(bill);
    if (!bill?.productName || !Number.isFinite(cost) || cost < 0) continue;
    const group = training.get(bill.productName) ?? [];
    group.push(cost);
    training.set(bill.productName, group);
  }

  const fences = new Map<string, number>();
  for (const [service, costs] of training) {
    if (costs.length < 20) continue;
    costs.sort((a, b) => a - b);
    const q1 = quantile(costs, .25);
    const q3 = quantile(costs, .75);
    fences.set(service, q3 + 1.5 * (q3 - q1));
  }

  let tp = 0, fp = 0, fn = 0, tn = 0, scored = 0, skipped = 0;
  const alerts: { recordID: number; service: string; cost: number; fence: number }[] = [];
  for (const fact of patientRecords) {
    const bill = billMap.get(fact.billID);
    const cost = charge(bill);
    const service = bill?.productName;
    const fence = service ? fences.get(service) : undefined;
    if (!service || fence === undefined || !Number.isFinite(cost) || cost < 0) {
      skipped++;
      continue;
    }
    scored++;
    const flagged = cost > fence;
    if (flagged) alerts.push({ recordID: fact.recordID, service, cost, fence: money(fence) });
    if (!isFinalsBatch(fact.recordID) || fact.recordID % 3 === 0) continue;
    const labeled = bill.details === 'Synthetic duplicate-charge test';
    if (labeled && flagged) tp++;
    else if (labeled) fn++;
    else if (flagged) fp++;
    else tn++;
  }
  const precision = tp + fp ? tp / (tp + fp) : null;
  const recall = tp + fn ? tp / (tp + fn) : null;
  const f1 = 2 * tp + fp + fn ? 2 * tp / (2 * tp + fp + fn) : null;
  return {
    before, after, batchCount: batch.length, readMs,
    totalFacts: patientRecords.length,
    otherFacts: patientRecords.length - after.facts,
    growth: baseline.length ? batch.length / baseline.length : null,
    integrity: { missingReferences, duplicateIds },
    synchronizedAt: new Date().toISOString(),
    mining: {
      scored, skipped, flagged: alerts.length, tp, fp, fn, tn, precision, recall, f1,
      alerts: alerts.sort((a, b) => (b.cost - b.fence) - (a.cost - a.fence)).slice(0, 12),
    },
  };
}

export type FinalsResult = ReturnType<typeof analyzeFinals>;
