# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Goal
- Build Reporting & Export Engine — transform reactive state into clinical PDF documents.

## Constraints & Preferences
- Dark-slate theme, RTL Arabic layout, WatermelonDB ORM, RxJS combineLatest, Q.sortBy/Q.take WatermelonDB queries
- All numeric outputs rounded to 2 decimal places; defensive fallbacks on zero/negative/NaN inputs
- TypeScript strict with typed union literals (e.g. `'stage_1' | 'stage_2' | 'stage_3a' | 'stage_3b' | 'stage_4' | 'stage_5' | 'unknown'`)
- Vitest for all test suites; static class methods with typed interfaces
- WatermelonDB model registration required in both `index.native.ts` and `index.web.ts`
- Arabic error messages and clinical directives on all engines

## Progress
### Done
- **Phase 4 — Nephrology**: Schema v26 (renal_assessments table + migration), `EgfrCalculatorEngine` (CKD-EPI 2021 race-free, 3/3 tests), `RenalMineralRestrictionEngine` (KDOQI 3-pathway, 3/3 tests), `nephrology.ts` types
- **Phase 5 — ICU Critical Care**: Schema v27 (icu_critical_assessments table + migration), `PennStateEngine` (2003b/2010, 3/3 tests), `IcuLipidCalorieEngine` (propofol/clevedipine, 3/3 tests), `EnteralNutritionEngine` (GRV triage + osmolality, 3/3 tests), `ParenteralNutritionEngine` (70/30 macro split + osmolarity, 3/3 tests), `RefeedingSyndromeMonitor` (NICE 3-tier + 10 kcal/kg cap, 3/3 tests), `critical_care.ts` types
- **Phase 6 — Gastro-Oncology**: Schema v28 (gastro_surgery_assessments table + migration), `OncologyCachexiaEngine` (Fearon+ESPEN, 3/3 tests), `BariatricProgressiveDietEngine` (ASMBS 5-phase + anti-dumping, 3/3 tests), `GastroHighLossEngine` (4 loss-type thresholds + critical dehydration, 3/3 tests), `GastroSurgeryAssessment` WatermelonDB model (registered in both index.native.ts + index.web.ts), `ncp-gastro-oncology-gateway.tsx` screen (RxJS combineLatest + 3 engine modules + override form with db.write), `gastro_oncology.ts` types
- **Phase 7 — Security & Audit**: Schema v29 (clinical_audit_logs table + migration), `RoleAuthorizationGuard` (3×3 permission matrix + 15-char justification + escalation flag, 4/4 tests), `CertifiedReportEngine` (deterministic 64-bit hash + certification stamp, 3/3 tests), `security_audit.ts` types
- **Phase 7.5 — Migration Fix**: Schema v30, reversed v11–v19 migration ordering (now strictly monotonically descending), added `created_at`/`updated_at` timestamps to 11 tables, added deprecation comments to patient table duplicate columns
- **Backup & Restore Service**: `src/data/services/BackupService.ts` (SQLite file export/import via expo-file-system SDK 56 API, SQLite magic-header validation, expo-sharing for export), integrated into `app/settings.tsx` as Section 5
- **Full 4-Vector Audit (Disconnection & Dead Code)**: Scored overall D+. Findings: 27 dark tables (37.5%), 2 ghost UIs (`clinical-analysis.tsx` full data loss, `dietary-history.tsx` broken callback), 20+ dead engine files (8 pediatric/SAM engines), `syncStore` 100% dead code (5 orphaned actions)
- **Supplements UI (Dark Matter Phase)**: Built `app/patient/[id]/supplements.tsx` — full CRUD with RxJS reactive list via `watchQuery`, `SupplementRepository.create()`/`delete()`, DropdownField for 7 supplement types, Alert confirmation delete. Added `supplements` entry to `MODULES_CONFIG` at `app/patient/[id].tsx:106`
- **Database Discrepancy Investigation**: Confirmed NO 13-table database in this codebase. Schema has 72 tables (v39). HeidiSQL connected to external/legacy DB. Web uses LokiJS + IndexedDB — cannot connect with HeidiSQL. Identified dead alternate bootstrap at `src/data/db.ts`
- **Cardiovascular Assessment (Dark Matter Orphan)**: Built `app/patient/[id]/cardio-assessment.tsx` — comprehensive assessment form (BP, HR, lipid profile, dry weight, edema grading, dyspnea/orthopnea), 8-item DASH diet compliance checklist, real-time risk analysis engine with color-coded alerts (red/yellow/green) and fluid restriction recommendations, historical assessment data table, integrated `PatientEducationContent` viewer for cardio-specific educational materials. Uses RxJS `combineLatest` with 3 streams (patient + assessments + education). Added `cardio-assessment` entry to `MODULES_CONFIG` at `app/patient/[id].tsx:107` (accentRose, `isWide: true`, prominently positioned in standard modules).
- **Pediatric Growth Module Activation**:
  - Installed `recharts` for web-optimized charting
  - Added `computeZScoreFromReference()` fallback to `src/domain/data/whoGrowthReference.ts` — interpolates Z-scores from embedded WHO LMS reference data (handles empty `who_growth_standards` table)
  - Built `PediatricMeasurementForm.tsx` at `src/presentation/components/PediatricMeasurementForm.tsx`: weight/height/head-circumference inputs, dual-path Z-score (PediatricZScoreEngine → fallback), persists to `pediatric_growth_charts`, color-coded Z-score badges
  - Rebuilt `app/patient/[id]/growth-charts.tsx` with recharts `LineChart` — WFA/LHFA/BMIFA charts with ±3SD, ±2SD, Median reference lines + patient overlay, custom tooltip, data table, measurement form panel, and clinical directives card
- **Reactive Shift (patientStore → RxJS)**:
  - Refactored `patientStore.ts`: removed imperative `loadPatients`/`searchPatients`/`addPatient`/`setSortOrder`, now exposes `patients$` Observable + `usePatients()` reactive hook using `observePatients()` + `useObservableArray()`
  - Added `observePatients()` to `src/data/database/observe.ts` with `query().observe()` for automatic UI updates on any DB mutation
  - Refactored `app/index.tsx`: replaced `usePatientStore` with reactive `usePatients()` hook, local filtering/sorting, removed `useFocusEffect`/imperative fetches — list updates reactively on insert/delete/update
- **Ghost UI Elimination — Anemia & Cardio Persisters**:
  - Schema v49→v50: 11 new columns (`heart_rate`, `has_dyspnea`, `has_orthopnea`, 8 DASH booleans) in `cardiovascular_assessments`
  - `useAnemiaAssessmentPersister` hook + screen rewrite (590→lines, `beforeRemove` guard, 800ms auto-save)
  - `useCardioAssessmentPersister` hook + screen rewrite (replaces 17 individual `useState` calls, single `computed` object for severity/risk, removes "Analyze Only" ephemeral button)
- **Phase 3 — Calculations Hub Persister**:
  - `useCalculationPersister` hook — single-row draft in existing `calculations` table via `calculation_type = 'calculation_inputs'`, 17-field `formState` with 800ms debounced auto-save, `computed` object (13 derived values), `beforeRemove` navigation guard
  - Screen rewrite: replaced 17 `useState` declarations + 7 `useMemo` blocks with `formState` + `computed`, all 6 sections reactively synced, TripleActionFooter wired to `saveImmediate()`
  - 928/928 tests pass

- **Phase 5 — Reactive Global Sync**: `ClinicalEventBus` (RxJS Subject singleton, 3 filtered observable methods), integrated into all 3 persister hooks with `revision` counter for re-computation, `useCalculationPersister` publishes `weightKg`/`heightCm`/`fever` on save
- **Routing & Orphan Recovery (Waves 1-2)**:
  - `useBeforeRemoveGuard` hook — replaces 3x duplicated `beforeRemove` + Alert blocks
  - `DraftRepository` — queries 3 draft tables per patient
  - `usePatientDrafts` — RxJS `combineLatest` reactive hook
  - `DraftBanner` — animated slide-in banner with resume/dismiss
  - Integrated into `app/patient/[id].tsx`
- **Phase 6 — Reporting & Export Engine (Steps 1-2)**:
  - `ReportTemplate` interfaces (ReportPayload, ReportSection, ReportFindingRow, ReportType)
  - `AnemiaSectionBuilder` — DB query + `AnemiaNutritionEngine` (same as hook)
  - `CardioSectionBuilder` — DB query + `computeRisk()` (inlined, matches hook)
  - `CalculationsSectionBuilder` — DB query + `kauRequirementsEngine` (same as hook)
  - `ReportGenerator` — orchestrates section builders per reportType
  - `HtmlRenderer` — pure function `(payload: ReportPayload) => string`, A4 RTL Arabic template with embedded CSS, severity badges, patient info grid, findings tables with zebra striping, header/footer, certification stamp
  - 928/928 tests pass, 0 TS errors

### Blocked
- (none)

## Key Decisions
- Z-score fallback (`computeZScoreFromReference`) interpolates from embedded WHO 2006 LMS data instead of relying on empty `who_growth_standards` table — clinically valid approximation that works offline
- Two charting strategies coexist: recharts for web (LineChart, ResponsiveContainer, Tooltip), existing `GrowthChartComponent` (react-native-svg) for native fallback
- Supplements get a standalone screen NOT merged into medications screen — aligns with `medications.tsx:117` comment "Supplements should be handled in a separate module"
- The 13-table database in HeidiSQL is external to this project; no migration or schema sync needed
- Schema versions 24–50 were sequentially consumed; current schema is v50 with 72 tables (stale docs count of 61 is incorrect)
- Migration ordering defect (v11→v19 ascending instead of descending) was corrected in v30
- Eleven tables lacked `created_at`/`updated_at` columns; added via v30 `addColumns` migration
- Patient table duplicates kept in schema with `// @deprecated` comments for legacy data safety
- Pre-existing tsc error at `app/admin/hidden-calories-dashboard.tsx:197` (HTML entity `>` rendered literally) is unrelated to all work

## Next Steps
- (pending user direction — potential: build screen integration for ReportGenerator, add `reports` table schema, or start remaining steps of Phase 6)

## Critical Context
- `Q.desc` and `Q.take` are valid WatermelonDB exports used in `CalculationRepository.ts`
- `watchQuery<T>` in `observe.ts` infers typed model arrays from `db.get(table).query(...)`
- All engine tests are isolated (no DB dependencies) and pass 154/154 total
- The `patients` table has 34+ columns due to cumulative v11 migration additions
- Database bootstrap is in `src/data/database/index.ts` → `index.native.ts` / `index.web.ts`
- Schema v39 has 72 tables (not 61 as documented in AGENTS.md)
- `PediatricZScoreEngine` queries `who_growth_standards` table which has NO seed data — engine returns zScore:0 fallback. The `computeZScoreFromReference` utility bypasses this using embedded WHO LMS data
- `pediatric_growth_charts` table exists (34 columns) — there is NO table named `pediatric_measurements`
- `recharts` v2.x installed — for web rendering only; native uses `react-native-svg` via existing `GrowthChartComponent`
- The existing `GrowthChartComponent.tsx` at `src/presentation/components/pediatrics/GrowthChartComponent.tsx` is fully built but was never imported by any screen until the growth-charts screen

## Relevant Files
- `src/data/database/schema.ts`: v39, 72 tables
- `src/data/database/migrations.ts`: 35 migration blocks (v5→v39)
- `src/services/ClinicalEventBus.ts`: RxJS singleton bus, 3 filtered observable methods
- `src/presentation/hooks/useBeforeRemoveGuard.ts`: Reusable navigation guard
- `src/presentation/hooks/usePatientDrafts.ts`: Reactive draft-querying hook (RxJS combineLatest)
- `src/presentation/components/DraftBanner.tsx`: Animated orphan recovery banner
- `src/data/repositories/DraftRepository.ts`: 3-table draft query + dismiss
- `src/domain/reports/ReportTemplate.ts`: ReportPayload, ReportSection, ReportFindingRow types
- `src/domain/reports/ReportGenerator.ts`: Section builder orchestrator
- `src/domain/reports/section-builders/AnemiaSectionBuilder.ts`: DB + AnemiaNutritionEngine
- `src/domain/reports/section-builders/CardioSectionBuilder.ts`: DB + computeRisk
- `src/domain/reports/section-builders/CalculationsSectionBuilder.ts`: DB + kauRequirementsEngine
- `src/presentation/reports/HtmlRenderer.tsx`: Pure function (payload → HTML string)
- `src/domain/data/whoGrowthReference.ts`: `computeZScoreFromReference()` — interpolated Z-score fallback from embedded WHO 2006 LMS data (21 age points × 3 indicators × 2 genders), `ReferenceDataPoint` interface
- `src/presentation/components/PediatricMeasurementForm.tsx`: Reusable form with dual-path Z-score calc + DB persistence (296 lines)
- `app/patient/[id]/growth-charts.tsx`: Rebuilt with recharts — WFA/LHFA/BMIFA LineChart (±3SD, ±2SD, Median, patient overlay), ZScoreTooltip, data table, measurement form integration, clinical directives card
- `app/patient/[id]/supplements.tsx`: Full CRUD supplements screen (RxJS reactive, DropdownField, Alert delete confirmation)
- `app/patient/[id].tsx`: Line 106 — `supplements` module entry in `MODULES_CONFIG`
- `src/data/database/index.ts`: Shared platform-dispatcher (72-table schema, v39)
- `src/data/database/index.web.ts`: LokiJSAdapter for web (IndexedDB, not SQLite)
- `src/data/db.ts`: DEAD — alternate bootstrap, never imported
- `src/data/database/migrate/migrateSchema.ts`: Legacy raw-SQLite script for 33 tables — standalone tool, not part of active schema
- `src/domain/calculators/PediatricZScoreEngine.ts`: Engine querying `who_growth_standards` (empty DB → zScore:0 fallback)
- `src/presentation/components/pediatrics/GrowthChartComponent.tsx`: Existing SVG-based chart (native fallback alongside recharts)
- `src/presentation/stores/syncStore.ts`: 100% dead code — 5 orphaned exported actions, never imported
- All Phase 4–7 engine/monitor files (unchanged)
