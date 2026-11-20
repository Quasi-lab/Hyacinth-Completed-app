# Graph Report - Hyacinth-Completed-app  (2026-11-20)

## Corpus Check
- 66 files · ~116,328 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .lock 1)

## Summary
- 169 nodes · 304 edges · 10 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8db4046c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- server.ts
- package.json
- database.ts
- compilerOptions
- App.tsx
- react
- InstrumentsView.tsx
- scripts
- ClinicChatbot.tsx
- FinancialLineChart.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 18 edges
2. `lucide-react` - 17 edges
3. `compilerOptions` - 16 edges
4. `App()` - 15 edges
5. `motion` - 13 edges
6. `scripts` - 7 edges
7. `JoinedPatientRecord` - 6 edges
8. `vite` - 4 edges
9. `loadStarSchemaTables()` - 4 edges
10. `MarkdownContent()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `ClinicChatbot()`  [EXTRACTED]
  src/App.tsx → src/components/ClinicChatbot.tsx
- `Props` --references--> `JoinedPatientRecord`  [EXTRACTED]
  src/components/PatientTable.tsx → src/types/database.ts
- `Props` --references--> `JoinedPatientRecord`  [EXTRACTED]
  src/components/RecordDetailModal.tsx → src/types/database.ts
- `App()` --calls--> `AfflictionPieChart()`  [EXTRACTED]
  src/App.tsx → src/components/AfflictionPieChart.tsx
- `App()` --calls--> `DoctorBarChart()`  [EXTRACTED]
  src/App.tsx → src/components/DoctorBarChart.tsx

## Import Cycles
- None detected.

## Communities (10 total, 0 thin omitted)

### Community 0 - "server.ts"
Cohesion: 0.07
Nodes (29): dependencies, dotenv@^17.2.3, express@^4.21.2, @google/genai@^3.6.1, lucide-react@^0.546.0, react@^19.0.1, react-dom@^19.0.1, @tailwindcss/vite@^4.3.3 (+21 more)

### Community 1 - "package.json"
Cohesion: 0.12
Nodes (23): devDependencies, autoprefixer@^10.4.21, esbuild@^0.25.0, tailwindcss@^4.3.3, tsx@^4.21.0, @types/express@^4.17.21, @types/node@^22.14.0, @types/react@^19.3.0 (+15 more)

### Community 2 - "database.ts"
Cohesion: 0.21
Nodes (12): Props, SortBy, Props, Props, AnalyticsPayload, BillDim, DoctorDim, DoctorWorkloadItem (+4 more)

### Community 3 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+9 more)

### Community 4 - "App.tsx"
Cohesion: 0.18
Nodes (16): App(), AfflictionPieChart(), DoctorBarChart(), FinancialLineChart(), Header(), InstrumentsView(), KpiCards(), LandingHero() (+8 more)

### Community 5 - "react"
Cohesion: 0.15
Nodes (16): motion@^12.23.24, lucide-react, motion, react, COLORS, Props, AppearanceView(), Props (+8 more)

### Community 6 - "InstrumentsView.tsx"
Cohesion: 0.27
Nodes (8): @supabase/supabase-js@^2.118.0, @supabase/supabase-js, DEFAULT_CLINICAL_INSTRUMENTS, Instrument, isSupabaseConfigured, supabase, supabaseKey, supabaseUrl

### Community 7 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, clean, dev, lint, preview, start

### Community 8 - "ClinicChatbot.tsx"
Cohesion: 0.31
Nodes (8): ChatMessage, ClinicChatbot(), CodeBlock(), MarkdownContent(), PRESET_QUESTIONS, renderInlineFormatting(), TOOL_LABELS, ToolUsed

### Community 9 - "FinancialLineChart.tsx"
Cohesion: 0.50
Nodes (4): PeriodFilter, Props, ViewMode, TimelinePoint

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `server.ts`, `package.json`, `database.ts`, `App.tsx`, `InstrumentsView.tsx`, `ClinicChatbot.tsx`, `FinancialLineChart.tsx`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `server.ts`, `package.json`, `database.ts`, `App.tsx`, `InstrumentsView.tsx`, `ClinicChatbot.tsx`, `FinancialLineChart.tsx`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11594202898550725 - nodes in this community are weakly interconnected._
- **Why does `motion` connect `react` to `package.json`, `database.ts`, `App.tsx`, `InstrumentsView.tsx`, `ClinicChatbot.tsx`, `FinancialLineChart.tsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.1471861471861472 - nodes in this community are weakly interconnected._