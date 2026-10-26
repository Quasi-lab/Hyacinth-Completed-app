# Hyacinth Clinic — Financial & Clinical Analytics Dashboard

A live healthcare analytics platform for **Hyacinth Clinic**, connecting to the user's Supabase star-schema database (`PatientRecords`, `Bill_Dim`, `Patient_Dim`, `Doctor_Dim`, `Nurse_Dim`, and `Room_Dim`). Featuring glassmorphism medical aesthetics and three dedicated data visualization graphs:
1. **Financial Costs Timeline (Line Graph)** with interactive time period controls (Weekly, Monthly, Quarterly, All-Time).
2. **Doctor Patient Load (Bar Graph)** displaying the distribution of patients handled by each physician.
3. **Clinical Diseases & Afflictions (Pie / Donut Graph)** categorizing diagnoses and treatments encountered by the clinic.

## User Review & Critical Decisions

> [!IMPORTANT]
> The implementation plan has been updated to center around your three requested visualizations:
> - **Graph 1 (Line Graph)**: Financial costs & billings over time (`purchasedAt` / `addmission`), with dynamic time-window filtering (Daily / Weekly / Monthly / Custom range) and cumulative vs. periodic trend toggle.
> - **Graph 2 (Bar Graph)**: Number of patients handled per doctor (`Doctor_Dim` joined with `PatientRecords`), with doctor specialization annotations and workload sorting.
> - **Graph 3 (Pie/Donut Graph)**: Breakdown of diseases, afflictions, and medical diagnoses encountered by the clinic (`Bill_Dim.details` / diagnosis classification in admission records).
> - **Sync & Connectivity**: Direct Supabase REST API queries with auto-refresh (15s/30s/60s), live sync status, and a one-click Star-Schema Seeder to generate realistic clinical diagnosis and financial records if tables are empty.
> - **Aesthetic Identity**: Clean hospital light theme with glassmorphism (frosted white and emerald surfaces, mint glow highlights, clean slate typography) branded for **"Hyacinth Clinic"**.

---

## 1. Overview & Core Concept

- **What It Does**: Hyacinth Clinic Analytics delivers immediate clinical and fiscal intelligence. It aggregates the clinic's star schema into three high-impact visual graphs, an executive KPI ribbon, a live patient billing ledger, and an interactive database inspector.
- **Target Audience / Persona**: Hospital directors, clinic administrators, and department heads at Hyacinth Clinic tracking operational performance, disease prevalence, and revenue velocity.
- **Key Value**: Provides immediate visual answers to: "What are our revenue trends over time?", "Which doctors carry the highest patient caseload?", and "What are the most common ailments treated at Hyacinth Clinic?".

---

## 2. User Experience & Visual Design

### Key User Flows & Visual Components
1. **Header & Control Bar**:
   - Wordmark: "Hyacinth Clinic" in `Plus Jakarta Sans` with clean clinical subtitle.
   - Live Connection Status pill displaying Supabase REST latency and sync status.
   - Auto-refresh toggle (15s, 30s, 60s, Pause) + Manual Refresh button.
   - Quick Action: "Seed Sample Star-Schema" button for instant database population.
2. **Executive Financial & Clinical KPI Strip**:
   - Total Clinic Revenue (`font-mono tabular-nums`).
   - Average Cost per Patient Admission.
   - Active Patients Admitted.
   - Bed Occupancy & Room Availability rate.
3. **The Core Visualizations Trio (User Requested)**:
   - **Visualization 1: Financial Costs Over Time (Interactive Line Graph)**
     - Rendered with smooth curves, gradient area fill beneath the stroke, and interactive hover tooltips with exact currency amounts and dates.
     - Time period filter pills: `Last 7 Days`, `Last 30 Days`, `Last 90 Days`, `Year to Date`, `All Time`.
   - **Visualization 2: Patients Handled by Doctors (Interactive Bar Graph)**
     - Horizontal or vertical bars ranking physicians by patient volume.
     - Displays doctor's name, medical specialization (e.g. Cardiology, Pediatrics, Orthopedics, General Surgery), and patient count.
     - Clickable bars to filter the patient ledger below to that specific doctor.
   - **Visualization 3: Diseases & Afflictions Encountered (Interactive Pie / Donut Graph)**
     - Breakdown of primary diagnoses (e.g. Hypertension, Type 2 Diabetes, Acute Respiratory Infections, Fracture / Trauma, Coronary Artery Disease, Gastroenteritis, etc.).
     - Segment percentages, count of cases, and interactive legend with toggle-to-isolate.
4. **Live Patient Records & Billing Ledger**:
   - Searchable, paginated table of `PatientRecords` joined with `Patient_Dim`, `Doctor_Dim`, `Nurse_Dim`, `Room_Dim`, and `Bill_Dim`.
   - Slide-over detail drawer displaying the itemized patient record and breakdown.

### Visual Identity & Theme Tokens
- **Style**: Light clinical glassmorphism. Frosted cards (`bg-white/75 backdrop-blur-md border border-emerald-100 shadow-sm hover:shadow-md transition-all`).
- **Palette**:
  - Dominant Neutral (60%): Clean hospital ivory/light mint tint (`#F8FAFC`, `#F0FDF4`).
  - Structural Glass (30%): Frosted white card layers with soft emerald hairline borders (`border-emerald-200/50`).
  - Accent Green (10%): Botanical emerald (`#059669`), deep jade (`#047857`), and soft sage accents.
- **Typography**:
  - Display & Headings: `Plus Jakarta Sans`.
  - Body: `DM Sans`.
  - Metrics & Currency: `font-mono tabular-nums`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Interactive SVG / Canvas Visualization Engine (Chart.js / Recharts / Lightweight SVG)**
  - *Chosen Approach*: Implement responsive, high-framerate interactive charts (clean tooltips, animations, color coding matching the Hyacinth green palette) without heavyweight dependencies that cause bundle bloat.
  - *Why*: Ensures zero-glitch rendering, crystal-clear labels, and immediate responsive scaling.
- **Decision 2: Direct Supabase REST + Backend Service Role Fallback**
  - *Chosen Approach*: Client uses the Anon key for fast reads directly from the Supabase REST endpoint (`/rest/v1/PatientRecords?select=*...`). An Express backend route (`/api/seed` and `/api/check-tables`) utilizes the private `SUPABASE_SERVICE_ROLE_KEY` to run table verification and bulk mock seeding safely without leaking the service role key to the browser.
  - *Why*: Strict security separation between public client variables and private backend keys as requested in your prompt.
- **Decision 3: Realistic Affliction & Diagnosis Modeling**
  - *Chosen Approach*: Map diagnoses through `Bill_Dim.productName` and `Bill_Dim.details` (which store clinical service codes, prescription details, and condition notes in the provided schema) to derive clear clinical disease classifications for Graph 3.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Hyacinth Clinic Dashboard                       │
├──────────────────┬─────────────────────────────┬───────────────────────┤
│ Top Bar Contract │ Brand: "Hyacinth Clinic"    │ Live Sync & Seeder CTA│
│                  │ Breadcrumb: / Analytics     │ Auto-Refresh Toggle   │
├──────────────────┴─────────────────────────────┴───────────────────────┤
│ Financial & Clinical KPI Cards (Revenue, Patients, Avg Cost, Beds)     │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. Financial Cost Timeline     │ 2. Patients per Doctor                │
│    (Interactive Line Graph)    │    (Interactive Bar Graph)            │
│    Period: 7D / 30D / 90D / All│    Ranked by volume + Specialization  │
├────────────────────────────────┴───────────────────────────────────────┤
│ 3. Diseases & Afflictions Encountered (Interactive Pie / Donut Graph)  │
│    Clinical categories, percentages, case counts, and legend           │
├────────────────────────────────────────────────────────────────────────┤
│ Live Patient & Billing Records Table (Joined Star Schema View)         │
│ Search, Filter by Room/Doctor/Ailment, Itemized Bill Modal             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               │                                         │
       [Client REST Fetch]                       [Server Proxy & Seeder]
     Supabase Anon Key API                     Express /api/seed & /api/tables
               │                                         │
               └────────────────────┬────────────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │    Supabase REST API      │
                      │  https://...supabase.co   │
                      ├───────────────────────────┤
                      │ • PatientRecords (Fact)   │
                      │ • Bill_Dim                │
                      │ • Patient_Dim             │
                      │ • Doctor_Dim              │
                      │ • Nurse_Dim               │
                      │ • Room_Dim                │
                      └───────────────────────────┘
```

### Table Relationships in Star Schema
- `PatientRecords` (Fact): `recordID`, `addmission`, `patientID`, `roomID`, `doctorID`, `nurseID`, `billID`.
- `Bill_Dim`: `billID`, `purchasedAt`, `productName`, `financialCost`, `details`.
- `Patient_Dim`: `patientID`, `firstName`, `lastName`, `patientBdate`.
- `Doctor_Dim`: `doctorID`, `registrationDate`, `firstName`, `middleName`, `lastName`, `medicalSpecialization`, `scheduleHead`, `experienceYears`.
- `Nurse_Dim`: `nurseID`, `registrationDate`, `firstName`, `middleName`, `lastName`, `areaAssignment`, `experienceYears`.
- `Room_Dim`: `roomId`, `serviceStart`, `servicableBeds`, `currentAvailability`, `roomClass`.
