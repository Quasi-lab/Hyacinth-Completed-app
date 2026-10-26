import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

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
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Helper to query Supabase REST API using service role key (or anon key fallback)
async function fetchSupabaseTable(tableName: string, queryParams: string = '') {
  const url = `${supabaseRestUrl}/${tableName}${queryParams ? `?${queryParams}` : ''}`;
  const keyToUse = serviceRoleKey || anonKey;
  const res = await fetch(url, {
    headers: {
      apikey: keyToUse,
      Authorization: `Bearer ${keyToUse}`,
      'Content-Type': 'application/json',
      Prefer: 'count=exact',
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
const CACHE_TTL_MS = 5000;

app.get('/api/health', async (_req, res) => {
  try {
    const isConfigured = Boolean(supabaseBaseUrl && (serviceRoleKey || anonKey));
    res.json({
      status: 'ok',
      configured: isConfigured,
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
    // Fetch all 6 tables in parallel
    const [patientRecords, bills, doctors, nurses, rooms, patients] = await Promise.all([
      fetchSupabaseTable('PatientRecords', 'select=*&order=addmission.desc&limit=1000'),
      fetchSupabaseTable('Bill_Dim', 'select=*&limit=1000'),
      fetchSupabaseTable('Doctor_Dim', 'select=*'),
      fetchSupabaseTable('Nurse_Dim', 'select=*'),
      fetchSupabaseTable('Room_Dim', 'select=*'),
      fetchSupabaseTable('Patient_Dim', 'select=*&limit=1000'),
    ]);

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
function inferAffliction(productName?: string, details?: string, specialization?: string): string {
  const text = `${productName || ''} ${details || ''} ${specialization || ''}`.toLowerCase();

  if (text.includes('x-ray') || text.includes('chest') || text.includes('respiratory') || text.includes('pneumonia') || text.includes('bronchitis')) {
    return 'Respiratory & Pulmonary';
  }
  if (text.includes('ecg') || text.includes('cardio') || text.includes('blood pressure') || text.includes('hypertension') || text.includes('coronary')) {
    return 'Cardiovascular Conditions';
  }
  if (text.includes('urinalysis') || text.includes('renal') || text.includes('urine') || text.includes('kidney') || text.includes('urinary')) {
    return 'Renal & Urological';
  }
  if (text.includes('mri') || text.includes('brain') || text.includes('neuro') || text.includes('spine') || text.includes('cranial')) {
    return 'Neurological & Musculoskeletal';
  }
  if (text.includes('ct scan') || text.includes('trauma') || text.includes('surgery') || text.includes('abdomen') || text.includes('acute')) {
    return 'Trauma & Acute Surgery';
  }
  if (text.includes('blood test') || text.includes('panel') || text.includes('metabolic') || text.includes('diabetes') || text.includes('infectious')) {
    return 'Infectious & Metabolic';
  }
  if (text.includes('routine') || text.includes('checkup') || text.includes('consultation') || text.includes('general')) {
    return 'Preventive & General Medicine';
  }
  if (text.includes('pediatric')) {
    return 'Pediatric Care';
  }
  return 'General Clinical Diagnostic';
}

// Add new realistic patient admission record
app.post('/api/seed-record', async (req, res) => {
  try {
    const keyToUse = serviceRoleKey || anonKey;
    const body = req.body || {};

    // Get current max IDs to assign next sequence
    const [latestRecord, latestBill, latestPatient] = await Promise.all([
      fetchSupabaseTable('PatientRecords', 'select=recordID&order=recordID.desc&limit=1'),
      fetchSupabaseTable('Bill_Dim', 'select=billID&order=billID.desc&limit=1'),
      fetchSupabaseTable('Patient_Dim', 'select=patientID&order=patientID.desc&limit=1'),
    ]);

    const newRecordID = (Number(latestRecord[0]?.recordID) || 1000) + 1;
    const newBillID = (Number(latestBill[0]?.billID) || 2000) + 1;
    const newPatientID = (Number(latestPatient[0]?.patientID) || 1000) + 1;

    const patientName = body.patientName || 'Clara Oswald';
    const [first, ...rest] = patientName.split(' ');
    const last = rest.join(' ') || 'Vance';

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
        patientBdate: body.birthDate || '1990-05-14',
      }),
    });

    // 2. Create Bill_Dim entry
    const cost = body.cost || (Math.floor(Math.random() * 3500) + 800).toFixed(2);
    const productName = body.productName || 'Comprehensive Blood Test';
    const details = body.details || 'Diagnostic laboratory assessment conducted for inpatient evaluation.';

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
        purchasedAt: new Date().toISOString(),
        productName,
        financialCost: cost.toString(),
        details,
      }),
    });

    // 3. Create PatientRecords fact entry
    const doctorID = Number(body.doctorID) || 101;
    const nurseID = Number(body.nurseID) || 3001;
    const roomID = Number(body.roomID) || 301;

    const recordPayload = {
      recordID: newRecordID,
      addmission: new Date().toISOString(),
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
      return res.status(500).json({ error: `Failed to insert record: ${err}` });
    }

    // Invalidate cache
    cachedAnalytics = null;
    res.json({ success: true, recordID: newRecordID, billID: newBillID, patientID: newPatientID });
  } catch (err: any) {
    console.error('Error seeding record:', err);
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hyacinth Clinic server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
