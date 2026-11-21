# Hyacinth Clinic — Hospital Analytics & Supabase Platform

A real-time healthcare intelligence dashboard and data management platform for **Hyacinth Clinic**, built with React, Vite, Express, and Supabase. The platform pairs a live star-schema analytics warehouse with direct client-side Supabase REST and `@supabase/supabase-js` integrations.

---

## 1. Overview

**Hyacinth Clinic** analytics provides clinic administrators, medical directors, and healthcare executives with continuous visibility into hospital throughput, patient admissions, physician caseloads, disease frequency, and financial performance.

### Key Capabilities
- **Live Supabase REST Telemetry**: Connected directly to the Hyacinth Clinic Supabase database (`https://cpgomiuqhuwyrzzcozcu.supabase.co`).
- **Star Schema Data Warehouse**: Relational star-schema with a central `PatientRecords` fact table linked to 5 dimension tables.
- **Glassmorphic Medical Aesthetics**: Clean hospital light theme featuring subtle frosted glass cards, mint/emerald accents, and monospace tabular numerals.
- **Client-Side Quickstart Instruments Registry**: Direct `@supabase/supabase-js` integration using React's `useEffect` to fetch and manage clinic equipment from `public.instruments`.

---

## 2. Database Star Schema Architecture

The clinic's relational warehouse is structured according to the following star schema:

```
                          ┌──────────────┐
                          │ Patient_Dim  │
                          ├──────────────┤
                          │• patientID   │(PK)
                          │  firstName   │
                          │  lastName    │
                          │  patientBdate│
                          └──────┬───────┘
                                 │
  ┌──────────────┐               │               ┌──────────────┐
  │   Room_Dim   │               │               │  Doctor_Dim  │
  ├──────────────┤               │               ├──────────────┤
  │• roomId      │(PK)           │               │• doctorID    │(PK)
  │  serviceStart│               │               │  regist.Date │
  │  servicable  │               │               │  firstName   │
  │  availability│               ▼               │  specializ.  │
  │  roomClass   │──────►┌──────────────┐◄───────│  experience  │
  └──────────────┘       │PatientRecords│        └──────────────┘
                         │ (Fact Table) │
                         ├──────────────┤
  ┌──────────────┐       │# recordID(PK)│        ┌──────────────┐
  │  Nurse_Dim   │       │  addmission  │        │   Bill_Dim   │
  ├──────────────┤       │  patientID   │        ├──────────────┤
  │• nurseID     │(PK)   │  roomID      │        │• billID      │(PK)
  │  firstName   │──────►│  doctorID    │───────►│  purchasedAt │
  │  lastName    │       │  nurseID     │        │  productName │
  │  areaAssign  │       │  billID      │        │  finan.Cost  │
  │  experience  │       └──────────────┘        │  details     │
  └──────────────┘                               └──────────────┘
```

### Table Dictionary
1. **`PatientRecords` (Fact Table)**: The central admission record recording each patient stay, containing admission timestamps and foreign keys referencing all dimensions.
2. **`Bill_Dim` (Dimension Table)**: Records financial transaction details, itemized medical service or test names (`productName`), billed monetary values (`financialCost`), and clinical notes (`details`).
3. **`Doctor_Dim` (Dimension Table)**: Stores physician credentials, medical specializations (Cardiology, Pediatrics, General Surgery, Internal Medicine, etc.), and years of experience.
4. **`Nurse_Dim` (Dimension Table)**: Tracks staff nurses, licensing, and clinical area assignments (Emergency Room, Pediatrics, Intensive Care, Ward).
5. **`Room_Dim` (Dimension Table)**: Tracks facility bed capacity, room classes (ICU Suite, Standard, Semi-Private, General Ward), and live availability.
6. **`Patient_Dim` (Dimension Table)**: Patient demographic master records including name and date of birth.

---

## 3. Data Visualizations Suite

The dashboard presents three dedicated interactive analytics visualizations:

### 1. Financial Costs Timeline (Line Graph)
- **Visualization**: Continuous SVG Bézier line graph with a soft green gradient area fill and interactive hover tooltips displaying date, daily billed cost, and admission count.
- **Controls**:
  - Filter time periods: `All Time`, `Q1 (Jan-Mar)`, `Q2 (Apr-Jun)`, `Q3 (Jul-Sep)`, and `Last 30 Days`.
  - Toggle metric mode: `Daily Cost` vs. `Cumulative Revenue`.

### 2. Doctor Patient Caseload (Bar Graph)
- **Visualization**: Horizontal progress bars ranking clinic physicians by total patient volume.
- **Attributes**: Annotates physician name, medical specialization, years of experience, and gross revenue generated.
- **Interactivity**: Clicking any physician bar isolates their admissions in the live patient records ledger.

### 3. Diseases & Clinical Afflictions (Pie / Donut Graph)
- **Visualization**: Multi-segment SVG Donut chart categorizing diagnoses and clinical treatments encountered across admissions.
- **Affliction Categories**:
  - Respiratory & Pulmonary
  - Cardiovascular Conditions
  - Renal & Urological
  - Neurological & Musculoskeletal
  - Trauma & Acute Surgery
  - Infectious & Metabolic
  - Preventive & General Medicine
  - Pediatric Care
- **Interactivity**: Hover slice focus, percentage share, case count, and ledger filter on click.

---

## 4. Supabase Quickstart Integration (Instruments Table)

In addition to the star-schema warehouse, the application includes direct client-side integration with Supabase following the [official Supabase React Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs.md).

### Implementation Details
- Initialized in `src/lib/supabase.ts` using `createClient(supabaseUrl, supabaseKey)`.
- Client-side component `src/components/InstrumentsView.tsx` uses React's `useEffect` to query the `instruments` table:
  ```typescript
  useEffect(() => {
    async function getInstruments() {
      const { data, error } = await supabase.from('instruments').select('*');
      if (data) setInstruments(data);
    }
    getInstruments();
  }, []);
  ```
- Supports interactive insertion of new hospital instruments (`supabase.from('instruments').insert(...)`).
- Built-in SQL setup runner displaying the SQL required to create `public.instruments` in the Supabase SQL Editor.

```sql
-- Create the instruments table
create table instruments (
  id bigint primary key generated always as identity,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table instruments enable row level security;

-- Allow anonymous read & write for quickstart demo
create policy "Public read instruments" on public.instruments for select to anon using (true);
create policy "Public insert instruments" on public.instruments for insert to anon with check (true);
```

---

## 5. Configuration & Environment Variables

Environment variables are defined in `.env` and `.env.local`:

```bash
# Public Client Variables (Safe to expose in browser)
VITE_SUPABASE_URL="https://cpgomiuqhuwyrzzcozcu.supabase.co"
VITE_SUPABASE_ANON_KEY="<your-supabase-anon-key>"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-supabase-anon-key>"
NEXT_PUBLIC_SUPABASE_URL="https://cpgomiuqhuwyrzzcozcu.supabase.co/rest/v1/"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-supabase-anon-key>"

# Private Backend Variables (Restricted to server-side Node.js)
SUPABASE_SERVICE_ROLE_KEY="<your-supabase-service-role-key>"
```

---

## 6. Running the Application

### Prerequisites
- Node.js 20 or newer (`node --version`)
- Dependencies installed once: `npm install`

### Development (works with no database — falls back to demo data)
```bash
npm run dev
```
Then open **http://localhost:3000**. The server is a single Express process that mounts Vite in middleware mode, so `/api/*` and the React app share the same origin (no separate frontend port, no CORS setup).

### Production Build
```bash
npm start   # runs `vite build`, then serves dist/ on http://localhost:3000
```
Set a different port with `PORT=4000 npm run dev` (Windows PowerShell: `$env:PORT=4000; npm run dev`).

### Windows notes
- If PowerShell blocks npm (`npm.ps1 cannot be loaded because running scripts is disabled`), either run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or call `npm.cmd` instead of `npm`.
- `NODE_ENV=production npm start` style commands do not work in Windows shells; the scripts above avoid that by using the `--prod` flag.

### Optional integrations
The dashboard runs offline with the in-memory star schema (378 admissions). Copy `.env.example` to `.env` to enable the live services, and restart the server afterwards:

| Variable | Effect |
| --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`) | Server reads the live star schema and the Instruments tab uses real `public.instruments` rows. Must be exposed to Vite, so they are sent to the browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only; preferred over the anon key for inserts from the New Record modal. |
| `GROQ_API_KEY` | Enables the "Clinic AI Analyst" chat (`/api/chat`). Without it the endpoint returns 503 and the rest of the app is unaffected. |

Check what the server picked up at **http://localhost:3000/api/health**: `"mode": "supabase-live"` means the database is connected, `"mode": "in-memory-fallback"` means you are on demo data.
