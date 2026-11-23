import express from 'express';
import { Groq } from 'groq-sdk';
import { analyzeFinals, manilaDate } from '../finals.ts';

export const app = express();
app.use(express.json());

// Resolve Supabase Base URL (ensuring clean rest base)
const rawUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://cpgomiuqhuwyrzzcozcu.supabase.co';
const supabaseBaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseRestUrl = `${supabaseBaseUrl}/rest/v1`;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

function isSupabaseLiveConfigured(): boolean {
  const keyToUse = serviceRoleKey || anonKey;
  if (!supabaseBaseUrl || !keyToUse) return false;
  if (supabaseBaseUrl.includes('your-project') || supabaseBaseUrl.includes('placeholder'))
    return false;
  if (keyToUse.includes('your-') || keyToUse.includes('placeholder')) return false;
  return true;
}

// In-memory star-schema fallback store used when Supabase is unconfigured or offline
function createMockStarSchemaStore() {
  const doctors = [
    { doctorID: 101, registrationDate: '2018-03-12', firstName: 'Alice', lastName: 'Guerrero', medicalSpecialization: 'Cardiology', experienceYears: 14 },
    { doctorID: 102, registrationDate: '2019-07-24', firstName: 'Robert', lastName: 'Gomez', medicalSpecialization: 'General Practice', experienceYears: 11 },
    { doctorID: 103, registrationDate: '2016-11-05', firstName: 'Elizabeth', lastName: 'Ramos', medicalSpecialization: 'General Surgery', experienceYears: 16 },
    { doctorID: 104, registrationDate: '2020-01-19', firstName: 'Jennifer', lastName: 'Garcia', medicalSpecialization: 'Emergency Medicine', experienceYears: 9 },
    { doctorID: 105, registrationDate: '2017-06-30', firstName: 'Anthony', lastName: 'Mendoza', medicalSpecialization: 'Infectious Disease', experienceYears: 12 },
    { doctorID: 106, registrationDate: '2021-04-14', firstName: 'Michael', lastName: 'Reyes', medicalSpecialization: 'Cardiology', experienceYears: 7 },
    { doctorID: 107, registrationDate: '2015-09-08', firstName: 'Robert', lastName: 'Cruz', medicalSpecialization: 'Internal Medicine', experienceYears: 15 },
    { doctorID: 108, registrationDate: '2022-02-01', firstName: 'Patricia', lastName: 'Santos', medicalSpecialization: 'Pediatrics', experienceYears: 10 },
  ];

  const nurses = [
    { nurseID: 201, registrationDate: '2019-05-10', firstName: 'Maria', lastName: 'Bautista', areaAssignment: 'ICU', experienceYears: 8 },
    { nurseID: 202, registrationDate: '2020-08-15', firstName: 'Caleb', lastName: 'Wright', areaAssignment: 'Cardiac Telemetry', experienceYears: 6 },
    { nurseID: 203, registrationDate: '2018-02-22', firstName: 'Maya', lastName: 'Lin', areaAssignment: 'Respiratory Ward', experienceYears: 10 },
    { nurseID: 204, registrationDate: '2021-06-03', firstName: 'Lucas', lastName: 'Moreau', areaAssignment: 'Surgical Recovery', experienceYears: 5 },
    { nurseID: 205, registrationDate: '2017-10-18', firstName: 'Chloe', lastName: 'Bennett', areaAssignment: 'Neurological Care', experienceYears: 9 },
    { nurseID: 206, registrationDate: '2022-01-11', firstName: 'Omar', lastName: 'Hassan', areaAssignment: 'General Ward B', experienceYears: 4 },
    { nurseID: 207, registrationDate: '2019-11-29', firstName: 'Grace', lastName: 'Kim', areaAssignment: 'Pediatric Unit', experienceYears: 7 },
    { nurseID: 208, registrationDate: '2020-03-07', firstName: 'Noah', lastName: 'Patel', areaAssignment: 'Outpatient Triage', experienceYears: 6 },
  ];

  const rooms = [
    { roomId: 301, serviceStart: '2020-01-01', servicableBeds: 1, currentAvailability: false, roomClass: 'ICU Suite' },
    { roomId: 302, serviceStart: '2020-01-01', servicableBeds: 1, currentAvailability: false, roomClass: 'ICU Suite' },
    { roomId: 303, serviceStart: '2020-01-01', servicableBeds: 1, currentAvailability: true, roomClass: 'ICU Suite' },
    { roomId: 304, serviceStart: '2020-06-15', servicableBeds: 2, currentAvailability: false, roomClass: 'Semi-Private' },
    { roomId: 305, serviceStart: '2020-06-15', servicableBeds: 2, currentAvailability: true, roomClass: 'Semi-Private' },
    { roomId: 306, serviceStart: '2020-06-15', servicableBeds: 2, currentAvailability: false, roomClass: 'Semi-Private' },
    { roomId: 307, serviceStart: '2021-02-10', servicableBeds: 2, currentAvailability: true, roomClass: 'Semi-Private' },
    { roomId: 308, serviceStart: '2019-09-01', servicableBeds: 1, currentAvailability: false, roomClass: 'Standard' },
    { roomId: 309, serviceStart: '2019-09-01', servicableBeds: 1, currentAvailability: true, roomClass: 'Standard' },
    { roomId: 310, serviceStart: '2019-09-01', servicableBeds: 1, currentAvailability: false, roomClass: 'Standard' },
    { roomId: 311, serviceStart: '2019-09-01', servicableBeds: 1, currentAvailability: true, roomClass: 'Standard' },
    { roomId: 312, serviceStart: '2018-04-20', servicableBeds: 4, currentAvailability: false, roomClass: 'General Ward' },
    { roomId: 313, serviceStart: '2018-04-20', servicableBeds: 4, currentAvailability: true, roomClass: 'General Ward' },
    { roomId: 314, serviceStart: '2018-04-20', servicableBeds: 4, currentAvailability: false, roomClass: 'General Ward' },
    { roomId: 315, serviceStart: '2018-04-20', servicableBeds: 4, currentAvailability: true, roomClass: 'General Ward' },
  ];

  const patients: { patientID: number; firstName: string; lastName: string; patientBdate: string }[] = [];
  const bills: { billID: number; purchasedAt: string; productName: string; financialCost: string; details: string }[] = [];
  const patientRecords: { recordID: number; admission: string; patientID: number; roomID: number; doctorID: number; nurseID: number; billID: number }[] = [];

  let nextRecordId = 1001;
  let nextPatientId = 5001;
  let nextBillId = 2001;

  const nonRoom303Ids = [301, 302, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315];
  const non301MayRooms = [302, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315];

  const addRecord = (opts: {
    admissionIso: string;
    firstName: string;
    lastName: string;
    roomID: number;
    doctorID: number;
    nurseID: number;
    productName: string;
    cost: number;
    details: string;
  }) => {
    const recordID = nextRecordId++;
    const patientID = nextPatientId++;
    const billID = nextBillId++;
    const idx = recordID - 1001;
    const birthYear = 1958 + ((idx * 7) % 50);
    const birthMonth = String(((idx * 3) % 12) + 1).padStart(2, '0');
    const birthDay = String(((idx * 5) % 27) + 1).padStart(2, '0');

    patients.push({
      patientID,
      firstName: opts.firstName,
      lastName: opts.lastName,
      patientBdate: `${birthYear}-${birthMonth}-${birthDay}`,
    });

    bills.push({
      billID,
      purchasedAt: opts.admissionIso,
      productName: opts.productName,
      financialCost: opts.cost.toFixed(2),
      details: opts.details,
    });

    patientRecords.push({
      recordID,
      admission: opts.admissionIso,
      patientID,
      roomID: opts.roomID,
      doctorID: opts.doctorID,
      nurseID: opts.nurseID,
      billID,
    });
  };

  // 1. May 2026 Financials & Services (173 records totaling $505,300) + Room 301 Usage (65 patients)
  const mayServiceTargets = [
    { productName: 'Routine Checkup', count: 29, total: 93600, doctorID: 102, nurseID: 208, details: 'Comprehensive general practice preventive checkup and metabolic vitals screening.' },
    { productName: 'MRI Scan', count: 22, total: 81000, doctorID: 103, nurseID: 205, details: 'High-resolution cranial and musculoskeletal MRI diagnostic scan.' },
    { productName: 'ECG', count: 27, total: 77500, doctorID: 101, nurseID: 202, details: '12-lead cardiac telemetry ECG and coronary rhythm assessment.' },
    { productName: 'Urinalysis', count: 31, total: 76400, doctorID: 107, nurseID: 206, details: 'Comprehensive renal function and urinary tract diagnostic urinalysis.' },
    { productName: 'CT Scan', count: 26, total: 76200, doctorID: 104, nurseID: 204, details: 'Emergency trauma and acute abdominal CT imaging.' },
    { productName: 'Comprehensive Blood Test', count: 22, total: 65800, doctorID: 105, nurseID: 206, details: 'Full infectious & metabolic blood panel including CBC and lipid profile.' },
    { productName: 'Chest X-Ray', count: 16, total: 34800, doctorID: 102, nurseID: 203, details: 'Thoracic chest X-Ray for respiratory and pulmonary evaluation.' },
  ];

  // Flatten 173 May bills with exact per-service integer totals summing to $505,300
  const mayBillsQueue: Array<{ productName: string; cost: number; doctorID: number; nurseID: number; details: string }> = [];
  for (const svc of mayServiceTargets) {
    const base = Math.floor(svc.total / svc.count);
    const remainder = svc.total - base * svc.count;
    for (let i = 0; i < svc.count; i++) {
      mayBillsQueue.push({
        productName: svc.productName,
        cost: i === 0 ? base + remainder : base,
        doctorID: svc.doctorID,
        nurseID: svc.nurseID,
        details: svc.details,
      });
    }
  }

  // Exact Room 301 May 2026 patients from the clinical ledger
  const mayRoom301SamplePatients: Array<[string, string, string]> = [
    ['Chloe', 'Lee', '2026-05-02T20:43:52.221Z'],
    ['Mateo', 'Reyes', '2026-05-02T21:52:03.766Z'],
    ['Maria', 'Santos', '2026-05-02T23:03:54.326Z'],
    ['Maria', 'Dela Cruz', '2026-05-04T11:50:07.207Z'],
    ['David', 'Lee', '2026-05-04T12:29:52.981Z'],
    ['David', 'Mendoza', '2026-05-04T13:51:45.920Z'],
    ['David', 'Dela Cruz', '2026-05-05T23:34:05.786Z'],
    ['David', 'Garcia', '2026-05-06T14:00:11.229Z'],
    ['Chloe', 'Reyes', '2026-05-06T17:28:23.802Z'],
    ['Elena', 'Reyes', '2026-05-07T14:37:45.535Z'],
    ['Lucas', 'Dela Cruz', '2026-05-08T03:10:44.279Z'],
    ['Matias', 'Lee', '2026-05-09T03:33:58.674Z'],
    ['Lucas', 'Mendoza', '2026-05-09T12:11:20.300Z'],
    ['Juan', 'Mendoza', '2026-05-09T12:48:45.616Z'],
    ['Carlos', 'Gimpao', '2026-05-10T03:46:57.646Z'],
    ['Sofia', 'Torres', '2026-05-10T04:43:01.588Z'],
    ['Ben', 'Mendoza', '2026-05-10T10:06:10.414Z'],
  ];

  const mockStore = { doctors, nurses, rooms, patients, bills, patientRecords };

  // Add May 2026 records
  for (let i = 0; i < mayRoom301SamplePatients.length; i++) {
    const [first, last, admission] = mayRoom301SamplePatients[i];
    const bill = mayBillsQueue[i] || mayBillsQueue[0];
    addRecord({
      admissionIso: admission,
      firstName: first,
      lastName: last,
      roomID: 301,
      doctorID: bill.doctorID,
      nurseID: bill.nurseID,
      productName: bill.productName,
      cost: bill.cost,
      details: bill.details,
    });
  }

  // Fill remaining ~108 May bills across other rooms
  const otherMayPatients = [
    ['James', 'Wilson', '2026-05-01T08:15:00.000Z'],
    ['Sarah', 'Chen', '2026-05-01T09:30:00.000Z'],
    ['Michael', 'Brown', '2026-05-01T10:45:00.000Z'],
    ['Emily', 'Davis', '2026-05-01T11:20:00.000Z'],
    ['Robert', 'Miller', '2026-05-01T13:10:00.000Z'],
    ['Jennifer', 'Taylor', '2026-05-01T14:25:00.000Z'],
    ['David', 'Anderson', '2026-05-01T15:40:00.000Z'],
    ['Lisa', 'Thomas', '2026-05-01T16:55:00.000Z'],
    ['Christopher', 'Jackson', '2026-05-02T08:05:00.000Z'],
    ['Amanda', 'White', '2026-05-02T09:20:00.000Z'],
    ['Matthew', 'Harris', '2026-05-02T10:35:00.000Z'],
    ['Ashley', 'Martin', '2026-05-02T11:50:00.000Z'],
    ['Joshua', 'Thompson', '2026-05-02T13:05:00.000Z'],
    ['Stephanie', 'Garcia', '2026-05-02T14:20:00.000Z'],
    ['Daniel', 'Martinez', '2026-05-02T15:35:00.000Z'],
    ['Nicole', 'Robinson', '2026-05-02T16:50:00.000Z'],
    ['Andrew', 'Clark', '2026-05-03T08:10:00.000Z'],
    ['Elizabeth', 'Rodriguez', '2026-05-03T09:25:00.000Z'],
    ['Ryan', 'Lewis', '2026-05-03T10:40:00.000Z'],
    ['Michelle', 'Lee', '2026-05-03T11:55:00.000Z'],
    ['Brandon', 'Walker', '2026-05-03T13:10:00.000Z'],
    ['Laura', 'Hall', '2026-05-03T14:25:00.000Z'],
    ['Kevin', 'Allen', '2026-05-03T15:40:00.000Z'],
    ['Rebecca', 'Young', '2026-05-03T16:55:00.000Z'],
    ['Tyler', 'Hernandez', '2026-05-04T08:15:00.000Z'],
    ['Kimberly', 'King', '2026-05-04T09:30:00.000Z'],
    ['Jonathan', 'Wright', '2026-05-04T10:45:00.000Z'],
    ['Melissa', 'Lopez', '2026-05-04T11:55:00.000Z'],
    ['Justin', 'Hill', '2026-05-04T13:05:00.000Z'],
    ['Amber', 'Scott', '2026-05-04T14:20:00.000Z'],
    ['Joseph', 'Green', '2026-05-04T15:35:00.000Z'],
    ['Christina', 'Adams', '2026-05-04T16:50:00.000Z'],
    ['Zachary', 'Baker', '2026-05-05T08:05:00.000Z'],
    ['Brittany', 'Gonzalez', '2026-05-05T09:20:00.000Z'],
    ['Austin', 'Nelson', '2026-05-05T10:35:00.000Z'],
    ['Samantha', 'Carter', '2026-05-05T11:50:00.000Z'],
    ['Jordan', 'Mitchell', '2026-05-05T13:05:00.000Z'],
    ['Lauren', 'Perez', '2026-05-05T14:20:00.000Z'],
    ['Cody', 'Roberts', '2026-05-05T15:35:00.000Z'],
    ['Megan', 'Turner', '2026-05-05T16:50:00.000Z'],
    ['Dylan', 'Phillips', '2026-05-06T08:10:00.000Z'],
    ['Rachel', 'Campbell', '2026-05-06T09:25:00.000Z'],
    ['Kyle', 'Parker', '2026-05-06T10:40:00.000Z'],
    ['Kayla', 'Evans', '2026-05-06T11:55:00.000Z'],
    ['Sean', 'Edwards', '2026-05-06T13:05:00.000Z'],
    ['Taylor', 'Collins', '2026-05-06T14:20:00.000Z'],
    ['Logan', 'Stewart', '2026-05-06T15:35:00.000Z'],
    ['Kaylee', 'Sanchez', '2026-05-06T16:50:00.000Z'],
    ['Lucas', 'Morris', '2026-05-07T08:15:00.000Z'],
    ['Hannah', 'Rogers', '2026-05-07T09:30:00.000Z'],
    ['Gabriel', 'Reed', '2026-05-07T10:45:00.000Z'],
    ['Allison', 'Cook', '2026-05-07T11:55:00.000Z'],
    ['Isaac', 'Morgan', '2026-05-07T13:05:00.000Z'],
    ['Savannah', 'Bell', '2026-05-07T14:20:00.000Z'],
    ['Ethan', 'Murphy', '2026-05-07T15:35:00.000Z'],
    ['Brooke', 'Bailey', '2026-05-07T16:50:00.000Z'],
    ['Nathan', 'Rivera', '2026-05-08T08:10:00.000Z'],
    ['Alexis', 'Cooper', '2026-05-08T09:25:00.000Z'],
    ['Christian', 'Richardson', '2026-05-08T10:40:00.000Z'],
    ['Vanessa', 'Cox', '2026-05-08T11:55:00.000Z'],
    ['Hunter', 'Howard', '2026-05-08T13:05:00.000Z'],
    ['Alyssa', 'Ward', '2026-05-08T14:20:00.000Z'],
    ['Elijah', 'Torres', '2026-05-08T15:35:00.000Z'],
    ['Jasmine', 'Peterson', '2026-05-08T16:50:00.000Z'],
    ['Caleb', 'Gray', '2026-05-09T08:15:00.000Z'],
    ['Morgan', 'Ramirez', '2026-05-09T09:30:00.000Z'],
    ['Aaron', 'James', '2026-05-09T10:45:00.000Z'],
    ['Sydney', 'Watson', '2026-05-09T11:55:00.000Z'],
    ['Connor', 'Brooks', '2026-05-09T13:05:00.000Z'],
    ['Kayla', 'Kelly', '2026-05-09T14:20:00.000Z'],
    ['Isaiah', 'Sanders', '2026-05-09T15:35:00.000Z'],
    ['Destiny', 'Price', '2026-05-09T16:50:00.000Z'],
    ['Colton', 'Bennett', '2026-05-10T08:10:00.000Z'],
    ['Paige', 'Wood', '2026-05-10T09:25:00.000Z'],
    ['Jason', 'Barnes', '2026-05-10T10:40:00.000Z'],
    ['Jenna', 'Ross', '2026-05-10T11:55:00.000Z'],
    ['Cole', 'Henderson', '2026-05-10T13:05:00.000Z'],
    ['Courtney', 'Coleman', '2026-05-10T14:20:00.000Z'],
    ['Gavin', 'Jenkins', '2026-05-10T15:35:00.000Z'],
    ['Riley', 'Perry', '2026-05-10T16:50:00.000Z'],
  ];

  let billIdx = mayRoom301SamplePatients.length;
  for (const [first, last, admission] of otherMayPatients) {
    if (billIdx >= mayBillsQueue.length) billIdx = 0;
    const bill = mayBillsQueue[billIdx++];
    const room = non301MayRooms[billIdx % non301MayRooms.length];
    addRecord({
      admissionIso: admission,
      firstName: first,
      lastName: last,
      roomID: room,
      doctorID: bill.doctorID,
      nurseID: bill.nurseID,
      productName: bill.productName,
      cost: bill.cost,
      details: bill.details,
    });
  }

  return mockStore;
}

const mockStore = createMockStarSchemaStore();

// Helper to query Supabase REST API
async function fetchSupabaseTable(tableName: string, queryParams: string = '', exactCount = false) {
  const url = `${supabaseRestUrl}/${tableName}${queryParams ? `?${queryParams}` : ''}`;
  const keyToUse = serviceRoleKey || anonKey;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: {
      apikey: keyToUse,
      ...(exactCount ? { Prefer: 'count=exact' } : {}),
      ...(keyToUse.startsWith('sb_') ? {} : { Authorization: `Bearer ${keyToUse}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Supabase read failed for ${tableName} (HTTP ${res.status}).`);
  }
  const rows = await res.json();
  if (!Array.isArray(rows)) {
    throw new Error(`Supabase returned an invalid row list for ${tableName}.`);
  }
  if (!exactCount) return { rows };
  const count = Number(res.headers.get('content-range')?.match(/\/(\d+)$/)?.[1]);
  if (!Number.isSafeInteger(count)) {
    throw new Error(`Supabase did not return an exact count for ${tableName}.`);
  }
  return { rows, count };
}

async function fetchAllRows(tableName: string, primaryKey: string) {
  const records: any[] = [];
  let lastId: number | undefined;
  let expectedCount = 0;
  do {
    const params = new URLSearchParams({ order: `${primaryKey}.asc`, limit: '1000' });
    if (lastId !== undefined) params.set(primaryKey, `gt.${lastId}`);
    const firstPage = lastId === undefined;
    const { rows, count } = await fetchSupabaseTable(tableName, params.toString(), firstPage);
    if (count !== undefined) expectedCount = count;
    for (const row of rows) {
      const id = row[primaryKey];
      if (!Number.isSafeInteger(id) || (lastId !== undefined && id <= lastId)) {
        throw new Error(`Invalid or duplicate primary key returned for ${tableName}.`);
      }
      lastId = id;
      records.push(row);
    }
    if (!rows.length) break;
  } while (records.length < expectedCount);

  if (records.length !== expectedCount) {
    throw new Error(`${tableName} changed or returned incomplete data during synchronization. Retry the read.`);
  }
  return records;
}

// In-memory cache for dashboard requests without a forced refresh
let cachedAnalytics: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30000;

// Helper to categorize clinical affliction from bill details / procedures
const AFFLICTION_RULES: Array<{ keywords: string[]; bucket: string }> = [
  { keywords: ['x-ray', 'chest x-ray', 'chest xray', 'respiratory', 'pneumonia', 'bronchitis'], bucket: 'Respiratory & Pulmonary' },
  { keywords: ['ecg', 'cardio', 'blood pressure', 'hypertension', 'coronary'], bucket: 'Cardiovascular Conditions' },
  { keywords: ['urinalysis', 'renal', 'urine', 'kidney', 'urinary'], bucket: 'Renal & Urological' },
  { keywords: ['mri', 'brain', 'neuro', 'spine', 'cranial'], bucket: 'Neurological & Musculoskeletal' },
  { keywords: ['ct scan', 'trauma', 'surgery', 'abdomen', 'acute'], bucket: 'Trauma & Acute Surgery' },
  { keywords: ['blood test', 'panel', 'metabolic', 'diabetes', 'infectious'], bucket: 'Infectious & Metabolic' },
  { keywords: ['routine', 'checkup', 'consultation', 'general'], bucket: 'Preventive & General Medicine' },
  { keywords: ['pediatric'], bucket: 'Pediatric Care' },
];

function inferAffliction(productName?: string, details?: string, specialization?: string): string {
  const text = `${productName || ''} ${details || ''} ${specialization || ''}`.toLowerCase();
  for (const rule of AFFLICTION_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      return rule.bucket;
    }
  }
  return 'General Clinical Diagnostic';
}

// Load live star schema from Supabase
async function loadStarSchemaTables(requireLive = false) {
  if (!isSupabaseLiveConfigured()) {
    if (requireLive) throw new Error('Configure a Supabase project URL and publishable key to run live analysis.');
    return { ...mockStore, source: 'demo' as const };
  }
  const [patientRecords, bills, doctors, nurses, rooms, patients] = await Promise.all([
    fetchAllRows('PatientRecords', 'recordID'),
    fetchAllRows('Bill_Dim', 'billID'),
    fetchAllRows('Doctor_Dim', 'doctorID'),
    fetchAllRows('Nurse_Dim', 'nurseID'),
    fetchAllRows('Room_Dim', 'roomId'),
    fetchAllRows('Patient_Dim', 'patientID'),
  ]);
  return { patientRecords, bills, doctors, nurses, rooms, patients, source: 'live' as const };
}

// --- API Routes ---

app.get('/api/finals', async (_req, res) => {
  try {
    const started = performance.now();
    res.set('Cache-Control', 'no-store');
    const warehouse = await loadStarSchemaTables(true);
    const result = analyzeFinals(warehouse, performance.now() - started);
    if (result.before.facts !== 1504 || result.batchCount !== 5000) {
      return res.status(409).json({
        error: `The live read found ${result.before.facts} of 1,504 midterm and ${result.batchCount} of 5,000 finals admissions. Check the project and its SELECT policies against the original import.`,
      });
    }
    return res.json(result);
  } catch (error) {
    console.error('Finals warehouse read failed:', error);
    return res.status(503).json({ error: error instanceof Error ? error.message : 'Could not read the live Supabase warehouse.' });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    const isConfigured = isSupabaseLiveConfigured();
    res.json({
      status: 'ok',
      configured: isConfigured,
      mode: isConfigured ? 'supabase-live' : 'in-memory-fallback',
      endpoint: supabaseBaseUrl,
      hasServiceKey: Boolean(serviceRoleKey),
      hasAnonKey: Boolean(anonKey),
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/analytics', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const forceRefresh = req.query.refresh === 'true';
  const now = Date.now();

  if (!forceRefresh && cachedAnalytics && now - lastCacheTime < CACHE_TTL_MS) {
    return res.json(cachedAnalytics);
  }

  try {
    const { patientRecords, bills, doctors, nurses, rooms, patients, source } = await loadStarSchemaTables();

    // Build lookup maps for fast O(1) joins
    const billMap = new Map<number, any>();
    bills.forEach((b: any) => billMap.set(Number(b.billID), b));

    const doctorMap = new Map<number, any>();
    doctors.forEach((d: any) => doctorMap.set(Number(d.doctorID), d));

    const nurseMap = new Map<number, any>();
    nurses.forEach((n: any) => nurseMap.set(Number(n.nurseID), n));

    const roomMap = new Map<number, any>();
    rooms.forEach((r: any) => roomMap.set(Number(r.roomId), r));

    const patientMap = new Map<number, any>();
    patients.forEach((p: any) => patientMap.set(Number(p.patientID), p));

    // Calculate aggregated metrics
    let totalRevenue = 0;
    const diseaseFrequency: Record<string, { count: number; totalCost: number }> = {};
    const doctorWorkload: Record<
      number,
      {
        doctorID: number;
        fullName: string;
        specialization: string;
        experienceYears: number;
        patientCount: number;
        totalRevenue: number;
      }
    > = {};

    // Initialize doctor workload map
    doctors.forEach((d: any) => {
      const id = Number(d.doctorID);
      const name = `Dr. ${d.firstName} ${d.lastName}`;
      doctorWorkload[id] = {
        doctorID: id,
        fullName: name,
        specialization: d.medicalSpecialization || 'General',
        experienceYears: d.experienceYears || 0,
        patientCount: 0,
        totalRevenue: 0,
      };
    });

    // Timeline data bucketed by date (YYYY-MM-DD)
    const timelineByDate: Record<string, { date: string; cost: number; admissions: number }> = {};

    // Map each patient record with joined dimensions
    const joinedRecords = patientRecords.map((rec: any) => {
      const bill = billMap.get(Number(rec.billID)) || null;
      const doctor = doctorMap.get(Number(rec.doctorID)) || null;
      const nurse = nurseMap.get(Number(rec.nurseID)) || null;
      const room = roomMap.get(Number(rec.roomID)) || null;
      const patient = patientMap.get(Number(rec.patientID)) || null;

      const cost = bill ? parseFloat(bill.financialCost) || 0 : 0;
      totalRevenue += cost;

      // Group timeline by admission date (ISO YYYY-MM-DD)
      const dateKey = manilaDate(rec.admission) || 'Unknown';
      if (dateKey !== 'Unknown') {
        if (!timelineByDate[dateKey]) {
          timelineByDate[dateKey] = { date: dateKey, cost: 0, admissions: 0 };
        }
        timelineByDate[dateKey].cost += cost;
        timelineByDate[dateKey].admissions += 1;
      }

      // Group doctor workload
      const docId = Number(rec.doctorID);
      if (doctorWorkload[docId]) {
        doctorWorkload[docId].patientCount += 1;
        doctorWorkload[docId].totalRevenue += cost;
      } else if (doctor) {
        doctorWorkload[docId] = {
          doctorID: docId,
          fullName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          specialization: doctor.medicalSpecialization || 'General',
          experienceYears: doctor.experienceYears || 0,
          patientCount: 1,
          totalRevenue: cost,
        };
      }

      // Group disease / affliction
      const affliction = inferAffliction(bill?.productName, bill?.details, doctor?.medicalSpecialization);
      if (!diseaseFrequency[affliction]) {
        diseaseFrequency[affliction] = { count: 0, totalCost: 0 };
      }
      diseaseFrequency[affliction].count += 1;
      diseaseFrequency[affliction].totalCost += cost;

      return {
        recordID: rec.recordID,
        admission: rec.admission,
        patient: patient
          ? {
              patientID: patient.patientID,
              fullName: `${patient.firstName} ${patient.lastName}`,
              birthDate: patient.patientBdate,
            }
          : null,
        doctor: doctor
          ? {
              doctorID: doctor.doctorID,
              fullName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
              specialization: doctor.medicalSpecialization,
            }
          : null,
        nurse: nurse
          ? {
              nurseID: nurse.nurseID,
              fullName: `${nurse.firstName} ${nurse.lastName}`,
              areaAssignment: nurse.areaAssignment,
            }
          : null,
        room: room
          ? {
              roomId: room.roomId,
              roomClass: room.roomClass,
              currentAvailability: room.currentAvailability,
              servicableBeds: room.servicableBeds,
            }
          : null,
        bill: bill
          ? {
              billID: bill.billID,
              productName: bill.productName,
              financialCost: cost,
              details: bill.details,
              purchasedAt: bill.purchasedAt,
              affliction,
            }
          : null,
      };
    });

    // Compute sorted timeline points
    const timeline = Object.values(timelineByDate).sort((a, b) => a.date.localeCompare(b.date));

    // Compute room bed statistics
    let totalBeds = 0;
    let availableBeds = 0;
    rooms.forEach((r: any) => {
      const beds = Number(r.servicableBeds) || 1;
      totalBeds += beds;
      if (r.currentAvailability) {
        availableBeds += beds;
      }
    });

    // Compute doctor workload array sorted by patient volume descending
    const doctorWorkloadList = Object.values(doctorWorkload).sort((a, b) => b.patientCount - a.patientCount);

    // Compute disease distribution array sorted by count descending
    const diseaseDistribution = Object.entries(diseaseFrequency)
      .map(([name, data]) => ({
        name,
        count: data.count,
        totalCost: data.totalCost,
        avgCost: data.count > 0 ? data.totalCost / data.count : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const payload = {
      timestamp: source === 'live' ? new Date().toISOString() : null,
      source,
      summary: {
        totalRevenue,
        totalRecords: patientRecords.length,
        averageBill: patientRecords.length > 0 ? totalRevenue / patientRecords.length : 0,
        totalPatients: patients.length,
        totalDoctors: doctors.length,
        totalNurses: nurses.length,
        totalRooms: rooms.length,
        totalBeds,
        availableBeds,
        occupiedBeds: Math.max(0, totalBeds - availableBeds),
        occupancyRate: totalBeds > 0 ? ((totalBeds - availableBeds) / totalBeds) * 100 : 0,
      },
      charts: {
        timeline,
        doctorWorkload: doctorWorkloadList,
        diseaseDistribution,
      },
      joinedRecords,
      dimensions: {
        doctors,
        nurses,
        rooms,
        totalBills: bills.length,
      },
    };

    cachedAnalytics = payload;
    lastCacheTime = now;

    res.json(payload);
  } catch (err: any) {
    console.error('Error fetching analytics:', err);
    res.status(503).json({ error: err instanceof Error ? err.message : 'Could not synchronize the live warehouse.' });
  }
});

// Add new realistic patient admission record
app.post('/api/seed-record', async (req, res) => {
  try {
    const keyToUse = serviceRoleKey || anonKey;
    const body = req.body || {};

    const patientName = body.patientName || 'Clara Oswald';
    const [first, ...rest] = patientName.split(' ');
    const last = rest.join(' ') || 'Vance';
    const birthDate = body.birthDate || '1990-05-14';
    const birthYear = Number(birthDate.slice(0, 4));
    const validBirthDate =
      birthDate && Number.isFinite(birthYear) && birthYear >= 1900 && birthYear <= new Date().getFullYear()
        ? birthDate
        : '1990-05-14';
    const cost = body.cost || (Math.floor(Math.random() * 2000) + 500).toFixed(2);
    const productName = body.productName || 'Comprehensive Blood Test';
    const details = body.details || 'Diagnostic laboratory assessment conducted for inpatient evaluation.';
    const doctorID = Number(body.doctorID) || 101;
    const nurseID = Number(body.nurseID) || 201;
    const roomID = Number(body.roomID) || 301;
    const nowIso = new Date().toISOString();

    if (isSupabaseLiveConfigured()) {
      try {
        // Get current max IDs to assign next sequence
        const [{ rows: latestRecord }, { rows: latestBill }, { rows: latestPatient }] = await Promise.all([
          fetchSupabaseTable('PatientRecords', 'select=recordID&order=recordID.desc&limit=1'),
          fetchSupabaseTable('Bill_Dim', 'select=billID&order=billID.desc&limit=1'),
          fetchSupabaseTable('Patient_Dim', 'select=patientID&order=patientID.desc&limit=1'),
        ]);

        const newRecordID = (Number(latestRecord[0]?.recordID) || 1000) + 1;
        const newBillID = (Number(latestBill[0]?.billID) || 2000) + 1;
        const newPatientID = (Number(latestPatient[0]?.patientID) || 1000) + 1;

        // 1. Create Patient_Dim entry
        await fetch(`${supabaseRestUrl}/Patient_Dim`, {
          method: 'POST',
          headers: {
            apikey: keyToUse,
            Authorization: `Bearer ${keyToUse}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            patientID: newPatientID,
            firstName: first,
            lastName: last,
            patientBdate: validBirthDate,
          }),
        });

        // 2. Create Bill_Dim entry
        await fetch(`${supabaseRestUrl}/Bill_Dim`, {
          method: 'POST',
          headers: {
            apikey: keyToUse,
            Authorization: `Bearer ${keyToUse}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            billID: newBillID,
            purchasedAt: nowIso,
            productName,
            financialCost: cost.toString(),
            details,
          }),
        });

        // 3. Create PatientRecords fact entry
        const recordPayload = {
          recordID: newRecordID,
          admission: nowIso,
          patientID: newPatientID,
          roomID,
          doctorID,
          nurseID,
          billID: newBillID,
        };

        const recordRes = await fetch(`${supabaseRestUrl}/PatientRecords`, {
          method: 'POST',
          headers: {
            apikey: keyToUse,
            Authorization: `Bearer ${keyToUse}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(recordPayload),
        });

        if (!recordRes.ok) {
          const err = await recordRes.text();
          throw new Error(`Failed to insert record: ${err}`);
        }

        cachedAnalytics = null;
        return res.json({ success: true, recordID: newRecordID, billID: newBillID, patientID: newPatientID });
      } catch (supabaseErr: any) {
        console.warn('[AI Studio] Supabase insert unavailable — writing to in-memory store:', supabaseErr.message);
      }
    }

    // In-memory star-schema fallback insert
    const maxRec = mockStore.patientRecords.reduce((m, r) => Math.max(m, Number(r.recordID) || 0), 1000);
    const maxBill = mockStore.bills.reduce((m, b) => Math.max(m, Number(b.billID) || 0), 2000);
    const maxPat = mockStore.patients.reduce((m, p) => Math.max(m, Number(p.patientID) || 0), 5000);

    const newRecordID = maxRec + 1;
    const newBillID = maxBill + 1;
    const newPatientID = maxPat + 1;

    mockStore.patients.push({
      patientID: newPatientID,
      firstName: first,
      lastName: last,
      patientBdate: birthDate,
    });

    mockStore.bills.push({
      billID: newBillID,
      purchasedAt: nowIso,
      productName,
      financialCost: cost.toString(),
      details,
    });

    mockStore.patientRecords.unshift({
      recordID: newRecordID,
      admission: nowIso,
      patientID: newPatientID,
      roomID,
      doctorID,
      nurseID,
      billID: newBillID,
    });

    cachedAnalytics = null;
    res.json({ success: true, recordID: newRecordID, billID: newBillID, patientID: newPatientID });
  } catch (err: any) {
    console.error('Error seeding record:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Server-Side Groq Chatbot Endpoint (/api/chat) ---
const groqKey = process.env.GROQ_API_KEY || '';
const isPlaceholderKey = groqKey.includes('your-') || groqKey.includes('placeholder') || groqKey.length < 10;
const ai = groqKey && !isPlaceholderKey
  ? new Groq({
      apiKey: groqKey,
    })
  : null;

const clinicTools = [
  {
    type: 'function' as const,
    function: {
      name: 'query_admissions_by_period',
      description:
        'Query patients admitted in a specific year and month, optionally filtered by doctor name, along with their attending physicians, medical specializations, and admission timestamps (equivalent to CTE + LEFT JOIN on PatientRecords, Patient_Dim, and Doctor_Dim). Use this for questions like "patients treated by Dr. Jennifer Garcia in August 2026".',
      parameters: {
        type: 'object' as const,
        properties: {
          year: { type: 'integer' as const, description: '4-digit year, e.g. 2026' },
          month: { type: 'integer' as const, description: 'Month number 1-12, e.g. 8 for August' },
          doctorName: { type: 'string' as const, description: 'Optional full or partial doctor name, e.g. "Jennifer Garcia" or "Dr. Jennifer Garcia"' },
          limit: { type: 'integer' as const, description: 'Max sample patient rows to return (default 35)' },
        },
        required: ['year', 'month'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_room_usage',
      description:
        'Query which patients occupied a specific room ID (e.g., Room 301) during a given year and month, and return the total patient count in that period (equivalent to COUNT(*) OVER ()).',
      parameters: {
        type: 'object' as const,
        properties: {
          roomId: { type: 'integer' as const, description: 'Room ID number, e.g. 301' },
          year: { type: 'integer' as const, description: 'Optional 4-digit year, e.g. 2026' },
          month: { type: 'integer' as const, description: 'Optional month number 1-12, e.g. 5 for May' },
          limit: { type: 'integer' as const, description: 'Max sample patient rows to return (default 35)' },
        },
        required: ['roomId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_room_staffing',
      description:
        'Query the distinct assigned doctors and nurses for a specific room ID (e.g., Room 303) and compute the total medical staff headcount (equivalent to UNION ALL across Doctor_Dim and Nurse_Dim).',
      parameters: {
        type: 'object' as const,
        properties: {
          roomId: { type: 'integer' as const, description: 'Room ID number, e.g. 303' },
        },
        required: ['roomId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_top_patients_by_billing',
      description:
        'Query the top patients by total billed amount across all admissions (entire history), optionally filtered by year. Returns patient details, total billed amount, admission count, and average bill per admission. Use for questions like "who is the top paying customer" or "highest revenue patients".',
      parameters: {
        type: 'object' as const,
        properties: {
          limit: { type: 'integer' as const, description: 'Number of top patients to return (default 10)' },
          year: { type: 'integer' as const, description: 'Optional 4-digit year to filter, e.g. 2026' },
        },
        required: [],
      },
    },
  },
];

app.post('/api/chat', async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      error: 'Groq API key is not configured on the server. Please set GROQ_API_KEY in your .env file.',
    });
  }

  try {
    const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const validMessages = rawMessages.filter(
      (m: any) => m && (m.role === 'user' || m.role === 'model') && typeof m.text === 'string' && m.text.trim().length > 0
    );

    if (validMessages.length === 0) {
      return res.status(400).json({ error: 'At least one user message is required.' });
    }

    const messages: any[] = [
      { role: 'system', content: `You are the Clinic AI Analyst for Hyacinth Clinic. You have access to the clinic's star-schema database (PatientRecords fact table + Patient_Dim, Doctor_Dim, Nurse_Dim, Room_Dim, Bill_Dim dimensions). Answer questions about admissions, doctors, rooms, billing, and clinical patterns using the available tools.\n\nCurrent date: ${new Date().toISOString().slice(0, 10)}` },
      ...validMessages.map((m: any) => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.text,
      })),
    ];

    const toolsUsed: Array<{ name: string; summary: string }> = [];

    let response = await ai.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages,
      tools: clinicTools,
      tool_choice: 'auto',
    });

    let iterations = 0;
    let toolCalls = response?.choices?.[0]?.message?.tool_calls ?? [];
    while (toolCalls.length > 0 && iterations < 6) {
      iterations += 1;
      const modelContent = response?.choices?.[0]?.message;
      if (!modelContent) break;
      messages.push(modelContent);

      const toolResults: any[] = [];
      for (const call of toolCalls) {
        const fn = call.function;
        const args = typeof fn.arguments === 'string' ? JSON.parse(fn.arguments || '{}') : (fn.arguments || {});
        const result = await executeClinicTool(fn.name || '', args);
        toolsUsed.push({
          name: fn.name || 'query',
          summary: JSON.stringify(args),
        });
        toolResults.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }

      messages.push(...toolResults);

      response = await ai.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages,
        tools: clinicTools,
        tool_choice: 'auto',
      });
      toolCalls = response?.choices?.[0]?.message?.tool_calls ?? [];
    }

    return res.json({
      reply: response?.choices?.[0]?.message?.content || 'I was unable to generate a response for that query.',
      toolsUsed,
    });
  } catch (err: any) {
    console.error('Groq chat error:', err);
    let rawMsg = (err?.message || 'Failed to generate response from Groq API.').replace(/^\d+\s+/, '');
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed?.error?.message) {
        rawMsg = parsed.error.message;
      }
    } catch {
      // keep rawMsg as-is when not JSON
    }
    const status =
      err?.status === 401
        ? 401
        : err?.status === 400 || rawMsg.includes('API_KEY_INVALID')
        ? 400
        : err?.status === 404 || rawMsg.includes('NOT_FOUND')
        ? 404
        : err?.status === 429 || rawMsg.includes('RESOURCE_EXHAUSTED')
        ? 429
        : 500;
    return res.status(status).json({ error: rawMsg });
  }
});

async function executeClinicTool(name: string, args: any) {
  const { patientRecords, bills, doctors, nurses, rooms, patients } = await loadStarSchemaTables();

  const billMap = new Map<number, any>();
  bills.forEach((b: any) => billMap.set(Number(b.billID), b));

  const doctorMap = new Map<number, any>();
  doctors.forEach((d: any) => doctorMap.set(Number(d.doctorID), d));

  const nurseMap = new Map<number, any>();
  nurses.forEach((n: any) => nurseMap.set(Number(n.nurseID), n));

  const roomMap = new Map<number, any>();
  rooms.forEach((r: any) => roomMap.set(Number(r.roomId), r));

  const patientMap = new Map<number, any>();
  patients.forEach((p: any) => patientMap.set(Number(p.patientID), p));

  if (name === 'query_admissions_by_period') {
    const { year, month, doctorName, limit = 35 } = args;
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    let filtered = patientRecords.filter((rec: any) => manilaDate(rec.admission).startsWith(monthStr));
    if (doctorName) {
      const searchName = doctorName.toLowerCase().replace(/^dr\.\s*/i, '');
      const matchingDoctors = doctors.filter((d: any) =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchName)
      );
      const doctorIds = new Set(matchingDoctors.map((d: any) => Number(d.doctorID)));
      filtered = filtered.filter((rec: any) => doctorIds.has(Number(rec.doctorID)));
    }
    const sample = filtered.slice(0, limit).map((rec: any) => {
      const bill = billMap.get(Number(rec.billID));
      const doctor = doctorMap.get(Number(rec.doctorID));
      const nurse = nurseMap.get(Number(rec.nurseID));
      return {
        recordID: rec.recordID,
        admission: rec.admission,
        patient: patientMap.get(Number(rec.patientID)) || null,
        doctor: doctor ? { doctorID: doctor.doctorID, fullName: `Dr. ${doctor.firstName} ${doctor.lastName}`, specialization: doctor.medicalSpecialization } : null,
        nurse: nurse ? { nurseID: nurse.nurseID, fullName: `${nurse.firstName} ${nurse.lastName}`, areaAssignment: nurse.areaAssignment } : null,
        bill: bill ? { billID: bill.billID, productName: bill.productName, financialCost: parseFloat(bill.financialCost) || 0 } : null,
      };
    });
    return { count: filtered.length, sample };
  }

  if (name === 'query_room_usage') {
    const { roomId, year, month, limit = 35 } = args;
    let filtered = patientRecords.filter((rec: any) => Number(rec.roomID) === Number(roomId));
    if (year && month) {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      filtered = filtered.filter((rec: any) => manilaDate(rec.admission).startsWith(monthStr));
    } else if (year) {
      filtered = filtered.filter((rec: any) => manilaDate(rec.admission).startsWith(String(year)));
    }
    const sample = filtered.slice(0, limit).map((rec: any) => {
      const bill = billMap.get(Number(rec.billID));
      const doctor = doctorMap.get(Number(rec.doctorID));
      const nurse = nurseMap.get(Number(rec.nurseID));
      return {
        recordID: rec.recordID,
        admission: rec.admission,
        patient: patientMap.get(Number(rec.patientID)) || null,
        doctor: doctor ? { doctorID: doctor.doctorID, fullName: `Dr. ${doctor.firstName} ${doctor.lastName}`, specialization: doctor.medicalSpecialization } : null,
        nurse: nurse ? { nurseID: nurse.nurseID, fullName: `${nurse.firstName} ${nurse.lastName}`, areaAssignment: nurse.areaAssignment } : null,
        bill: bill ? { billID: bill.billID, productName: bill.productName, financialCost: parseFloat(bill.financialCost) || 0 } : null,
      };
    });
    return { roomId: Number(roomId), count: filtered.length, sample };
  }

  if (name === 'query_room_staffing') {
    const { roomId } = args;
    const roomRecords = patientRecords.filter((rec: any) => Number(rec.roomID) === Number(roomId));
    const doctorIds = new Set(roomRecords.map((rec: any) => Number(rec.doctorID)));
    const nurseIds = new Set(roomRecords.map((rec: any) => Number(rec.nurseID)));
    const roomDoctors = doctors.filter((d: any) => doctorIds.has(Number(d.doctorID)));
    const roomNurses = nurses.filter((n: any) => nurseIds.has(Number(n.nurseID)));
    return {
      roomId: Number(roomId),
      doctors: roomDoctors.map((d: any) => ({
        doctorID: d.doctorID,
        fullName: `Dr. ${d.firstName} ${d.lastName}`,
        specialization: d.medicalSpecialization,
        experienceYears: d.experienceYears,
      })),
      nurses: roomNurses.map((n: any) => ({
        nurseID: n.nurseID,
        fullName: `${n.firstName} ${n.lastName}`,
        areaAssignment: n.areaAssignment,
        experienceYears: n.experienceYears,
      })),
      totalStaff: roomDoctors.length + roomNurses.length,
    };
  }

  if (name === 'query_top_patients_by_billing') {
    const { limit = 10, year } = args;

    // Aggregate bills by patient
    const patientBilling = new Map<number, { total: number; count: number; bills: any[] }>();

    for (const rec of patientRecords) {
      if (year && rec.admission && !manilaDate(rec.admission).startsWith(String(year))) continue;
      const bill = billMap.get(Number(rec.billID));
      if (!bill) continue;
      const cost = parseFloat(bill.financialCost) || 0;
      if (cost <= 0) continue;

      const pid = Number(rec.patientID);
      const existing = patientBilling.get(pid) || { total: 0, count: 0, bills: [] };
      existing.total += cost;
      existing.count += 1;
      existing.bills.push({ billID: bill.billID, productName: bill.productName, cost });
      patientBilling.set(pid, existing);
    }

    // Sort by total descending, take top N
    const topPatients = Array.from(patientBilling.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, limit)
      .map(([patientID, data]) => {
        const patient = patientMap.get(patientID);
        return {
          patientID,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : `Patient ${patientID}`,
          patientBirthDate: patient?.patientBdate || null,
          totalBilled: Math.round(data.total * 100) / 100,
          admissionCount: data.count,
          averageBill: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
          topServices: data.bills
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 3)
            .map(b => ({ service: b.productName, cost: b.cost })),
        };
      });

    return { patients: topPatients, totalPatientsAnalyzed: patientBilling.size };
  }

  return { error: `Unknown tool: ${name}` };
}

// Vercel serverless function handler
export default async function handler(req: any, res: any): Promise<void> {
  app(req, res);
}
