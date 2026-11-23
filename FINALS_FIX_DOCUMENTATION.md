# Hyacinth Clinic Finals repair

## 1. Project Overview

Hyacinth Clinic is a React and Vite dashboard with an Express API. The local Node server and the Vercel catch-all function use the same Express routes. The analytics API reads the Supabase PostgreSQL star schema over PostgREST. The Instruments tab uses the Supabase JavaScript client directly.

## 2. Problems Identified

- The warehouse reader in `api/[[...path]].ts` issued one unpaginated REST request per table. With an exact count requested for diagnosis, the live fact endpoint returned HTTP 206 and `Content-Range: 0-999/6504`. The original analytics API reported 1,000 admissions, and the original Finals API returned HTTP 409. The first page could never satisfy the 5,000-row Finals check.
- The shared reader silently substituted demo rows on a configured Supabase failure. Finals then treated those rows as live and reported missing cohorts. The header also advertised a live source before any successful read.
- PostgreSQL exposes `PatientRecords.admission`. The analysis, timeline, and record projection read `addmission`. The Finals month check also relied on a locale-dependent date string layout.
- The local server imported an Express app that the API module did not export. The development command failed on module startup. The server also did not load the root `.env`, and Vite's browser env directory defaulted to the nested web root. The development server also searched the nested root for its Vite config and skipped the React and Tailwind plugins.
- The refresh effect depended on a fetch callback rebuilt after every response. Overlapping syncs could also compete to update dashboard state.
- The Finals screen described a holdout evaluation, although the active implementation trained and evaluated on the full Finals batch.
- Records reset only cleared chart filters. The ledger kept its own search text and room class.

## 3. Database Investigation

Read-only Supabase SQL confirmed that `PatientRecords.recordID` is the fact primary key. Foreign keys link `patientID`, `doctorID`, `nurseID`, `roomID`, and `billID` to `Patient_Dim.patientID`, `Doctor_Dim.doctorID`, `Nurse_Dim.nurseID`, `Room_Dim.roomId`, and `Bill_Dim.billID`, respectively. Dates in `PatientRecords.admission` and `Bill_Dim.purchasedAt` are timestamp with time zone. Services and billed amounts come from `Bill_Dim.productName` and `Bill_Dim.financialCost`. The separate `instruments` table contains six rows. The dimensions contain 6,493 patients, 12 physicians, 12 nurses, 17 rooms, and 6,503 bills.

| Cohort | Admission IDs | Admissions | Missing dimension references | Duplicate fact IDs |
| --- | --- | ---: | ---: | ---: |
| Midterm | 1 through 1,504 | 1,504 | 0 | 0 |
| Finals import | -5,000 through -1 | 5,000 | 0 | 0 |
| Live warehouse | All fact IDs | 6,504 | 0 | 0 |

The original Finals commit `18adf9b` contains the midterm key range in `finals.ts`, the reserved negative IDs in `finals-etl.sql`, and the import integrity query in its historical `finals-verification.sql`. Inspect that ETL with `git show 18adf9b:finals-etl.sql`. Live SQL verified that both key ranges are complete. The Finals records are the existing synthetic capstone import. The comparison uses historical cohort membership with current dimension values.

RLS is enabled on all seven public tables. The current grants and SELECT policies allow anonymous reads on the warehouse and instruments. A live request with the project's publishable key reproduced the row cap and successfully read the warehouse after the fix. This establishes that the original 409 was caused by pagination under the tested role. Supabase security advisories also flagged existing execution grants for `rls_auto_enable()`.

## 4. Fixes Implemented

- The shared REST reader requests an exact count on the first page and follows ascending primary-key cursors. It validates the row array, the numeric count in the `Content-Range` header, and the returned keys. Incomplete reads return an actionable error. The existing detail, chart, and chatbot joins consume the full reads. A configured read failure reaches the caller as an error, and the unconfigured demo mode is explicitly labeled.
- Both API entry points now use the analysis in `finals.ts`. The Finals view shows cohort counts, the current warehouse total, growth, dimension integrity, measured timings, and a Philippine-time success timestamp. It displays loading and request errors, supports retry, and aborts an active browser request when the tab unmounts.
- Analytics reads `admission` and groups reporting dates using Asia/Manila. Date-only values keep their calendar date. The header and record detail use Philippine time for timestamps. Reset Filters now clears the ledger search and room class as well as the chart filters.
- Manual sync and the selected 15-, 30-, or 60-second timer use the same guarded fetch. Manual mode disables polling. Successful live reads replace the current result and update the timestamp. Failed reads show a sync error and retain the last successful timestamp. There are no Supabase Realtime subscriptions in this workflow.
- The local server loads root dotenv configuration and shares the deployed API routes. It loads the root Vite configuration explicitly, so the React and Tailwind plugins run in development. The browser uses Vite’s native development refresh, with its WebSocket attached to the existing HTTP server.
- The integration preserves the original landing animation, system-theme default, and saved theme preference. The direct Finals URL opens the dashboard immediately. The Finals panels match both themes and refresh after successful header or interval syncs.
- No data or schema migration was needed. All live SQL in this repair was read-only. The new SQL file verifies the current deployment and contains no seed operations.

## 5. Supabase Configuration

Copy `.env.example` to `.env` in the project root. Set `VITE_SUPABASE_URL` to the existing project's base HTTPS URL and `VITE_SUPABASE_PUBLISHABLE_KEY` to its publishable key. The supported alternative is `VITE_SUPABASE_ANON_KEY`. The API also accepts legacy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` server aliases. Use the Vite names when configuring the browser build.

A publishable key is sufficient for current reads. The existing backend optionally accepts `SUPABASE_SERVICE_ROLE_KEY` for elevated server operations. Keep it in server-only environment settings and out of every `VITE_` variable. The optional chatbot uses the server-only `GROQ_API_KEY`. Keep local env files outside version control.

The app's read access depends on SQL grants and RLS policies. Review its existing anonymous access model before using it for protected patient data. See [Supabase API keys](https://supabase.com/docs/guides/api/api-keys) and [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 6. Warehouse Scale-Up

The endpoint verifies all 1,504 baseline IDs and all 5,000 reserved Finals IDs on each run. The comparison uses baseline versus baseline plus Finals. Admissions outside both historical ranges contribute to the live warehouse total and integrity checks. Growth is `finals additions / midterm admissions × 100`, which rounds to 332.4% here.

Integrity checks detect duplicate fact IDs and admissions whose patient, bill, doctor, nurse, or room is missing from the visible dimensions. The primary key and SQL left joins independently verified the check. The billing anomaly model uses Finals IDs divisible by three for training and scores its labeled holdout on the remaining Finals IDs. General alerts still scan all scorable facts.

The UI reports browser round-trip through JSON parsing, server-side REST retrieval including network and paging, and local scenario aggregation for each cohort size. In the 23 November 2026 production-mode check, REST retrieval took 5,022.0 ms and scenario aggregation took 8.4 ms at midterm and 54.9 ms at Finals scale. The read-only SQL audit includes `EXPLAIN (ANALYZE, TIMING OFF)` for both count queries. PostgreSQL reported execution times of 0.416 ms for the midterm count and 1.645 ms for the combined count in one live sample. Timings vary by run and measure distinct operations.

## 7. Files Modified

| File | Purpose |
| --- | --- |
| `api/[[...path]].ts` | Shared REST paging, live error handling, API wiring, date column and reporting fixes |
| `finals.ts` | Shared cohort detection, Manila calendar, growth, integrity, and scenario and holdout analysis |
| `app/web/index.html` | Native Vite updates and original theme initialization |
| `app/web/src/App.tsx` | Stable periodic polling, guarded manual sync, and Finals refresh after warehouse sync |
| `app/web/src/components/FinalsView.tsx` | Live results, theme support, timings, failure and retry behavior |
| `app/web/src/components/LandingHero.tsx` | Original landing animation with direct Finals entry |
| `app/web/src/components/Header.tsx` | Source status and last successful synchronization in Philippine time |
| `app/web/src/components/PatientTable.tsx` | Manila admission date and complete filter reset in the ledger |
| `app/web/src/components/RecordDetailModal.tsx` | Manila admission timestamp in record details |
| `app/web/src/types/database.ts` | Live/demo source and nullable live sync timestamp |
| `server.ts` | Local environment loading, root Vite config, and shared Express API import |
| `vite.config.ts` | Root browser environment directory |
| `finals.test.ts` | Cohort, dimension integrity, Manila date boundaries, and capped or incomplete REST response regression tests |
| `finals-verification.sql` | Rerunnable, read-only SQL for cohort counts, integrity, and all four scenario comparisons |
| `FINALS_FIX_DOCUMENTATION.md` | Findings, verification, and deployment instructions |

## 8. Testing and Verification

| Test | Expected result | Actual result | Status |
| --- | --- | --- | --- |
| Reproduce original REST/Finals behavior | Truncated fact request reproduces 409 | REST returned 1,000 of 6,504, analytics reported 1,000, and Finals returned 409 | Pass |
| Read-only SQL audit and production API | Identical counts and integrity | 1,504 midterm, 5,000 additions, 6,504 total, zero duplicate IDs, zero missing dimension references | Pass |
| Four scenarios against SQL | Production API agrees with separately queried metrics | August admissions 187 → 1,787. May room 301 distinct patients 65 → 390. Room 303 staffing 1 → 8 doctors and 1 → 6 nurses. May billed amounts ₱418,300.00 → ₱1,380,048.70 | Pass |
| Analytics joins and totals | Counts, unique facts, and billed amount agree with SQL | 6,504 unique admissions, 6,493 patients, 12 doctors, 12 nurses, 17 rooms, ₱8,639,174.30 billed | Pass |
| Browser navigation, charts, and records | Seven tabs load, chart and ledger filters respond, and record detail opens | Exercised the financial period, physician and affliction filters, live instruments refresh, empty search result, room selection, filter reset, and record detail | Pass |
| Browser Finals rerun and failure recovery | Successful initial load and rerun, visible loading, clear 503, successful retry | Four scenarios rendered, deliberate HTTP 503 cleared the results and restored the button, and retry loaded 6,504 facts | Pass |
| Browser manual and automatic sync | Manual fetch succeeds and 15-second refresh returns unique facts | Both requests returned HTTP 200, with 6,504 unique admission IDs | Pass |
| `node --import tsx --test finals.test.ts` | Cohort, Manila boundaries, and REST paging assertions pass | 3 passed. The simulated REST cap required seven pages. A deliberately incomplete read returned HTTP 503 | Pass |
| `npm run lint`, `npm run build`, `git diff --check` | All commands succeed | Passed. Vite emitted a bundle-size warning | Pass |
| Integration dependency check | Clean install and production dependency audit | npm ci and npm ls passed. npm audit --omit=dev reported zero known vulnerabilities | Pass |
| API bundle and local production startup | Catch-all entry bundles and built app runs | esbuild bundling succeeded. `npm start` served the dashboard and live APIs | Pass |

## 9. Remaining Issues

- On 23 November 2026 (Manila time), the public `hyacinth-completed-app.vercel.app/api/finals` still returned HTTP 409. The working-tree fixes returned HTTP 200 locally against the live database. The Vercel CLI reported `Logged out` and no deployment token was configured. The local link names `hyacinth-clinic-app`; confirm in Vercel that the selected project owns the requested domain before deploying.
- No independent point-in-time snapshot of old dimension values was located. Cohort membership is supported by Git and live keys. Historic attributes and charges are limited to the currently stored values.
- The multi-request REST read is not a single transaction snapshot. It detects mismatched page counts and invalid keys. A future requirement for snapshot-consistent reporting during concurrent edits would require a single database operation.
- Anonymous read policies and the existing unauthenticated record-write route warrant separate access-control work before handling protected patient data. Existing write routes were not exercised against the live warehouse. No CSV or other dedicated export control was found in the current dashboard source.
- Browser verification covered navigation, search, details, sync, and Finals recovery. It did not exhaustively exercise every chart interaction or mobile layout.

## 10. Deployment Instructions

1. From the project root, install dependencies with `npm ci`. Use Node 22.12 or newer, as Vite requires a supported modern Node version.
2. Configure `.env` as above. Run `npm run dev` and open `http://localhost:3000/#finals`. Click **Run live analysis** and compare counts with `finals-verification.sql` in Supabase SQL Editor.
3. Run `npm run lint`, `node --import tsx --test finals.test.ts`, and `npm run build`. Use `npm start` for a local production-mode check.
4. For Vercel, sign in with an account that can deploy to the project serving `hyacinth-completed-app.vercel.app`. Confirm the domain and project link, use the app folder as the project root, and set the Vite variables for both build and runtime. The existing `vercel.json` builds into `app/web/dist` and routes API requests through the Express catch-all. Deploy the reviewed source to that project, then verify that `/api/finals` returns HTTP 200 and the Finals screen matches the SQL audit. See [Vercel CLI deployment](https://vercel.com/docs/cli/deploying-from-cli).
5. No backup restore or migration is required for this release. Before any future schema or data change, confirm a recoverable Supabase backup or make an authorized dump to protected storage. Record the pre-change count and foreign-key audit, verify dependencies, and rerun the audit after migration. See [Supabase database backups](https://supabase.com/docs/guides/platform/backups).
