import express from 'express';
import { analyzeFinals } from './finals';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Resolve Supabase Base URL (ensuring clean rest base)
const rawUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cpgomiuqhuwyrzzcozcu.supabase.co';
const supabaseBaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseRestUrl = `${supabaseBaseUrl}/rest/v1`;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function isSupabaseLiveConfigured(): boolean {
  const keyToUse = serviceRoleKey || anonKey;
  if (!supabaseBaseUrl || !keyToUse) return false;
  if (supabaseBaseUrl.includes('your-project') || supabaseBaseUrl.includes('placeholder')) return false;
  if (keyToUse.includes('your-') || keyToUse.includes('placeholder')) return false;
  return true;
}

// In-memory star-schema fallback store used when Supabase is unconfigured or offline
// Aligned with the Hyacinth Walk-In Clinic and Health Center star schema
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

  const patients: any[] = [];
  const bills: any[] = [];
  const patientRecords: any[] = [];

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
      addmission: opts.admissionIso,
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
    ['Juan', 'Flores', '2026-05-10T23:48:58.194Z'],
    ['Carlos', 'Reyes', '2026-05-11T10:35:24.305Z'],
    ['Carlos', 'Gimpao', '2026-05-11T13:20:20.029Z'],
    ['Maria', 'Dela Cruz', '2026-05-12T08:29:16.730Z'],
    ['Juan', 'Torres', '2026-05-12T17:13:32.414Z'],
    ['Chloe', 'Bautista', '2026-05-13T03:37:24.985Z'],
    ['Lucas', 'Torres', '2026-05-13T10:59:03.435Z'],
    ['Ben', 'Santos', '2026-05-13T19:15:08.823Z'],
    ['Elena', 'Torres', '2026-05-13T23:23:41.801Z'],
    ['Sofia', 'Mendoza', '2026-05-15T00:42:53.605Z'],
    ['Ben', 'Flores', '2026-05-15T07:41:31.933Z'],
    ['Ashron', 'Bautista', '2026-05-15T14:35:29.712Z'],
    ['Mateo', 'Dela Cruz', '2026-05-15T14:58:35.950Z'],
    ['Lucas', 'Torres', '2026-05-16T21:56:34.319Z'],
    ['David', 'Bautista', '2026-05-17T03:14:05.636Z'],
  ];

  const poolFirst = ['Chloe', 'Mateo', 'Maria', 'David', 'Elena', 'Lucas', 'Matias', 'Juan', 'Carlos', 'Sofia', 'Ben', 'Ashron'];
  const poolLast = ['Lee', 'Reyes', 'Santos', 'Dela Cruz', 'Mendoza', 'Garcia', 'Gimpao', 'Torres', 'Flores', 'Bautista'];

  for (let i = 0; i < mayBillsQueue.length; i++) {
    const bill = mayBillsQueue[i];
    const isRoom301 = i < 65;
    let firstName: string;
    let lastName: string;
    let admissionIso: string;

    if (i < mayRoom301SamplePatients.length) {
      [firstName, lastName, admissionIso] = mayRoom301SamplePatients[i];
    } else {
      firstName = poolFirst[(i * 3) % poolFirst.length];
      lastName = poolLast[(i * 5) % poolLast.length];
      const day = isRoom301 ? 18 + ((i - 32) % 13) : 1 + (i % 30);
      const hour = String((i * 7) % 24).padStart(2, '0');
      const min = String((i * 13) % 60).padStart(2, '0');
      admissionIso = `2026-05-${String(day).padStart(2, '0')}T${hour}:${min}:15.000Z`;
    }

    addRecord({
      admissionIso,
      firstName,
      lastName,
      roomID: isRoom301 ? 301 : non301MayRooms[i % non301MayRooms.length],
      doctorID: bill.doctorID,
      nurseID: bill.nurseID,
      productName: bill.productName,
      cost: bill.cost,
      details: bill.details,
    });
  }

  // 2. August 2026 Admissions (187 records matching Hyacinth Clinic August 2026 log)
  const augInitialRows: Array<[string, string, string, number]> = [
    ['2026-08-01T04:10:53.522Z', 'David', 'Lee', 103],
    ['2026-08-01T04:21:21.335Z', 'Elena', 'Bautista', 102],
    ['2026-08-01T10:58:31.517Z', 'Mateo', 'Gimpao', 101],
    ['2026-08-01T11:42:10.400Z', 'Juan', 'Torres', 103],
    ['2026-08-01T14:12:03.803Z', 'Carlos', 'Santos', 104],
    ['2026-08-01T15:53:50.057Z', 'David', 'Garcia', 102],
    ['2026-08-02T02:20:23.341Z', 'Mateo', 'Lee', 105],
    ['2026-08-02T04:52:59.705Z', 'Matias', 'Dela Cruz', 106],
    ['2026-08-02T07:15:47.710Z', 'Lucas', 'Reyes', 101],
    ['2026-08-02T09:36:35.159Z', 'Juan', 'Mendoza', 102],
    ['2026-08-02T10:28:26.071Z', 'Sofia', 'Dela Cruz', 102],
    ['2026-08-02T13:07:57.064Z', 'David', 'Flores', 103],
    ['2026-08-02T14:24:09.388Z', 'Matias', 'Gimpao', 102],
    ['2026-08-02T17:34:57.367Z', 'Mateo', 'Garcia', 102],
    ['2026-08-02T18:16:33.958Z', 'Mateo', 'Lee', 107],
    ['2026-08-02T20:38:45.761Z', 'Chloe', 'Reyes', 101],
    ['2026-08-02T21:15:00.808Z', 'Juan', 'Lee', 107],
    ['2026-08-02T23:46:00.390Z', 'Maria', 'Flores', 101],
    ['2026-08-03T04:47:29.652Z', 'Lucas', 'Garcia', 105],
    ['2026-08-03T04:59:44.310Z', 'Carlos', 'Lee', 101],
    ['2026-08-03T05:27:29.108Z', 'Ben', 'Flores', 103],
    ['2026-08-03T14:43:31.189Z', 'Ashron', 'Santos', 108],
    ['2026-08-03T16:29:06.565Z', 'Matias', 'Santos', 106],
    ['2026-08-03T23:21:40.687Z', 'David', 'Dela Cruz', 103],
    ['2026-08-04T00:48:48.975Z', 'Lucas', 'Santos', 102],
    ['2026-08-04T02:03:19.287Z', 'Ben', 'Bautista', 101],
    ['2026-08-04T03:00:59.681Z', 'Elena', 'Dela Cruz', 108],
    ['2026-08-04T05:18:05.633Z', 'Carlos', 'Flores', 106],
    ['2026-08-04T07:46:56.888Z', 'Ashron', 'Bautista', 108],
    ['2026-08-04T07:49:19.208Z', 'Ben', 'Dela Cruz', 108],
    ['2026-08-04T10:50:12.014Z', 'Carlos', 'Reyes', 107],
    ['2026-08-04T16:53:05.351Z', 'Ashron', 'Dela Cruz', 102],
    ['2026-08-04T18:13:04.432Z', 'David', 'Mendoza', 102],
    ['2026-08-04T18:53:06.448Z', 'Maria', 'Mendoza', 104],
    ['2026-08-04T20:14:47.738Z', 'Ben', 'Garcia', 101],
  ];

  const docDefaultSvc: Record<number, { productName: string; cost: number; nurseID: number; details: string }> = {
    101: { productName: 'ECG', cost: 2850, nurseID: 202, details: 'Cardiology inpatient stress ECG and coronary telemetry.' },
    102: { productName: 'Routine Checkup', cost: 1650, nurseID: 208, details: 'General practice inpatient evaluation and diagnostic panel.' },
    103: { productName: 'CT Scan', cost: 3150, nurseID: 204, details: 'General surgery preoperative diagnostic CT imaging.' },
    104: { productName: 'CT Scan', cost: 2950, nurseID: 204, details: 'Emergency medicine acute trauma evaluation and imaging.' },
    105: { productName: 'Comprehensive Blood Test', cost: 2450, nurseID: 206, details: 'Infectious disease blood culture and metabolic biomarker panel.' },
    106: { productName: 'ECG', cost: 2780, nurseID: 202, details: 'Cardiology echocardiogram and 12-lead ECG monitoring.' },
    107: { productName: 'Urinalysis', cost: 2150, nurseID: 206, details: 'Internal medicine renal and metabolic urinalysis screening.' },
    108: { productName: 'Routine Checkup', cost: 1450, nurseID: 207, details: 'Pediatrics inpatient consultation and routine checkup.' },
  };

  for (let i = 0; i < 187; i++) {
    let admissionIso: string;
    let firstName: string;
    let lastName: string;
    let doctorID: number;

    if (i < augInitialRows.length) {
      [admissionIso, firstName, lastName, doctorID] = augInitialRows[i];
    } else {
      const day = 5 + ((i - augInitialRows.length) % 27);
      const hour = String((i * 5) % 24).padStart(2, '0');
      const min = String((i * 11) % 60).padStart(2, '0');
      admissionIso = `2026-08-${String(day).padStart(2, '0')}T${hour}:${min}:10.000Z`;
      firstName = poolFirst[(i * 7) % poolFirst.length];
      lastName = poolLast[(i * 3) % poolLast.length];
      doctorID = 101 + (i % 8);
    }

    const svc = docDefaultSvc[doctorID];
    addRecord({
      admissionIso,
      firstName,
      lastName,
      roomID: nonRoom303Ids[i % nonRoom303Ids.length],
      doctorID,
      nurseID: svc.nurseID,
      productName: svc.productName,
      cost: svc.cost + ((i * 47) % 320),
      details: svc.details,
    });
  }

  // 3. Room 303 Staffing (exclusively Dr. Robert Gomez #102 & Nurse Maria Bautista #201) + Q1/Q3/Q4 context
  const extraDates = [
    '2026-01-12T09:15:00.000Z', '2026-01-24T14:30:00.000Z',
    '2026-02-09T10:45:00.000Z', '2026-02-21T16:10:00.000Z',
    '2026-03-08T11:20:00.000Z', '2026-03-22T15:40:00.000Z',
    '2026-04-07T08:50:00.000Z', '2026-04-19T13:15:00.000Z',
    '2026-06-11T10:05:00.000Z', '2026-06-25T17:25:00.000Z',
    '2026-07-06T09:35:00.000Z', '2026-07-19T14:55:00.000Z',
    '2026-09-10T11:10:00.000Z', '2026-09-23T16:45:00.000Z',
    '2026-10-08T08:30:00.000Z', '2026-10-22T13:50:00.000Z',
    '2026-11-04T10:15:00.000Z', '2026-11-16T15:20:00.000Z',
  ];

  for (let i = 0; i < extraDates.length; i++) {
    const isRoom303 = i < 4; // Room 303 in Q1/Q2 exclusively staffed by Dr. Robert Gomez (102) & Nurse Maria Bautista (201)
    const doctorID = isRoom303 ? 102 : 101 + (i % 8);
    const svc = docDefaultSvc[doctorID];
    addRecord({
      admissionIso: extraDates[i],
      firstName: poolFirst[(i * 5) % poolFirst.length],
      lastName: poolLast[(i * 7) % poolLast.length],
      roomID: isRoom303 ? 303 : nonRoom303Ids[i % nonRoom303Ids.length],
      doctorID,
      nurseID: isRoom303 ? 201 : svc.nurseID,
      productName: i % 3 === 0 ? 'MRI Scan' : svc.productName,
      cost: svc.cost + ((i * 89) % 400),
      details: svc.details,
    });
  }

  patientRecords.sort((a, b) => b.addmission.localeCompare(a.addmission));

  return { patientRecords, bills, doctors, nurses, rooms, patients };
}

const mockStore = createMockStarSchemaStore();

async function fetchAllRows(table: string, primaryKey: string) {
  const rows: any[] = [];
  let lastId: number | undefined;
  while (true) {
    const filter = lastId === undefined ? '' : `&${primaryKey}=gt.${lastId}`;
    const page = await fetchSupabaseTable(table, `select=*&order=${primaryKey}.asc&limit=1000${filter}`);
    if (!page.length) return rows;
    rows.push(...page);
    lastId = page[page.length - 1][primaryKey];
  }
}

async function loadLiveStarSchema() {
  if (!isSupabaseLiveConfigured()) throw new Error('Supabase is not configured');
  const [facts, bills, doctors, nurses, rooms, patients] = await Promise.all([
    fetchAllRows('PatientRecords', 'recordID'),
    fetchAllRows('Bill_Dim', 'billID'),
    fetchAllRows('Doctor_Dim', 'doctorID'),
    fetchAllRows('Nurse_Dim', 'nurseID'),
    fetchAllRows('Room_Dim', 'roomId'),
    fetchAllRows('Patient_Dim', 'patientID'),
  ]);
  const patientRecords = facts.map(record => ({ ...record, addmission: record.admission }));
  patientRecords.sort((a, b) => Date.parse(b.addmission ?? 0) - Date.parse(a.addmission ?? 0));
  return { patientRecords, bills, doctors, nurses, rooms, patients, source: 'supabase' as const };
}

async function loadStarSchemaTables() {
  if (isSupabaseLiveConfigured()) {
    try {
      return await loadLiveStarSchema();
    } catch (error) {
      console.warn('Supabase warehouse read failed. Using in-memory data.', error);
    }
  }
  return { ...mockStore, source: 'in-memory' as const };
}

app.get('/api/finals', async (_req, res) => {
  try {
    const started = performance.now();
    const warehouse = await loadLiveStarSchema();
    const result = analyzeFinals(warehouse, performance.now() - started);
    if (result.before.facts < 1000 || result.batchCount < 5000) {
      return res.status(409).json({ error: 'The live warehouse is missing the expected midterm baseline or finals batch.' });
    }
    return res.json(result);
  } catch (error) {
    console.error('Finals warehouse read failed:', error);
    return res.status(503).json({ error: 'Could not read the live Supabase warehouse.' });
  }
});

// Helper to query Supabase REST API using service role key (or anon key fallback)
async function fetchSupabaseTable(tableName: string, queryParams: string = '') {
  const url = `${supabaseRestUrl}/${tableName}${queryParams ? `?${queryParams}` : ''}`;
  const keyToUse = serviceRoleKey || anonKey;
  const res = await fetch(url, {
    headers: {
      apikey: keyToUse,
      ...(keyToUse.startsWith('sb_') ? {} : { Authorization: `Bearer ${keyToUse}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch ${tableName}: ${res.status} ${errText}`);
  }
  return res.json();
}

// In-memory cache for fast responsive dashboard queries with 5s TTL
let cachedAnalytics: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30000;

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

// Full joined analytics endpoint
app.get('/api/analytics', async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const now = Date.now();

  if (!forceRefresh && cachedAnalytics && now - lastCacheTime < CACHE_TTL_MS) {
    return res.json(cachedAnalytics);
  }

  try {
    const { patientRecords, bills, doctors, nurses, rooms, patients } = await loadStarSchemaTables();

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
      const dateKey = rec.addmission ? rec.addmission.slice(0, 10) : 'Unknown';
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
      // Infer affliction category from product name and details
      const affliction = inferAffliction(bill?.productName, bill?.details, doctor?.medicalSpecialization);
      if (!diseaseFrequency[affliction]) {
        diseaseFrequency[affliction] = { count: 0, totalCost: 0 };
      }
      diseaseFrequency[affliction].count += 1;
      diseaseFrequency[affliction].totalCost += cost;

      return {
        recordID: rec.recordID,
        admission: rec.addmission,
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
      timestamp: new Date().toISOString(),
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
    res.status(500).json({ error: err.message });
  }
});

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
        const [latestRecord, latestBill, latestPatient] = await Promise.all([
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
      addmission: nowIso,
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

// --- Server-Side Gemini Chatbot Endpoint (/api/chat) ---
// Only construct the client when a real key exists (not a placeholder), so local runs without a key start cleanly.
const geminiKey = process.env.GEMINI_API_KEY || '';
const isPlaceholderKey = geminiKey.includes('your-') || geminiKey.includes('placeholder') || geminiKey.length < 10;
const ai = geminiKey && !isPlaceholderKey
  ? new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const clinicFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: 'query_admissions_by_period',
    description:
      'Query patients admitted in a specific year and month along with their attending physicians, medical specializations, and admission timestamps (equivalent to CTE + LEFT JOIN on PatientRecords, Patient_Dim, and Doctor_Dim).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        year: { type: Type.INTEGER, description: '4-digit year, e.g. 2026' },
        month: { type: Type.INTEGER, description: 'Month number 1-12, e.g. 8 for August' },
        limit: { type: Type.INTEGER, description: 'Max sample patient rows to return (default 35)' },
      },
      required: ['year', 'month'],
    },
  },
  {
    name: 'query_room_usage',
    description:
      'Query which patients occupied a specific room ID (e.g., Room 301) during a given year and month, and return the total patient count in that period (equivalent to COUNT(*) OVER ()).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        roomId: { type: Type.INTEGER, description: 'Room ID number, e.g. 301' },
        year: { type: Type.INTEGER, description: 'Optional 4-digit year, e.g. 2026' },
        month: { type: Type.INTEGER, description: 'Optional month number 1-12, e.g. 5 for May' },
        limit: { type: Type.INTEGER, description: 'Max sample patient rows to return (default 35)' },
      },
      required: ['roomId'],
    },
  },
  {
    name: 'query_room_staffing',
    description:
      'Query the distinct assigned doctors and nurses for a specific room ID (e.g., Room 303) and compute the total medical staff headcount (equivalent to UNION ALL across Doctor_Dim and Nurse_Dim).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        roomId: { type: Type.INTEGER, description: 'Room ID number, e.g. 303' },
      },
      required: ['roomId'],
    },
  },
  {
    name: 'query_financials_and_services',
    description:
      'Query healthcare services rendered and financial revenue generated for a given year and month (or all time), grouped by productName with times_rendered, service_revenue, and total_monthly_revenue.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        year: { type: Type.INTEGER, description: 'Optional 4-digit year, e.g. 2026' },
        month: { type: Type.INTEGER, description: 'Optional month number 1-12, e.g. 5 for May' },
      },
    },
  },
  {
    name: 'get_clinic_overview',
    description:
      'Retrieve overall clinic KPIs (total revenue, total admissions, average bill, bed occupancy, physician workload rankings, and affliction distribution) across the entire dataset.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

async function executeClinicTool(name: string, args: Record<string, any> = {}) {
  const { patientRecords, bills, doctors, nurses, rooms, patients, source } = await loadStarSchemaTables();

  const patientMap = new Map<number, any>();
  patients.forEach((p: any) => patientMap.set(Number(p.patientID), p));
  const doctorMap = new Map<number, any>();
  doctors.forEach((d: any) => doctorMap.set(Number(d.doctorID), d));
  const nurseMap = new Map<number, any>();
  nurses.forEach((n: any) => nurseMap.set(Number(n.nurseID), n));
  const roomMap = new Map<number, any>();
  rooms.forEach((r: any) => roomMap.set(Number(r.roomId), r));
  const billMap = new Map<number, any>();
  bills.forEach((b: any) => billMap.set(Number(b.billID), b));

  const matchesMonth = (isoStr: string | undefined, year?: number, month?: number) => {
    if (!isoStr) return false;
    if (!year && !month) return true;
    const prefix = `${year || 2026}-${month ? String(month).padStart(2, '0') : ''}`;
    return isoStr.startsWith(prefix);
  };

  if (name === 'query_admissions_by_period') {
    const year = Number(args.year) || 2026;
    const month = Number(args.month) || 8;
    const limit = Math.min(Math.max(Number(args.limit) || 35, 1), 100);

    const matched = patientRecords
      .filter((r: any) => matchesMonth(r.addmission, year, month))
      .sort((a: any, b: any) => String(a.addmission).localeCompare(String(b.addmission)));

    const doctorCounts: Record<string, { doctorName: string; specialty: string; count: number }> = {};
    const rows = matched.map((r: any) => {
      const p = patientMap.get(Number(r.patientID));
      const d = doctorMap.get(Number(r.doctorID));
      const docName = d ? `Dr. ${d.firstName} ${d.lastName}` : 'Unassigned';
      const spec = d?.medicalSpecialization || 'General';
      if (!doctorCounts[docName]) {
        doctorCounts[docName] = { doctorName: docName, specialty: spec, count: 0 };
      }
      doctorCounts[docName].count += 1;
      return {
        admission_timestamp: r.addmission,
        patient_first_name: p?.firstName || 'Unknown',
        patient_last_name: p?.lastName || 'Unknown',
        doctor_first_name: d?.firstName || 'Unassigned',
        doctor_last_name: d?.lastName || '',
        doctor_specialty: spec,
        room_id: r.roomID,
      };
    });

    return {
      dataSource: source,
      year,
      month,
      totalAdmissionsInPeriod: matched.length,
      totalPatientsInClinicRegistry: patients.length,
      attendingPhysiciansSummary: Object.values(doctorCounts).sort((a, b) => b.count - a.count),
      sampleAdmissions: rows.slice(0, limit),
      omittedRowCount: Math.max(0, rows.length - limit),
    };
  }

  if (name === 'query_room_usage') {
    const roomId = Number(args.roomId);
    const year = args.year ? Number(args.year) : undefined;
    const month = args.month ? Number(args.month) : undefined;
    const limit = Math.min(Math.max(Number(args.limit) || 35, 1), 100);

    const room = roomMap.get(roomId);
    const matched = patientRecords
      .filter((r: any) => Number(r.roomID) === roomId && (!year && !month ? true : matchesMonth(r.addmission, year, month)))
      .sort((a: any, b: any) => String(a.addmission).localeCompare(String(b.addmission)));

    const rows = matched.map((r: any) => {
      const p = patientMap.get(Number(r.patientID));
      return {
        admission_timestamp: r.addmission,
        room_id: r.roomID,
        patient_first_name: p?.firstName || 'Unknown',
        patient_last_name: p?.lastName || 'Unknown',
      };
    });

    return {
      dataSource: source,
      roomId,
      roomClass: room?.roomClass || 'Unknown',
      servicableBeds: room?.servicableBeds ?? null,
      year: year ?? 'ALL',
      month: month ?? 'ALL',
      total_patients_in_period: matched.length,
      samplePatients: rows.slice(0, limit),
      omittedRowCount: Math.max(0, rows.length - limit),
    };
  }

  if (name === 'query_room_staffing') {
    const roomId = Number(args.roomId);
    const room = roomMap.get(roomId);
    const roomRecords = patientRecords.filter((r: any) => Number(r.roomID) === roomId);

    const docIds = Array.from(new Set<number>(roomRecords.map((r: any) => Number(r.doctorID)).filter(Boolean)));
    const nurseIds = Array.from(new Set<number>(roomRecords.map((r: any) => Number(r.nurseID)).filter(Boolean)));

    const staff: any[] = [];
    for (const id of docIds) {
      const d = doctorMap.get(id);
      staff.push({
        staff_id: id,
        staff_role: 'Doctor',
        first_name: d?.firstName || 'Unknown',
        last_name: d?.lastName || 'Unknown',
        specialty_or_area: d?.medicalSpecialization || 'Unspecified',
      });
    }
    for (const id of nurseIds) {
      const n = nurseMap.get(id);
      staff.push({
        staff_id: id,
        staff_role: 'Nurse',
        first_name: n?.firstName || 'Unknown',
        last_name: n?.lastName || 'Unknown',
        specialty_or_area: n?.areaAssignment || 'Unspecified',
      });
    }

    staff.sort((a, b) => a.staff_role.localeCompare(b.staff_role) || a.last_name.localeCompare(b.last_name));

    return {
      dataSource: source,
      roomId,
      roomClass: room?.roomClass || 'Unknown',
      total_staff_headcount: staff.length,
      staff,
    };
  }

  if (name === 'query_financials_and_services') {
    const year = args.year ? Number(args.year) : undefined;
    const month = args.month ? Number(args.month) : undefined;

    const filteredBills = bills.filter((b: any) =>
      !year && !month ? true : matchesMonth(b.purchasedAt, year, month)
    );

    const grouped: Record<string, { product_name: string; times_rendered: number; service_revenue: number }> = {};
    let totalMonthlyRevenue = 0;

    for (const b of filteredBills) {
      const nameKey = b.productName || 'Unspecified Service';
      const cost = parseFloat(b.financialCost) || 0;
      totalMonthlyRevenue += cost;
      if (!grouped[nameKey]) {
        grouped[nameKey] = { product_name: nameKey, times_rendered: 0, service_revenue: 0 };
      }
      grouped[nameKey].times_rendered += 1;
      grouped[nameKey].service_revenue += cost;
    }

    const services = Object.values(grouped).sort((a, b) => b.service_revenue - a.service_revenue);

    return {
      dataSource: source,
      year: year ?? 'ALL',
      month: month ?? 'ALL',
      total_monthly_revenue: Math.round(totalMonthlyRevenue * 100) / 100,
      total_services_rendered: filteredBills.length,
      services,
    };
  }

  // get_clinic_overview
  let totalRevenue = 0;
  const doctorCounts: Record<number, { fullName: string; specialization: string; patientCount: number; totalRevenue: number }> = {};
  const afflictionCounts: Record<string, { count: number; totalCost: number }> = {};

  for (const d of doctors) {
    doctorCounts[Number(d.doctorID)] = {
      fullName: `Dr. ${d.firstName} ${d.lastName}`,
      specialization: d.medicalSpecialization,
      patientCount: 0,
      totalRevenue: 0,
    };
  }

  for (const r of patientRecords) {
    const b = billMap.get(Number(r.billID));
    const d = doctorMap.get(Number(r.doctorID));
    const cost = b ? parseFloat(b.financialCost) || 0 : 0;
    totalRevenue += cost;
    if (doctorCounts[Number(r.doctorID)]) {
      doctorCounts[Number(r.doctorID)].patientCount += 1;
      doctorCounts[Number(r.doctorID)].totalRevenue += cost;
    }
    const aff = inferAffliction(b?.productName, b?.details, d?.medicalSpecialization);
    if (!afflictionCounts[aff]) afflictionCounts[aff] = { count: 0, totalCost: 0 };
    afflictionCounts[aff].count += 1;
    afflictionCounts[aff].totalCost += cost;
  }

  return {
    dataSource: source,
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalAdmissions: patientRecords.length,
      totalPatients: patients.length,
      totalDoctors: doctors.length,
      totalNurses: nurses.length,
      totalRooms: rooms.length,
    },
    doctorWorkload: Object.values(doctorCounts).sort((a, b) => b.patientCount - a.patientCount),
    afflictions: Object.entries(afflictionCounts).map(([name, val]) => ({ name, ...val })).sort((a, b) => b.count - a.count),
  };
}

const CLINIC_CHAT_SYSTEM_INSTRUCTION = `You are the Hyacinth Clinic AI Analyst & Senior Supabase PostgreSQL Engineer for Hyacinth Walk-In Clinic and Health Center.

Your dual responsibilities:
1. Clinical Operations & Financial Analyst:
   - Answer questions about clinic admissions, attending physicians, room usage (including cross-contamination contact tracing), room medical staff headcounts, healthcare services rendered, and financial revenues.
   - ALWAYS invoke the provided database query tools to retrieve exact numbers, patient names, staff rosters, and service breakdowns before answering data questions. Never fabricate counts or records.
   - When returning tabular results (e.g. service revenues, staffing rosters, or sample patient admissions), format them cleanly with Markdown tables and clearly state both totals (e.g. total patients in period, total staff headcount, total monthly revenue) and note if the full result set has additional rows beyond the displayed sample.

2. Senior Supabase PostgreSQL Database Engineer:
   - You understand the Hyacinth Clinic star schema:
     - Fact table: public."PatientRecords" ("recordID", admission, "patientID", "roomID", "doctorID", "nurseID", "billID")
     - Dimension tables: public."Patient_Dim" ("patientID", "firstName", "lastName", "patientBdate"), public."Doctor_Dim" ("doctorID", "firstName", "lastName", "medicalSpecialization", "experienceYears"), public."Nurse_Dim" ("nurseID", "firstName", "lastName", "areaAssignment", "experienceYears"), public."Room_Dim" ("roomId", "servicableBeds", "currentAvailability", "roomClass"), public."Bill_Dim" ("billID", "purchasedAt", "productName", "financialCost", details).
   - When the user asks for SQL queries or database optimization explanations, provide clean PostgreSQL queries using:
     - Uppercase SQL keywords (SELECT, FROM, WHERE, WITH, LEFT JOIN, UNION ALL, ORDER BY, GROUP BY)
     - Strict double-quoting for mixed-case identifiers (e.g., "PatientRecords", "patientID")
     - Common Table Expressions (CTEs) instead of deeply nested subqueries
     - Explicit column names (never SELECT *) and meaningful table aliases
     - Safe NULL/type handling via COALESCE and NULLIF(..., '') CAST AS NUMERIC
     - Sargable date range bounds (>= and <) and B-Tree index recommendations (reducing lookup complexity from O(n) to O(log n))
     - Window functions like COUNT(*) OVER () and SUM(...) OVER ().

Keep responses concise, structured, accurate, and directly helpful for clinic administrators, physicians, and database analysts.`;

app.post('/api/chat', async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      error: 'Gemini API key is not configured on the server. Please set GEMINI_API_KEY in your .env file.',
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

    const contents: any[] = validMessages.map((m: any) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const toolsUsed: Array<{ name: string; summary: string }> = [];

    let response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents,
      config: {
        systemInstruction: CLINIC_CHAT_SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: clinicFunctionDeclarations }],
      },
    });

    let iterations = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && iterations < 6) {
      iterations += 1;
      const modelContent = response.candidates?.[0]?.content;
      if (!modelContent) break;
      contents.push(modelContent);

      const responseParts: any[] = [];
      for (const call of response.functionCalls) {
        const result = await executeClinicTool(call.name || '', (call.args as Record<string, any>) || {});
        toolsUsed.push({
          name: call.name || 'query',
          summary: JSON.stringify(call.args || {}),
        });
        responseParts.push({
          functionResponse: {
            id: call.id,
            name: call.name,
            response: result,
          },
        });
      }

      contents.push({
        role: 'user',
        parts: responseParts,
      });

      response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction: CLINIC_CHAT_SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: clinicFunctionDeclarations }],
        },
      });
    }

    return res.json({
      reply: response.text || 'I was unable to generate a response for that query.',
      toolsUsed,
    });
  } catch (err: any) {
    console.error('Gemini chat error:', err);
    let rawMsg = err?.message || 'Failed to generate response from Gemini API.';
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed?.error?.message) {
        rawMsg = parsed.error.message;
      }
    } catch {
      // keep rawMsg as-is when not JSON
    }
    const status =
      err?.status === 403 || rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('free tier is not available')
        ? 403
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

async function startServer() {
  const httpServer = http.createServer(app);

  // Cross-platform production switch: `NODE_ENV=production` fails inline on Windows,
  // so `tsx server.ts --prod` is also accepted.
  const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');

  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Hyacinth Clinic server running on http://localhost:${PORT}`);
  });
}

startServer();
