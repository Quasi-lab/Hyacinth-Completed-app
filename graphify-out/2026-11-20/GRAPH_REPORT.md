# Graph Report - Hyacinth-Completed-app  (2026-11-20)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 143 nodes · 254 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2ffc437a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- server.ts
- package.json
- database.ts
- compilerOptions
- App.tsx
- lucide-react
- InstrumentsView.tsx
- scripts
- PatientTable.tsx
- SchemaModal.tsx

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `lucide-react` - 14 edges
3. `react` - 14 edges
4. `App()` - 13 edges
5. `motion` - 10 edges
6. `scripts` - 7 edges
7. `JoinedPatientRecord` - 6 edges
8. `Props` - 4 edges
9. `AnalyticsPayload` - 4 edges
10. `vite` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Props` --references--> `JoinedPatientRecord`  [EXTRACTED]
  src/components/PatientTable.tsx → src/types/database.ts
- `Props` --references--> `JoinedPatientRecord`  [EXTRACTED]
  src/components/RecordDetailModal.tsx → src/types/database.ts
- `App()` --calls--> `PatientTable()`  [EXTRACTED]
  src/App.tsx → src/components/PatientTable.tsx
- `Props` --references--> `DiseaseDistributionItem`  [EXTRACTED]
  src/components/AfflictionPieChart.tsx → src/types/database.ts
- `Props` --references--> `DoctorWorkloadItem`  [EXTRACTED]
  src/components/DoctorBarChart.tsx → src/types/database.ts

## Import Cycles
- None detected.

## Communities (10 total, 1 thin omitted)

### Community 0 - "server.ts"
Cohesion: 0.08
Nodes (22): dependencies, dotenv@^17.2.3, express@^4.21.2, @google/genai@^2.4.0, lucide-react@^0.546.0, motion@^12.23.24, react@^19.0.1, react-dom@^19.0.1 (+14 more)

### Community 1 - "package.json"
Cohesion: 0.12
Nodes (23): devDependencies, autoprefixer@^10.4.21, esbuild@^0.25.0, tailwindcss@^4.3.3, tsx@^4.21.0, @types/express@^4.17.21, @types/node@^22.14.0, @types/react@^19.3.0 (+15 more)

### Community 2 - "database.ts"
Cohesion: 0.15
Nodes (16): COLORS, Props, Props, Props, Props, Props, AnalyticsSummary, BillDim (+8 more)

### Community 3 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+9 more)

### Community 4 - "App.tsx"
Cohesion: 0.26
Nodes (11): App(), AfflictionPieChart(), DoctorBarChart(), FinancialLineChart(), Header(), InstrumentsView(), KpiCards(), NewRecordModal() (+3 more)

### Community 5 - "lucide-react"
Cohesion: 0.24
Nodes (8): lucide-react, motion, react, SortBy, PeriodFilter, ViewMode, Props, TABS

### Community 6 - "InstrumentsView.tsx"
Cohesion: 0.28
Nodes (7): @supabase/supabase-js@^2.118.0, @supabase/supabase-js, DEFAULT_CLINICAL_INSTRUMENTS, Instrument, supabase, supabaseKey, supabaseUrl

### Community 7 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, clean, dev, lint, preview, start

### Community 8 - "PatientTable.tsx"
Cohesion: 0.47
Nodes (4): PatientTable(), Props, Props, JoinedPatientRecord

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `lucide-react` connect `lucide-react` to `server.ts`, `package.json`, `database.ts`, `App.tsx`, `InstrumentsView.tsx`, `PatientTable.tsx`, `SchemaModal.tsx`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07816091954022988 - nodes in this community are weakly interconnected._
- **Why does `react` connect `lucide-react` to `server.ts`, `package.json`, `database.ts`, `App.tsx`, `InstrumentsView.tsx`, `PatientTable.tsx`, `SchemaModal.tsx`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11594202898550725 - nodes in this community are weakly interconnected._
- **Why does `motion` connect `lucide-react` to `server.ts`, `package.json`, `database.ts`, `App.tsx`, `InstrumentsView.tsx`, `PatientTable.tsx`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._