# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Goal
- Execute Phases 4–7 across nephrology, ICU critical care, gastro-oncology, and security/audit domains: build 14 domain engines/monitors, 4 database tables, 4 type definition files, 1 WatermelonDB model, 1 gateway screen, fix migration ordering, and schema-bump to v30.

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
- **Phase 7.5 — Migration Fix**: Schema v30, reversed v11–v19 migration ordering (now strictly monotonically descending), added `created_at`/`updated_at` timestamps to 11 tables (`test_catalog`, `test_reference_ranges`, `calculation_overrides`, `attachments`, `settings`, `audit_logs`, `clinical_audit_logs`, `gastro_surgery_assessments`, `icu_critical_assessments`, `renal_assessments`, `who_growth_standards`), added deprecation comments to patient table duplicate columns (`name`, `birth_date`, `phone_ar`)
- **Full codebase audit**: 61 tables in schema, 26 migration steps (v5–v30), 31 test files with 154/154 tests passing; migration ordering defect corrected
- **Backup & Restore Service**: `src/data/services/BackupService.ts` (SQLite file export/import via expo-file-system SDK 56 API, SQLite magic-header validation, expo-sharing for export), integrated into `app/settings.tsx` as Section 5 (Backup & Restore card with Teal accent border, restore confirmation modal with danger-styled confirm gate, toast feedback, `resetDatabase()` + `router.replace('/')` on restore)

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Schema versions 24 (therapeutic_foods/DNI), 25 (WHO growth), 26 (renal), 27 (ICU), 28 (gastro-oncology), 29 (audit), 30 (timestamps) were sequentially consumed
- Migration array ordering was incorrect: v11→v19 blocks were ascending, WatermelonDB requires descending order; corrected for v30
- Eleven tables lacked `created_at`/`updated_at` columns; added via v30 `addColumns` migration rather than full table recreation to preserve existing data
- Patient table duplicates (`name`/`full_name`, `birth_date`/`date_of_birth`, `phone_ar`/`phone_number`) kept in schema (legacy data safety), marked with `// @deprecated` comments
- Pre-existing tsc error at `app/admin/hidden-calories-dashboard.tsx:197` (HTML entity `>` rendered literally) is unrelated to all work

## Next Steps
- Future: Phases 8–11 (not yet scoped)

## Critical Context
- `Q.desc` and `Q.take` are valid WatermelonDB exports used in `CalculationRepository.ts` and consistent with codebase patterns
- `watchQuery<T>` in `observe.ts` infers typed model arrays from `db.get(table).query(...)` — the `GastroSurgeryAssessment` model was required for the gateway screen
- All engine tests are isolated (no DB dependencies) and pass 154/154 total
- The `patients` table has 34+ columns due to cumulative `v11` migration additions (name, name_ar, birth_date, phone_ar, etc.) alongside original base columns (full_name, date_of_birth, phone_number)
- `src/data/database/db.ts` does not exist; database bootstrap is in `src/data/database/index.ts` → `index.native.ts` / `index.web.ts`

## Relevant Files
- `src/data/database/schema.ts`: v30, 61 tables including clinical_audit_logs, gastro_surgery_assessments, icu_critical_assessments, renal_assessments, who_growth_standards
- `src/data/database/migrations.ts`: 26 migration blocks (v5→v30), v30 with 11 addColumns steps
- `src/domain/calculators/EgfrCalculatorEngine.ts`: CKD-EPI 2021, NKF staging, Arabic fallback
- `src/domain/calculators/RenalMineralRestrictionEngine.ts`: KDOQI HD/PD/pre-dialysis, 0-weight guard
- `src/domain/calculators/PennStateEngine.ts`: 2003b/2010, 35–43°C temperature guard
- `src/domain/calculators/IcuLipidCalorieEngine.ts`: propofol 1.1 kcal/mL, 30% overfeeding guard, negative-energy zero clamp
- `src/domain/calculators/EnteralNutritionEngine.ts`: continuous/bolus, GRV>500 hold, >400 mOsm flag
- `src/domain/calculators/ParenteralNutritionEngine.ts`: 70/30 split, peripheral >900 mOsm violation brake
- `src/domain/monitors/RefeedingSyndromeMonitor.ts`: NICE critical/moderate/low, 10 kcal/kg ceiling
- `src/domain/calculators/OncologyCachexiaEngine.ts`: Fearon 4-tier, ESPEN 20–35 kcal/kg, GIT/head_neck boost
- `src/domain/calculators/BariatricProgressiveDietEngine.ts`: ASMBS 5-phase, anti-dumping for bypass
- `src/domain/calculators/GastroHighLossEngine.ts`: 4 loss types, excess-based replacement, >2000 critical dehydration
- `src/domain/security/RoleAuthorizationGuard.ts`: 3×3 matrix, 15-char justification minimum
- `src/domain/reports/CertifiedReportEngine.ts`: deterministic 64-bit hash, Arabic certification stamp
- `app/patient/[id]/ncp-gastro-oncology-gateway.tsx`: RxJS combineLatest + 3 engine modules + override form
- `src/data/models/GastroSurgeryAssessment.ts`: 9 decorated fields, registered in index.native.ts + index.web.ts
- `src/data/database/index.native.ts` / `index.web.ts`: modelClasses registration arrays
- `src/data/types/nephrology.ts`, `critical_care.ts`, `gastro_oncology.ts`, `security_audit.ts`: typed interfaces
- `src/presentation/theme/colors`, `fonts`, `spacing`: design system tokens
- `src/presentation/hooks/useObservable.ts`: `useObservable`/`useObservableArray` hooks
- `src/data/database/observe.ts`: `watchQuery` / `watchRecord` RxJS helpers
