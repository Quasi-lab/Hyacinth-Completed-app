# Graph Report - Hyacinth-Completed-app  (2026-11-21)

## Corpus Check
- 74 files · ~124,996 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .lock 1)

## Summary
- 170 nodes · 308 edges · 9 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2da670b7`
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

## God Nodes (most connected - your core abstractions)
1. `react` - 18 edges
2. `lucide-react` - 17 edges
3. `App()` - 16 edges
4. `compilerOptions` - 16 edges
5. `motion` - 13 edges
6. `scripts` - 7 edges
7. `JoinedPatientRecord` - 6 edges
8. `MarkdownContent()` - 4 edges
9. `ClinicChatbot()` - 4 edges
10. `Props` - 4 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `ThemeFab()`  [EXTRACTED]
  src/App.tsx → src/components/ThemeFab.tsx
- `Props` --references--> `JoinedPatientRecord`  [EXTRACTED]
  src/components/PatientTable.tsx → src/types/database.ts
- `Props` --references--> `JoinedPatientRecord`  [EXTRACTED]
  src/components/RecordDetailModal.tsx → src/types/database.ts
- `App()` --calls--> `AfflictionPieChart()`  [EXTRACTED]
  src/App.tsx → src/components/AfflictionPieChart.tsx
- `App()` --calls--> `ClinicChatbot()`  [EXTRACTED]
  src/App.tsx → src/components/ClinicChatbot.tsx

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "server.ts"
Cohesion: 0.07
Nodes (30): dependencies, dotenv@^17.2.3, express@^4.21.2, @google/genai@^3.6.1, lucide-react@^0.546.0, motion@^12.23.24, react@^19.0.1, react-dom@^19.0.1 (+22 more)

### Community 1 - "package.json"
Cohesion: 0.12
Nodes (23): devDependencies, autoprefixer@^10.4.21, esbuild@^0.25.0, tailwindcss@^4.3.3, tsx@^4.21.0, @types/express@^4.17.21, @types/node@^22.14.0, @types/react@^19.3.0 (+15 more)

### Community 2 - "database.ts"
Cohesion: 0.16
Nodes (15): PeriodFilter, Props, ViewMode, Props, Props, Props, AnalyticsPayload, AnalyticsSummary (+7 more)

### Community 3 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+9 more)

### Community 4 - "App.tsx"
Cohesion: 0.17
Nodes (17): App(), AfflictionPieChart(), ClinicChatbot(), DoctorBarChart(), FinancialLineChart(), Header(), InstrumentsView(), KpiCards() (+9 more)

### Community 5 - "react"
Cohesion: 0.14
Nodes (17): lucide-react, motion, react, COLORS, Props, Props, SortBy, Props (+9 more)

### Community 6 - "InstrumentsView.tsx"
Cohesion: 0.27
Nodes (8): @supabase/supabase-js@^2.118.0, @supabase/supabase-js, DEFAULT_CLINICAL_INSTRUMENTS, Instrument, isSupabaseConfigured, supabase, supabaseKey, supabaseUrl

### Community 7 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, clean, dev, lint, preview, start

### Community 8 - "ClinicChatbot.tsx"
Cohesion: 0.32
Nodes (7): ChatMessage, CodeBlock(), MarkdownContent(), PRESET_QUESTIONS, renderInlineFormatting(), TOOL_LABELS, ToolUsed

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `server.ts`, `package.json`, `database.ts`, `App.tsx`, `InstrumentsView.tsx`, `ClinicChatbot.tsx`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06906906906906907 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `server.ts`, `package.json`, `database.ts`, `App.tsx`, `InstrumentsView.tsx`, `ClinicChatbot.tsx`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11594202898550725 - nodes in this community are weakly interconnected._
- **Why does `motion` connect `react` to `server.ts`, `package.json`, `database.ts`, `App.tsx`, `InstrumentsView.tsx`, `ClinicChatbot.tsx`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.1383399209486166 - nodes in this community are weakly interconnected._