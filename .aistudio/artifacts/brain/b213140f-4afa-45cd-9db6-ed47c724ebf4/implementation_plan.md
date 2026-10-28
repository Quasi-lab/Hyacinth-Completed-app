# Hyacinth Clinic — Supabase Integration & Clinical Instruments Expansion

An enhancement to the **Hyacinth Clinic** dashboard integrating Supabase client-side queries for an **Instruments** table alongside the full star-schema analytics platform (`PatientRecords`, `Bill_Dim`, `Doctor_Dim`, `Nurse_Dim`, `Room_Dim`, `Patient_Dim`), configuring `.env.local`, and providing comprehensive project documentation in `README.md`.

## User Review & Critical Decisions

> [!IMPORTANT]
> The implementation plan incorporates your confirmed preferences:
> - **Navigation & Architecture**: Integrate the Supabase Quickstart "Instruments" table as a dedicated, first-class tab in the Hyacinth Clinic dashboard rather than replacing the clinical analytics suite.
> - **Environment & Keys**: Populate `.env.local` with your active Supabase project credentials (`https://cpgomiuqhuwyrzzcozcu.supabase.co`) with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_SUPABASE_PUBLISHABLE_KEY`.
> - **Supabase Client Implementation**: Instantiate `@supabase/supabase-js` in a shared client module (`src/lib/supabase.ts`) and use `useEffect` to fetch and render the instruments list as outlined in the official Supabase React quickstart.
> - **Resilient Schema Seeder & SQL Helper**: Provide a one-click setup and SQL runner in the Instruments tab with medical/clinical instruments (e.g., Defibrillator, Cardiac Monitor, Laparoscope, Ultrasound Probe) and classic instruments, with error handling if the table requires creation or RLS permissions in Supabase.
> - **Project Documentation**: Create a clean, thorough `README.md` documenting the architecture, database star schema, the three visual graphs, Supabase configuration, and run instructions.

---

## 1. Overview & Core Concept

- **What It Does**: Unites the live hospital intelligence dashboard (financial line graph, doctor patient load bar graph, diseases/afflictions pie graph, and joined patient ledger) with a live Supabase client-side Instruments registry.
- **Target Audience**: Hospital technicians, biomedical engineers, and clinic administrators tracking clinic equipment, instruments, and surgical tools.
- **Key Value**: Delivers both high-level executive analytics and direct client-side Supabase data fetching following standard Supabase quickstart best practices.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **New "Instruments" Tab in Top Bar**:
   - Navigation link: `Overview` · `Financials` · `Physicians` · `Afflictions` · `Instruments` · `Records`.
   - Dedicated glassmorphism view showing live instrument items queried directly via `@supabase/supabase-js` inside a React `useEffect`.
2. **Instruments Registry & Quickstart Console**:
   - Live status card confirming connection to `https://cpgomiuqhuwyrzzcozcu.supabase.co`.
   - Grid and table view of registered clinical & diagnostic instruments.
   - Quick "Add Instrument" action form.
   - Setup helper with the exact SQL command to run in the Supabase SQL Editor if the table has not yet been initialized.
3. **Core Dashboard Analytics Preserved**:
   - Financial Costs Line Graph with time filters.
   - Doctor Patient Load Bar Graph with physician isolation.
   - Clinical Diseases & Afflictions Pie Graph with condition drill-downs.
   - Live Patient Records Ledger with slide-over case details.

---

## 3. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Hyacinth Clinic Dashboard                       │
├──────────────────┬─────────────────────────────┬───────────────────────┤
│ Top Bar Contract │ Brand: "Hyacinth Clinic"    │ Live Sync & Modals    │
│                  │ Nav: Overview/Financials/   │ Auto-Refresh Toggle   │
│                  │      Physicians/Afflictions/│                       │
│                  │      Instruments/Records    │                       │
├──────────────────┴─────────────────────────────┴───────────────────────┤
│ [Active Tab View]                                                      │
│ ├─ Overview / Financials / Physicians / Afflictions: Star-Schema Views │
│ ├─ Instruments: Supabase Client useEffect Fetch & Management Console   │
│ └─ Records: Star-Schema Fact Table Joined Ledger                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               │                                         │
       [Client-Side Supabase]                    [Full-Stack Server]
      @supabase/supabase-js                     Express Server (/api/*)
    VITE_SUPABASE_URL & ANON_KEY                 Service Role Key Proxy
               │                                         │
               └────────────────────┬────────────────────┘
                                    ▼
                      ┌───────────────────────────┐
                      │    Supabase REST API      │
                      │  https://...supabase.co   │
                      ├───────────────────────────┤
                      │ • instruments (Quickstart)│
                      │ • PatientRecords (Fact)   │
                      │ • Bill_Dim                │
                      │ • Doctor_Dim              │
                      │ • Nurse_Dim               │
                      │ • Room_Dim                │
                      │ • Patient_Dim             │
                      └───────────────────────────┘
```

### Component Structure
- `src/lib/supabase.ts`: Supabase client initialization using `createClient` with `.env.local` / `import.meta.env`.
- `src/components/InstrumentsView.tsx`: React component fetching and displaying the `instruments` table using `useEffect`, handling loading, error, empty state, and new instrument insertion.
- `/.env.local`: Configured with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `/README.md`: Complete project documentation detailing the clinic overview, star schema, three core graphs, Supabase configuration, and quickstart guide.
