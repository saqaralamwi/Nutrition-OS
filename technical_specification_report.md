# Technical Specification Report — Clinical-ADCN / Nutrition-OS

**Project:** Clinical Nutrition Management System (نظام إدارة التغذية العلاجية)
**Version:** 1.0.0 | **Schema Version:** 7
**Framework:** Expo SDK 56 + React Native 0.85.3 + TypeScript 6.0
**Database:** WatermelonDB 0.27.1 (SQLite native / LokiJS web)
**State:** Zustand 5 + AsyncStorage persistence
**Auth/Sync:** Supabase 2.108.0
**OCR:** Tesseract.js 7.0 (web) + rn-mlkit-ocr 0.3.1 (native)
**Animations:** react-native-reanimated 4.3.1 + react-native-worklets 0.8.3
**Routing:** expo-router 56.2.10 (file-based)
**Build:** EAS (Expo Application Services)
**Total Source Files:** 195 (151 `.ts` + 44 `.tsx`)
**Arabic-First:** Force RTL, ThmanyahSans fonts (5 weights), Arabic locale `ar-YE`

---

## Chapter 1: Global Architectural Blueprint & Persistence Pipeline

### 1.1 Offline-First Architecture

The system implements a strict **Offline-First** pattern where WatermelonDB (SQLite on native, LokiJS/IndexedDB on web) acts as the **single source of truth**. All data mutations flow through WatermelonDB's transactional `database.write()` layer before any UI state is updated.

**Data Flow (Reactive):**

```
User Action → Screen Component
                ↓
         Use Case (domain/use-cases)
                ↓
         Repository (data/repositories)
                ↓
    ┌───────────────────────────┐
    │  WatermelonDB (SQLite)    │ ← Single Source of Truth
    │  database.write() {       │
    │    collection.create()    │
    │  }                        │
    └───────────────────────────┘
                ↓
    ┌───────────────────────────┐
    │  Zustand Store (memory)   │ ← Derived UI Cache
    │  e.g., patientStore,      │
    │  settingsStore            │
    └───────────────────────────┘
                ↓
         React Component Re-render
```

**Key architectural rules:**

1. All CRUD operations go through Repository classes (`src/data/repositories/`) which wrap WatermelonDB queries.
2. Domain Use Cases (`src/domain/use-cases/`) orchestrate business logic, calling repositories and pure calculator functions.
3. Zustand stores (`src/presentation/stores/`) hold derived UI state and are populated by calling use cases. They are **not** authoritative data stores — they are caches.
4. `settingsStore` and `authStore` use `zustand/middleware/persist` with `AsyncStorage` for cross-session state (settings, profiles, auth tokens).
5. `patientStore` is a transient in-memory cache that re-fetches from WatermelonDB on mount via `loadPatients()`.

### 1.2 Cross-Platform Separation Strategy

The project uses Expo's Metro/Webpack resolution system with platform-specific file extensions:

- `*.native.ts` / `*.native.tsx` — Native-only modules (resolved by Metro on iOS/Android)
- `*.web.ts` / `*.web.tsx` — Web-only modules (resolved by Webpack on web)
- `*.ts` / `*.tsx` — Shared modules (resolved on all platforms)

**Platform-split files in the project:**

| Shared Interface | Native Implementation | Web Implementation |
|---|---|---|
| `src/services/ocrService.ts` (re-export) | `src/services/ocrService.ts` (rn-mlkit-ocr) | `src/services/ocrService.web.ts` (tesseract.js) |
| `src/data/database/index.ts` | `src/data/database/index.native.ts` (SQLite) | `src/data/database/index.web.ts` (LokiJS) |
| `app/patient/[id]/WebCropperModal.tsx` | Uses `react-native-advanced-cropper` | `WebCropperModal.web.tsx` (CropperJS via `react-cropper`) |

The `index.ts` files act as resolvers:
```ts
// src/data/database/index.ts
export { getDatabase } from './index.native'; // Native
// OR
export { getDatabase } from './index.web'; // Web
```

**Security/Storage split** is handled inline via `Platform.OS` checks in `securityStore.ts`:
```ts
if (Platform.OS === 'web') {
  localStorage.setItem(pinKey, pin); // Web fallback
} else {
  await SecureStore.setItemAsync(pinKey, pin); // Native Secure Enclave
}
```

### 1.3 System Runtime Architecture (ASCII Dataflow)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        CLINICAL NUTRITION APP                                │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                        PRESENTATION LAYER                              │  │
│  │  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │  │
│  │  │ Screens      │  │ Components       │  │ Hooks                    │  │  │
│  │  │ app/*.tsx     │  │ src/presentation │  │ useAppTheme              │  │  │
│  │  │ (25 screens)  │  │ /components/*    │  │ useClinicalAlerts        │  │  │
│  │  └──────┬───────┘  │ (19 components)   │  │ usePatientForm           │  │  │
│  │         │          └──────────────────┘  │ usePatients              │  │  │
│  │         │                                └──────────┬───────────────┘  │  │
│  │         └──────────────┬──────────────────────────────┘                 │  │
│  │                        ▼                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │  │
│  │  │                    ZUSTAND STORES (Memory Cache)                  │   │  │
│  │  │  patientStore | settingsStore | authStore | securityStore |      │   │  │
│  │  │  syncStore                                                       │   │  │
│  │  └──────────────────────────┬───────────────────────────────────────┘   │  │
│  └─────────────────────────────┼───────────────────────────────────────────┘  │
│                                ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         DOMAIN LAYER                                    │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │ │
│  │  │ Use Cases (33)    │  │ Calculators (12)  │  │ Entities (17)       │  │ │
│  │  │ CalculatePatient- │  │ BmiCalculator    │  │ Patient             │  │ │
│  │  │ MetricsUseCase    │  │ BmrWhoCalculator  │  │ PatientMetrics      │  │ │
│  │  │ InterpretLabResult│  │ IbwCalculator    │  │ NutritionPlan       │  │ │
│  │  │ GetPatientsUseCase│  │ FluidCalculator   │  │ User/Subscription   │  │ │
│  │  │ ...               │  │ DiseaseRules      │  │ LabResult           │  │ │
│  │  └────────┬─────────┘  └──────────────────┘  │ DiseaseRule         │  │ │
│  │           │                                    └──────────────────────┘  │ │
│  │           ▼                                                              │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │  │                REPOSITORY INTERFACES (17 interfaces)              │   │ │
│  │  │  IPatientRepository | ILabResultRepository | IInterventionRepo   │   │ │
│  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────┼───────────────────────────────────────────┘  │
│                                ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           DATA LAYER                                    │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │ │
│  │  │ Repositories (16) │  │ Models (20)       │  │ Database             │  │ │
│  │  │ PatientRepository │  │ LabResult Model   │  │ schema.ts (v7, 23t)  │  │ │
│  │  │ LabResultRepo     │  │ Patient Model     │  │ migrations.ts        │  │ │
│  │  │ ...               │  │ AuditLog Model    │  │ auditTrigger.ts      │  │ │
│  │  └────────┬─────────┘  └──────────────────┘  │ seed.ts              │  │ │
│  │           │                                   └──────────────────────┘  │ │
│  │           ▼                                                             │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │  │              WATERMELONDB (SQLite / LokiJS)                       │   │ │
│  │  │  23 tables | WAL mode (native) | IndexedDB (web)                 │   │ │
│  │  │  Single Source of Truth — Offline-First                           │   │ │
│  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                          │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │  │              CLOUD / SYNC LAYER                                   │   │ │
│  │  │  Supabase client → remote/supabase.ts (CRUD)                     │   │ │
│  │  │  SyncQueue → WatermelonDB-backed change tracking                 │   │ │
│  │  │  SyncEngine → push/pull with last-write-wins                     │   │ │
│  │  │  NetworkMonitor → @react-native-community/netinfo                │   │ │
│  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                    SERVICES / UTILITIES                                  │  │
│  │  OCR: ocrService (ML Kit) / ocrService.web (Tesseract)                  │  │
│  │  AI: AiService + PromptBuilder + ResponseParser + AiCache               │  │
│  │  Alerts: clinicalAlertsEngine.ts                                        │  │
│  │  Security: expo-secure-store + expo-local-authentication                │  │
│  │  Dates: formatRelativeDate / formatSafeDate (ar-YE locale)              │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 2: Full Component Registry & File-by-File Functional Dictionary

### 2.1 Application Root & Configuration

| File Path | Lines | Responsibility |
|---|---|---|
| `app/_layout.tsx` | 229 | Root layout: force RTL (`I18nManager.forceRTL(true)`), font loading (ThmanyahSans 5 weights), global `Text`/`TextInput` font patch, `LockScreen` overlay, Stack navigator with 25 screen routes, auth-aware routing via `useSegments` redirect, session hydration splash screen, 2-minute background auto-lock via `AppState` listener, reanimated theme morphing |
| `app/index.tsx` | 908 | Patient list (home screen): `FlatList` with virtualized rows (`LIST_ITEM_HEIGHT = 110`), search bar, sort order toggle, pull-to-refresh, swipe-to-delete, header with hospital info/username/title from `settingsStore`, toast notifications, empty/error states |
| `app/settings.tsx` | 1062 | Full settings panel: profile management (multi-profile switcher with PIN), theme toggle (night/morning), clinical threshold calibration (urea, creatinine, potassium, sodium), default BMR formula selector, PIN/biometric security section, **cloud account section** (login/register/logout via `authStore`), add-profile modal with PIN setup form, animated cards via `useAppTheme` |
| `app/about.tsx` | ~200 | Developer about screen: profile card, contact links, version info, app description in Arabic |
| `app.json` | ~50 | Expo config: app name "التغذية السريرية", scheme, plugins list (expo-router, expo-secure-store, expo-local-authentication, etc.), web output config |
| `babel.config.js` | ~15 | Babel config with `babel-preset-expo` and `react-native-reanimated/plugin` (must be last) |
| `tsconfig.json` | 8 | Extends `expo/tsconfig.base` with `strict: true`, `experimentalDecorators: true` (required by WatermelonDB), `strictPropertyInitialization: false` |
| `metro.config.js` | ~10 | Metro bundler config (default Expo) |
| `package.json` | ~80 | Dependencies: 42 production, 3 devDeps; scripts: `start`, `android`, `ios`, `web` |

### 2.2 Patient Profile & Screening Engine

| File Path | Lines | Responsibility |
|---|---|---|
| `app/patient/[id].tsx` | ~1200 | Patient detail hub: tabbed interface (summary, lab results, medications, calculations, interventions, follow-up), clinical alerts banner via `useClinicalAlerts` hook, animated metric cards, NRS-2002 screening shortcut, EN/PN calculator shortcut, print-to-PDF via `expo-print`, print-specific CSS injection for web |
| `app/patient/new.tsx` | ~800 | New patient registration form: `react-hook-form` + `zod` validation, 20+ fields (name, age, DOB, gender, nationality, phone, department, bed, diagnosis, type, status), file number auto-generation (`CN-{padded}`), form sections with `ScrollView`, success toast + redirect on save |
| `app/patient/[id]/screening.tsx` | ~600 | NRS-2002 screening tool: 4-step assessment (BMI, weight loss, food intake, disease severity), score calculation with automatic risk classification (0-3 low, 3-4 medium, 5+ high), Arabic-labeled radio groups, result display with recommendations, save to WatermelonDB |
| `app/patient/[id]/clinical-analysis.tsx` | ~500 | Clinical analysis dashboard: anthropometric measurements (weight, height, BMI), `CalculatePatientMetricsUseCase` orchestrator computing all 7 metric types, color-coded result cards (green/yellow/red for normal/borderline/abnormal), editable override mechanism |
| `app/patient/[id]/nutrition-calculator.tsx` | ~800 | EN/PN nutrition calculator: enteral feeding rate computation (Holliday-Segar fluid requirements, calorie density), parenteral nutrition (PN) calculations (dextrose/amino acids/lipids), step-by-step result display, save to `nutritional_plans` table, Arabic-labeled input grid |

### 2.3 Hybrid OCR Scanning Workspace

| File Path | Lines | Responsibility |
|---|---|---|
| `app/patient/[id]/ocr.tsx` | 1163 | OCR scanner screen: image picker (camera + gallery for native, file input for web), `recognizeTextFromImage` dispatcher, `parseMedicalLabText` fuzzy regex engine (Urea, Creatinine, Potassium, Sodium, HbA1c), confidence scoring via `ocrConfidenceService`, per-field verification toggles for low-confidence results, manual override grid, save-to-DB with `InterpretLabResultUseCase`, mock report loader |
| `app/patient/[id]/WebCropperModal.tsx` | ~80 | Image cropper modal (native): allows crop before OCR processing |
| `app/patient/[id]/WebCropperModal.web.tsx` | ~120 | Web-specific image cropper using `react-cropper` (CropperJS wrapper), returns cropped `dataUrl` to OCR pipeline |
| `src/services/ocrService.ts` | 15 | Native OCR: wraps `rn-mlkit-ocr.recognizeText(uri, 'latin')`, returns `OcrRawData { text, words[] }` with block-level confidence |
| `src/services/ocrService.web.ts` | 20 | Web OCR: wraps `Tesseract.recognize(file, 'eng+ara')`, extracts per-word confidence from `result.data.words`, returns `OcrRawData` |
| `src/services/ocrTypes.ts` | 15 | Shared types: `ParsedLabResult` (testName, resultValue, confidence?, isVerified?), `OcrRawData` (text, words?), `OcrWord` (text, confidence, bbox?) |
| `src/services/ocrConfidenceService.ts` | 85 | Confidence engine: `normalizeTesseractWords()` averages word confidences, `computeExtractionConfidence()` scores regex match quality (exact=95, fuzzy=65, value-only=30), `analyzeOcrConfidence()` produces combined report, `getConfidenceColor()`/`getConfidenceLabel()` for UI rendering |

### 2.4 Database, Models & Transactional Repositories

| File Path | Lines | Responsibility |
|---|---|---|
| `src/data/database/schema.ts` | 354 | WatermelonDB app schema v7: 23 table schemas with typed columns, indices, and optional flags |
| `src/data/database/migrations.ts` | 51 | Forward-only migrations: v5 adds `incomplete_sections` to `patients`, v6 creates `audit_logs`, v7 creates `nutritional_plans` |
| `src/data/database/auditTrigger.ts` | 94 | Monkey-patches `Collection.prototype.create` and `Model.prototype.update` on 4 critical tables (`patients`, `lab_results`, `interventions`, `meal_plans`). Writes async audit entries to `audit_logs` with before/after snapshots. Wrapped in defensive `try/catch` to prevent audit failures from blocking primary operations. Also exports `logManualAuditEvent()` for explicit events (LOGIN, EXPORT_PDF, DB_BACKUP). |
| `src/data/database/index.native.ts` | ~30 | Native DB init: creates WatermelonDB SQLite adapter (`expo-sqlite`), calls `setupAuditTriggers()`, exports `getDatabase()` singleton |
| `src/data/database/index.web.ts` | ~30 | Web DB init: creates LokiJS adapter (`localStorage`), exports `getDatabase()` singleton |
| `src/data/database/seed.ts` | ~100 | Seed data: populates `test_catalog` with 20+ lab tests (Arabic/English names, units, reference ranges), inserts `food_items` sample data from `arabicFoodSeed.ts` |
| `src/data/models/Patient.ts` | 30 | WatermelonDB Model: 20 fields, associations: `has_many` to 14 child tables with cascade delete |
| `src/data/models/LabResult.ts` | 25 | WatermelonDB Model: patient_id, test_name, result_value, unit, reference_range_low/high, interpretation, override_reason, test_date, comments, attached_image_path, timestamps |
| `src/data/models/AuditLog.ts` | 8 | WatermelonDB Model: action_type, details (JSON string), user_id, created_at |
| `src/data/models/NutritionalPlan.ts` | 15 | WatermelonDB Model: patient_id, target_calories, protein/carbs/fat_target, fluid_target, meals_json, recommendations_json, timestamps |
| `src/data/repositories/PatientRepository.ts` | ~120 | CRUD with auto file-number generation (`CN-{padded}` from next sequence), `findAll()` with optional where/sort, `create()` with validation |
| `src/data/repositories/LabResultRepository.ts` | 81 | `getByPatientId()`, `getByTestName()`, `save()`, `delete()` with WatermelonDB writes |
| `src/data/repositories/CalculationRepository.ts` | ~100 | `upsertBatch()` for bulk calculation results, `getByPatientId()`, `getByType()` |

### 2.5 Computational Engines & Core Utilities

| File Path | Lines | Responsibility |
|---|---|---|
| `src/domain/use-cases/CalculatePatientMetricsUseCase.ts` | 164 | Master orchestrator: computes BMI, BMR (Mifflin-St Jeor + Harris-Benedict + WHO), Total Energy (TDEE + stress factor), Macronutrients, Fluids, IBW, ABW sequentially. Saves all 7+ results via `CalculationRepository.upsertBatch()`. Selects default formula from `settingsStore.defaultEnergyFormula`. |
| `src/utils/clinicalAlertsEngine.ts` | 109 | `validateLabMetrics()`: evaluates 5 clinical domains (renal, potassium, albumin, glycemic, sodium) against configurable thresholds. Returns `ClinicalAlert[]` with Arabic messages. Thresholds: urea > 40, creatinine > 1.2, potassium > 5.0, sodium > 145, albumin < 3.0, hba1c > 6.5, random glucose > 140. |
| `src/presentation/hooks/useClinicalAlerts.ts` | 131 | React hook: queries latest `lab_results` and `laboratory_records` from WatermelonDB, cross-references Arabic/English test names via fuzzy matching, compiles lab object, passes to `validateLabMetrics()`, returns alerts + loading state. Re-fetches on patientId or threshold change. |
| `src/utils/date.ts` | 85 | `formatRelativeDate()`: returns "اليوم", "غداً", "بعد غد" for 0/1/2-day offsets, falls back to `ar-YE` locale `DD/MM/YYYY`. `formatSafeDate()`: filters NaN, epoch-zero, and 1970 dates, defaulting to current date. |

---

## Chapter 3: Data Schemas, ER Modeling & Trans-Cybersecurity Hardening

### 3.1 SQLite Schema (v7 — 23 Tables)

The complete WatermelonDB schema defines 23 tables with typed columns, indexed foreign keys, and structural cascading behaviors.

**Core Tables:**

| Table | Columns | Key Fields | Indices |
|---|---|---|---|
| `patients` | 18 | `file_number`, `full_name`, `gender`, `primary_diagnosis`, `status`, `patient_type` | `file_number`, `full_name`, `national_id`, `department`, `primary_diagnosis`, `status` |
| `social_histories` | 17 | `patient_id` (FK→patients), `smoking`, `physical_activity`, `dietary_history` | `patient_id` |
| `medical_histories` | 12 | `patient_id` (FK→patients), `chief_complaint`, `current_diagnosis`, `icd_10_code` | `patient_id` |
| `medications` | 11 | `patient_id` (FK), `drug_name`, `dosage`, `route`, `dni_risk` | `patient_id` |
| `supplements` | 6 | `patient_id` (FK), `supplement_name`, `supplement_type` | `patient_id` |
| `lab_results` | 13 | `patient_id` (FK), `test_name`, `result_value`, `unit`, `reference_range_low/high`, `interpretation`, `test_date` | `patient_id`, `test_name`, `test_date` |
| `test_catalog` | 8 | `test_name_ar`, `test_name_en`, `default_unit`, `default_range_low/high`, `critical_low/high_factor`, `category` | `category` |
| `test_reference_ranges` | 6 | `test_catalog_id` (FK), `age_min/max`, `sex`, `range_low/high`, `source` | `test_catalog_id` |
| `physical_exam_items` | 7 | `patient_id` (FK), `domain`, `item_key`, `response` | `patient_id`, `domain` |
| `calculations` | 10 | `patient_id` (FK), `calculation_type`, `formula_name`, `input_values` (JSON), `result_value`, `is_overridden` | `patient_id`, `calculation_type` |
| `calculation_overrides` | 5 | `calculation_id` (FK→calculations), `original_value`, `overridden_value`, `reason`, `overridden_by` | `calculation_id` |
| `interventions` | 22 | `patient_id` (FK), `nutrition_diagnosis`, `diet_type`, `route_of_feeding`, `target_calories/protein/carbs/fat`, `status` | `patient_id`, `status` |
| `follow_up_visits` | 23 | `patient_id` (FK), `intervention_id` (FK, optional, SET NULL), `visit_date`, `current_weight`, `bmi`, `edema`, `enteral_tolerance`, `parenteral_tolerance` | `patient_id`, `intervention_id`, `visit_date` |
| `laboratory_records` | 16 | `patient_id` (FK), `test_date`, `alt`, `ast`, `albumin`, `bilirubin`, `potassium`, `sodium`, `phosphorus`, `urea`, `creatinine`, `blood_glucose`, `hba1c` | `patient_id`, `test_date` |
| `discharge_summaries` | 11 | `patient_id` (FK), `discharge_date`, `final_weight`, `total_days_on_en/pn`, `home_nutrition_plan`, `follow_up_required` | `patient_id`, `discharge_date` |
| `food_items` | 11 | `name_ar`, `name_en`, `category`, `serving_size`, `calories`, `carbs`, `protein`, `fat`, `potassium`, `sodium` | `name_ar` |
| `meal_plans` | 10 | `patient_id` (FK), `plan_date`, `meal_type`, `food_details`, `total_calories/carbs/protein/fat` | `patient_id`, `plan_date` |
| `attachments` | 10 | `patient_id` (FK), `module`, `file_name`, `file_type`, `file_size`, `file_path`, `ocr_text`, `ocr_confirmed` | `patient_id` |
| `settings` | 3 | `key`, `value`, `updated_at` | `key` |
| `audit_logs` | 4 | `action_type`, `details` (JSON), `user_id`, `created_at` | (none) |
| `nutritional_plans` | 10 | `patient_id` (FK), `target_calories`, `protein/carbs/fat_target`, `fluid_target`, `meals_json`, `recommendations_json` | `patient_id` |

**ER Relationships:**

```
patients ◄──1:N── social_histories (cascade delete)
patients ◄──1:N── medical_histories (cascade delete)
patients ◄──1:N── medications (cascade delete)
patients ◄──1:N── supplements (cascade delete)
patients ◄──1:N── lab_results (cascade delete)
patients ◄──1:N── laboratory_records (cascade delete)
patients ◄──1:N── physical_exam_items (cascade delete)
patients ◄──1:N── calculations (cascade delete)
patients ◄──1:N── interventions (cascade delete)
patients ◄──1:N── follow_up_visits (cascade delete)
patients ◄──1:N── discharge_summaries (cascade delete)
patients ◄──1:N── meal_plans (cascade delete)
patients ◄──1:N── attachments (cascade delete)
patients ◄──1:N── nutritional_plans (cascade delete)
interventions ◄──1:N── follow_up_visits (SET NULL on intervention delete)
calculations ◄──1:N── calculation_overrides (cascade delete)
test_catalog ◄──1:N── test_reference_ranges (cascade delete)
```

### 3.2 Audit Logging Framework (`auditTrigger.ts`)

The audit system uses **monkey-patching** on WatermelonDB's native prototypes to intercept all mutations on 4 critical tables:

```ts
const CRITICAL_TABLES = ['patients', 'lab_results', 'interventions', 'meal_plans'];
```

**Create Interception:**
```ts
Collection.prototype.create = async function (recordBuilder) {
  const record = await originalCreate.call(this, recordBuilder);
  if (CRITICAL_TABLES.includes(table) && table !== 'audit_logs') {
    // Defensive try/catch — audit failure does NOT block primary operation
    try {
      const auditCollection = db.collections.get('audit_logs');
      await originalCreate.call(auditCollection, (log: any) => {
        log.actionType = 'EDIT_PATIENT';
        log.userId = activeUser; // From settingsStore
        log.details = JSON.stringify({ action: 'CREATE', table, recordId: record.id, values: record._raw });
      });
    } catch (e) { console.error('[AuditTrigger] Create logging failed:', e); }
  }
  return record;
};
```

**Update Interception:** Captures `_raw` state **before** and **after** the update for full before/after diffing.

**Manual Audit Events:**
```ts
logManualAuditEvent('LOGIN' | 'EDIT_PATIENT' | 'EXPORT_PDF' | 'DB_BACKUP', details)
```

**Security properties:**
- Audit is **asynchronous but blocking** within the same `database.write()` transaction
- Failures are **silently caught** — never propagate to the caller
- All audit entries are JSON-serialized for flexible querying
- User identity comes from `settingsStore.username` (not auth — auditable even offline)

### 3.3 Local Device Security Perimeter

**`securityStore.ts`** manages a defense-in-depth model:

1. **PIN Authentication:**
   - PIN stored via `expo-secure-store` (native Keychain/Keystore) or `localStorage` (web fallback)
   - PIN comparison is **plaintext equality** (`storedPin === pin`) — no hashing (noted as production hardening TODO)
   - Maximum 4-digit numeric PIN (enforced by `LockScreen` keypad)
   - Per-profile PIN isolation (`clinical_nutrition_pin_{profileId}` key suffix)

2. **Biometric Authentication:**
   - Uses `expo-local-authentication` with `hasHardwareAsync()` + `isEnrolledAsync()` gating
   - Falls back to PIN on biometric failure
   - Arabic prompts: `promptMessage: 'الدخول الآمن للنظام'`, `fallbackLabel: 'استخدم رمز PIN'`

3. **Auto-Lock Mechanism:**
   ```ts
   // In app/_layout.tsx
   AppState.addEventListener('change', (nextAppState) => {
     if (nextAppState === 'background') { updateLastActiveTime(); }
     else if (nextAppState === 'active') {
       if (hasPIN && !isLocked) {
         if (Date.now() - lastActiveTime > 2 * 60 * 1000) { lockApp(); }
       }
     }
   });
   ```
   - 2-minute inactivity threshold
   - Triggers on app foreground from background state

4. **LockScreen (`LockScreen.tsx`):**
   - Full-screen overlay with `zIndex: 99999`
   - Custom numeric keypad (no system keyboard, prevents screen capture)
   - Shake animation + vibration on wrong PIN
   - Shows active profile info (username, title, hospital)
   - Auto-triggers biometrics on mount with 500ms delay

5. **Profile Switch Security:**
   - `switchProfile()` in `settingsStore` clears OCR cache (`ImagePicker` temp files), resets patient store, flushes search/sort state, then re-initializes PIN security for the new profile — forcing re-authentication

---

## Chapter 4: Advanced Clinical Computational Calculators & OCR Regex Engines

### 4.1 Metabolic Calculation Calibrations

The system implements 12 standalone calculator modules in `src/domain/calculators/`:

**BMI Calculator (`BmiCalculator.ts`):**
```
BMI = weightKg / (heightCm / 100)²
Classification: <18.5 underweight | 18.5-25 normal | 25-30 overweight | >30 obese
Guards: weight > 500kg or height > 250cm → throw
```

**BMR — Mifflin-St Jeor (`BmrCalculator.ts`):**
```
Male:   BMR = 10W + 6.25H - 5A + 5
Female: BMR = 10W + 6.25H - 5A - 161
Guards: age > 150 → throw
```

**BMR — Harris-Benedict (`BmrHarrisCalculator.ts`):**
```
Male:   BMR = 88.362 + 13.397W + 4.799H - 5.677A
Female: BMR = 447.593 + 9.247W + 3.098H - 4.33A
Returns: step-by-step breakdown for display
```

**BMR — WHO Pediatric (`BmrWhoCalculator.ts`):**
```
12 age/sex brackets with different coefficients:
  0-3 male:   BMR = 60.9W - 54
  3-10 male:  BMR = 22.7W + 495
  10-18 male: BMR = 17.5W + 651
  18-30 male: BMR = 15.3W + 679
  30-60 male: BMR = 11.6W + 879
  >60 male:   BMR = 13.5W + 487
  (Female: different coefficients per same brackets)
```

**IBW — Devine Formula (`IbwCalculator.ts`):**
```
Male:   IBW = 50 + 0.91 × (heightCm - 152.4)
Female: IBW = 45.5 + 0.91 × (heightCm - 152.4)
Fallback: if heightCm < 152.4 → BMI method: IBW = 22 × (heightM)²
```
**Critical correction:** The 152.4 cm height floor prevents negative weights that would result from applying the Devine formula to very short patients. Below this threshold, the system switches to a BMI-target (22) based calculation.

**ABW — Adjusted Body Weight (`AbwCalculator.ts`):**
```
if actualWeight > IBW: ABW = IBW + 0.25 × (actualWeight - IBW)
if actualWeight <= IBW: return null (no adjustment needed)
```

**TDEE Calculator (`TdeeCalculator.ts`):**
```
TDEE = BMR × activityMultiplier
Multipliers: sedentary=1.2 | light=1.375 | moderate=1.55 | active=1.725
```

**Total Energy (`TotalEnergyCalculator.ts`):**
```
Total = TDEE × stressFactor (default 1.0)
Also supports weight-based: 25-30 kcal/kg
```

**Fluid Calculator (`FluidCalculator.ts`):**
```
Simplified: 30-35 mL/kg (returns range + midpoint)
Holliday-Segar:
  ≤10 kg:  100 mL/kg
  10-20 kg: 1000 + 50 × (W-10)
  >20 kg:   1500 + 20 × (W-20)
```

**Macronutrient Calculator (`MacronutrientCalculator.ts`):**
```
Protein = weightKg × proteinPerKg (default 1.2 g/kg)
Fat = totalCal × fatPct / 9 (default 25%)
Carbs = remaining calories / 4
```

**Disease Rules Engine (`DiseaseRules.ts`):**
```
5 disease profiles with keyword matching:
  - Diabetes (DM): carb reduction to 45%, no calorie adjustment
  - Hypertension (HTN): DASH diet, sodium restriction, no calorie adjustment
  - Obesity: -500 kcal deficit
  - CKD (renal): protein restriction to 0.6 g/kg
  - Liver (cirrhosis): 4-6 small meals, sodium restriction
Multiple disease matching = cumulative adjustments (calorie deficit sums, recommendations are unique-merged)
```

**Master Orchestrator (`CalculatePatientMetricsUseCase.ts`):**
Sequentially computes all 7 metric types, inserts into WatermelonDB via `CalculationRepository.upsertBatch()`, and returns full result array. The default energy formula is selected from `settingsStore.defaultEnergyFormula` (Mifflin | Harris-Benedict | Weight-Based).

### 4.2 Fuzzy Regex OCR Matching Dictionary

The OCR parser (`parseMedicalLabText` in `ocr.tsx`) uses a 5-entry fuzzy matching dictionary:

```ts
const testDefinitions = [
  { name: 'Urea', regex: /(ur|ure|urea|بولي|يوريا)/i },
  { name: 'Creatinine', regex: /(creat|cr|crea|كclear|كرياتينين)/i },
  { name: 'Potassium', regex: /(pot|potas|k\+)/i },
  { name: 'Sodium', regex: /(sod|sodium|na\+)/i },
  { name: 'HbA1c', regex: /(hba1c|hba|تراكمي)/i },
];
```

**Matching Algorithm:**
1. Split raw text into lines
2. For each line: sanitize (split stuck tokens like `Urea88.0` → `Urea 88.0`), strip parenthetical ranges `(15-45)`, strip reference range patterns `15-45`, remove special characters
3. Tokenize the cleaned line
4. For each test definition: find first token matching the regex
5. Extract numeric value: scan tokens **after** match index for first number; if none found, scan **before**
6. Deduplicate by test name (first match wins)

**Reference Range Stripping:** The critical regex `cleanLine.replace(/\b\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\b/g, ' ')` removes patterns like `15-45`, `3.5-5.1`, `0.7 - 1.2` before value extraction, preventing the parser from confusing reference ranges with actual results.

### 4.3 Confidence Scoring Algorithm (`ocrConfidenceService.ts`)

**OCR-level confidence:**
- **Web (Tesseract.js):** Average of all per-word `confidence` values from `result.data.words[]`
- **Native (ML Kit):** Default heuristic of 70 (ML Kit doesn't expose per-character confidence)
- **Manual text entry:** 70 heuristic

**Extraction confidence per field (0-95 scale):**
| Condition | Score |
|---|---|
| Exact test name match + value on same line | 95 |
| Exact test name match only | 80 |
| Fuzzy name match + value present | 65 |
| Fuzzy name match only | 50 |
| Value found without clear name | 30 |

**Overall confidence:**
```
overall = 0.4 × ocrConfidence + 0.6 × avg(fieldConfidences)
```

**Thresholds:** < 60 = low (yellow), 60-79 = medium (orange), >= 80 = high (green). Fields below 60 trigger `needsReview` and block saving until manually verified.

---

## Chapter 5: Global Theme Synchronization & Mobile Layout Fluidity Specs

### 5.1 Global Harmony Theme Engine

The theme system synchronizes all visual elements across the application using `react-native-reanimated` shared values, eliminating navigation white flashes during theme transitions.

**Core mechanism (`useAppTheme.ts`):**

```ts
// Global shared value — 0 = MORNING (light), 1 = NIGHT (dark)
export const globalThemeProgress = makeMutable(1);

// On theme change:
globalThemeProgress.value = withTiming(targetValue, {
  duration: 450,
  easing: Easing.inOut(Easing.quad),
});
```

**Four animated style hooks** interpolate between `themeConfig.NIGHT` and `themeConfig.MORNING`:

| Hook | Properties Interpolated |
|---|---|
| `animatedContainer` | `backgroundColor` |
| `animatedCard` | `backgroundColor`, `borderColor` |
| `animatedText` | `color` |
| `animatedSubtext` | `color` |

**Theme Config (`themeConfig.ts`):**

| Property | NIGHT (Dark) | MORNING (Light) |
|---|---|---|
| `background` | `#0F172A` (midnight slate) | `#F1F5F9` (light gray) |
| `card` | `#1E293B` (dark slate) | `#FFFFFF` (white) |
| `text` | `#F8FAFC` (crisp white) | `#0F172A` (dark slate) |
| `border` | `#334155` (slate border) | `#E2E8F0` (light border) |
| `subtext` | `#94A3B8` (muted slate) | `#64748B` (muted gray) |
| `accent` | `#1B6B4A` (forest green) | `#1B6B4A` (forest green) |

**Key property:** The accent color (`#1B6B4A` forest green) remains **constant** across both themes, ensuring action buttons, headers, and primary UI elements maintain brand consistency.

**Performance optimization:** The `makeMutable()` shared value is declared at module scope, meaning all screens/hooks share the **same** animation progress. This guarantees perfectly synchronized transitions regardless of navigation state.

**`colors.ts`** defines 21 semantic color tokens used throughout the app:
```ts
export const colors = {
  primary: '#1B6B4A', primaryDark: '#145237', primaryLight: '#1E293B', primaryContrast: '#FFFFFF',
  surface: '#1E293B', surfaceSecondary: '#0F172A', border: '#334155',
  textPrimary: '#F8FAFC', textSecondary: '#94A3B8', textDisabled: '#64748B',
  success: '#10B981', warning: '#F59E0B', danger: '#EF4444', info: '#3B82F6',
  overlay: 'rgba(0, 0, 0, 0.5)',
};
```

### 5.2 Keyboard Occlusion Resolution

The app handles keyboard occlusion through two mechanisms:

1. **`KeyboardAvoidingView`** wraps all form screens:
   ```tsx
   <KeyboardAvoidingView
     style={styles.flex}
     behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
   >
   ```
   - iOS: `padding` behavior adjusts container height
   - Android/web: `height` behavior adjusts container position

2. **Bottom scroll padding buffer:**
   ```tsx
   // In every ScrollView-based form:
   <View style={{ height: 160 }} />  // or styles.spacer = { height: 60 }
   ```
   The spacer at the bottom of `ScrollView` content ensures the last form field is pushed above the keyboard. Values range from 60px (OCR screen) to 160px (dense forms).

### 5.3 Date Parsing System (`date.ts`)

The system implements a bilingual date formatting system that supports both relative Arabic labels and absolute Hijri/Gregorian dates.

**`formatRelativeDate(dateVal)`:**
```ts
const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
if (diffDays === 0) return 'اليوم';       // Today
if (diffDays === 1) return 'غداً';        // Tomorrow
if (diffDays === 2) return 'بعد غد';      // Day after tomorrow
// Fallback: ar-YE locale absolute date
return d.toLocaleDateString('ar-YE', { day: '2-digit', month: '2-digit', year: 'numeric' });
```

**`formatSafeDate(dateVal)`:**
- Filters: `isNaN(d.getTime())`, `d.getTime() <= 0`, `d.getFullYear() === 1970` (epoch-zero sentinel)
- Falls back to current date if invalid
- Same relative + absolute logic as `formatRelativeDate`

**Edge cases handled:**
- `null` / `undefined` input → current date
- Empty string → current date
- Unix epoch (timestamp 0) → current date (catches WatermelonDB unset date fields)
- Year 1970 → current date (catches SQLite default/zero dates)

### 5.4 Arabic-First Design Decisions

| Aspect | Implementation |
|---|---|
| **RTL** | `I18nManager.forceRTL(true)` + `I18nManager.allowRTL(true)` in `_layout.tsx` |
| **Font** | ThmanyahSans (5 weights: Light, Regular, Medium, Bold, Black) loaded via `expo-font` |
| **Default font** | Global `Text.defaultProps.style.fontFamily = 'ThmanyahSans-Regular'` (patched before any render) |
| **ArabicText component** | Wraps `<Text>` with `writingDirection: 'rtl'` and `textAlign: 'right'`; `bold` prop switches to Bold weight |
| **Date locale** | `ar-YE` (Yemeni Arabic) for date formatting |
| **Error messages** | All app-facing strings in Arabic: validation errors, OCR alerts, clinical warnings, toast messages |
| **Directional icons** | Ionicons `arrow-forward` used for "back" (RTL flips direction automatically) |
| **Flex directions** | `flexDirection: 'row-reverse'` throughout for RTL-correct layouts |
| **Input text alignment** | `textAlign: 'right'` on all `TextInput` fields |
| **Lock screen** | Arabic prompts: "الدخول الآمن للنظام", "يرجى إدخال رمز PIN" |

---

*Report generated from exhaustive 360-degree code audit of the Clinical-ADCN / Nutrition-OS project. Schema v7, 23 tables, 195 source files, 25 screens, 33 use cases, 12 calculators, 16 repositories, 5 Zustand stores, 19 components, 4 hooks, cross-platform OCR split, and 450ms reanimated theme morphing engine documented above.*
