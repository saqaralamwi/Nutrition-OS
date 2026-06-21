================================================================================
AUDIT ALL 18 CLINICAL PATHWAYS — COMPREHENSIVE COVERAGE SCAN
================================================================================

PROJECT: clinical-nutrition-app
PATH: C:\Users\hp\Desktop\ADCN-Clin\clinical-nutrition-app

MISSION:
For EACH of the 18 clinical pathways, audit ALL components across 7 dimensions:
1.  SCREENS — all .tsx files in app/patient/[id]/
2.  ENGINES — all .ts files in src/domain/calculators/
3.  MODELS — all .ts files in src/data/models/
4.  REPOSITORIES — all .ts files in src/data/repositories/
5.  HOOKS — all .ts files in src/presentation/hooks/
6.  TESTS — all .test.ts files in src/domain/calculators/tests/
7.  TYPES — all .ts files in src/domain/types/
8.  DB TABLES — schema.ts entries for each pathway
9.  MODULE CONFIG — entries in app/patient/[id].tsx MODULES_CONFIG
10. SCHEMA MIGRATIONS — relevant migration blocks

================================================================================
THE 18 PATHWAYS
================================================================================

P01  Anemia
P02  Diabetes
P03  Eating Disorders
P04  Gastro-Oncology
P05  Gout
P06  ICU
P07  Nephrology
P08  Orthopedics
P09  Osteoporosis
P10  Pregnancy/Lactation
P11  Stroke
P12  Cardio (Cardiovascular)
P13  Burns
P14  Cirrhosis (Liver)
P15  Dysphagia
P16  Respiratory
P17  Surgical/ERAS
P18  Pediatrics/Growth

================================================================================
STEP 1: MAP PATHWAYS TO ENGINES
================================================================================

MAPPING_TABLE = {
  P01_Anemia: [
    'AnemiaNutritionEngine.ts',
  ],
  P02_Diabetes: [
    'Type2DiabetesEngine.ts',
    'GestationalDiabetesEngine.ts',
    'InsulinCarbRatioEngine.ts',
    'InsulinSensitivityEngine.ts',
  ],
  P03_EatingDisorders: [
    'AnorexiaNutritionalRehab.ts',
    'BulimiaNutritionalPlan.ts',
    'EVAvoidantRestrictiveDiet.ts',
  ],
  P04_GastroOncology: [
    'OncologyCachexiaEngine.ts',
    'GastroHighLossEngine.ts',
    'BariatricProgressiveDietEngine.ts',
    'LowFodmapEngine.ts',
    'GlutenIsolationEngine.ts',
    'MilkAllergenEngine.ts',
  ],
  P05_Gout: [
    'GoutNutritionEngine.ts',
  ],
  P06_ICU: [
    'IcuCriticalCareEngine.ts',
    'IcuLipidCalorieEngine.ts',
    'EnteralNutritionEngine.ts',
    'ParenteralNutritionEngine.ts',
    'PennStateEngine.ts',
    'TpnCompoundingEngine.ts',
    'FluidCalculator.ts',
    'RespiratoryQuotientEngine.ts',
  ],
  P07_Nephrology: [
    'EgfrCalculatorEngine.ts',
    'RenalMineralRestrictionEngine.ts',
    'FluidCalculator.ts',
  ],
  P08_Orthopedics: [
    'OrthopedicBoneHealingEngine.ts',
  ],
  P09_Osteoporosis: [
    'OsteoporosisNutritionEngine.ts',
  ],
  P10_PregnancyLactation: [
    'PregnancyIncrementEngine.ts',
    'LactationIncrementEngine.ts',
    'GestationalDiabetesEngine.ts',
  ],
  P11_Stroke: [
    'StrokeNutritionEngine.ts',
    'DNIEngine.ts',
  ],
  P12_Cardio: [
    'DashComplianceEngine.ts',
    'DryWeightTrackingEngine.ts',
    'DynamicAssessmentEngine.ts',
  ],
  P13_Burns: [
    'BurnMetabolicEngine.ts',
    'F75StabilizationEngine.ts',
    'F100RehabilitationEngine.ts',
  ],
  P14_Cirrhosis: [
    'CirrhosisProtocol.ts',
    'HepatitisProtocol.ts',
  ],
  P15_Dysphagia: [
    'IddsiTextureEngine.ts',
  ],
  P16_Respiratory: [
    'RespiratoryQuotientEngine.ts',
  ],
  P17_SurgicalERAS: [
    'SurgicalErasEngine.ts',
  ],
  P18_PediatricsGrowth: [
    'PediatricZScoreEngine.ts',
    'PediatricGrowthEngine.ts',
    'PediatricCalculator.ts',
    'PediatricEERCalculator.ts',
    'PediatricEerEngine.ts',
    'PediatricFluidRequirement.ts',
    'PediatricProteinRequirement.ts',
    'PediatricRefeedingMonitor.ts',
    'Cdc2022ExtendedBmiEngine.ts',
    'MalnutritionClassifier.ts',
    'stampCalculator.ts',
  ],
}

================================================================================
STEP 2: MAP PATHWAYS TO SCREENS
================================================================================

SCREENS_TABLE = {
  P01_Anemia: [
    'ncp-anemia-gateway.tsx',
    'anemia-assessment.tsx',
  ],
  P02_Diabetes: [
    'ncp-diabetes-gateway.tsx',
  ],
  P03_EatingDisorders: [
    'ncp-eating-disorders-gateway.tsx',
  ],
  P04_GastroOncology: [
    'ncp-gastro-oncology-gateway.tsx',
    'gastro-immunology-deck.tsx',
  ],
  P05_Gout: [
    'ncp-gout-gateway.tsx',
    'gout-assessment.tsx',
    'gout-monitoring.tsx',
    'gout-nutrition-plan.tsx',
  ],
  P06_ICU: [
    'ncp-icu-gateway.tsx',
    'icu-admission.tsx',
    'icu-charts.tsx',
    'icu-critical-care.tsx',
  ],
  P07_Nephrology: [
    'ncp-nephrology-gateway.tsx',
  ],
  P08_Orthopedics: [
    'ncp-orthopedics-gateway.tsx',
  ],
  P09_Osteoporosis: [
    'ncp-osteoporosis-gateway.tsx',
    'osteoporosis-assessment.tsx',
    'osteoporosis-monitoring.tsx',
    'osteoporosis-nutrition-plan.tsx',
  ],
  P10_PregnancyLactation: [
    'ncp-pregnancy-lactation-gateway.tsx',
  ],
  P11_Stroke: [
    'ncp-stroke-gateway.tsx',
    'stroke-assessment.tsx',
    'stroke-monitoring.tsx',
    'stroke-nutrition-plan.tsx',
  ],
  P12_Cardio: [
    'cardio-assessment.tsx',
    'cardio-charts.tsx',
    'cardio-meal-composer.tsx',
  ],
  P13_Burns: [
    'burn-assessment.tsx',
  ],
  P14_Cirrhosis: [
    'cirrhosis-gateway.tsx',
  ],
  P15_Dysphagia: [
    'dysphagia-intervention.tsx',
  ],
  P16_Respiratory: [
    'respiratory-deck.tsx',
  ],
  P17_SurgicalERAS: [
    'surgical-life-gateway.tsx',
  ],
  P18_PediatricsGrowth: [
    'growth-charts.tsx',
    'pediatric-measurement-form.tsx',
    'stamp.tsx',
  ],
}

================================================================================
STEP 3: AUDIT EACH PATHWAY — 7-DIMENSION CHECK
================================================================================

For each pathway P01-P18, run:

```bash
# === [PATHWAY_NAME] ===
echo "=== SCREENS ==="
ls -la app/patient/\[id\]/ | grep -i [keyword]

echo "=== ENGINES ==="
ls -la src/domain/calculators/ | grep -i [keyword]

echo "=== TESTS ==="
ls -la src/domain/calculators/tests/ | grep -i [keyword]

echo "=== MODELS ==="
ls -la src/data/models/ | grep -i [keyword]

echo "=== REPOSITORIES ==="
ls -la src/data/repositories/ | grep -i [keyword]

echo "=== HOOKS ==="
ls -la src/presentation/hooks/ | grep -i [keyword]

echo "=== TYPES ==="
ls -la src/domain/types/ | grep -i [keyword]
```

================================================================================
STEP 4: COMPLETE COVERAGE MATRIX
================================================================================

Create file: scratch/audit/coverageMatrix.ts

```typescript
interface CoverageRow {
  pathway: string;
  screens: { exists: boolean; count: number; files: string[] };
  engines: { exists: boolean; count: number; files: string[] };
  tests: { exists: boolean; count: number; files: string[] };
  models: { exists: boolean; count: number; files: string[] };
  repos: { exists: boolean; count: number; files: string[] };
  hooks: { exists: boolean; count: number; files: string[] };
  types: { exists: boolean; count: number; files: string[] };
  moduleConfig: { exists: boolean; route: string | null };
  score: number; // 0-9
}

const COVERAGE_MATRIX: Record<string, CoverageRow> = {
  // ... populate from audit results
};

function calculateScore(row: CoverageRow): number {
  let score = 0;
  if (row.screens.exists) score++;
  if (row.engines.exists) score++;
  if (row.tests.exists) score++;
  if (row.models.exists) score++;
  if (row.repos.exists) score++;
  if (row.hooks.exists) score++;
  if (row.types.exists) score++;
  if (row.moduleConfig.exists) score++;
  return score;
}

// Print matrix
console.log('=== 18-PATHWAY COVERAGE MATRIX ===\n');
console.log('Pathway'.padEnd(22), 'Scr Eng Mod Rep Hoo Typ Tst Cfg | Score');
console.log('-'.repeat(80));

for (const [name, row] of Object.entries(COVERAGE_MATRIX)) {
  const score = calculateScore(row);
  const bar = [
    row.screens.exists ? '✅' : '❌',
    row.engines.exists ? '✅' : '❌',
    row.models.exists ? '✅' : '❌',
    row.repos.exists ? '✅' : '❌',
    row.hooks.exists ? '✅' : '❌',
    row.types.exists ? '✅' : '❌',
    row.tests.exists ? '✅' : '❌',
    row.moduleConfig.exists ? '✅' : '❌',
  ].join('  ');
  
  console.log(`${name.padEnd(22)} ${bar}  | ${score}/8`);
}

console.log('-'.repeat(80));

// Summary
const totalScore = Object.values(COVERAGE_MATRIX).reduce((sum, r) => sum + calculateScore(r), 0);
const maxScore = Object.keys(COVERAGE_MATRIX).length * 8;
console.log(`\nTotal Score: ${totalScore}/${maxScore} (${((totalScore/maxScore)*100).toFixed(1)}%)`);
console.log(`Average per Pathway: ${(totalScore / Object.keys(COVERAGE_MATRIX).length).toFixed(1)}/8`);
```

================================================================================
STEP 5: CHECK MISSING COMPONENTS
================================================================================

For each pathway, flag missing:
- ✗ Missing screen (no .tsx file)
- ✗ Missing engine (no calculator)
- ✗ Missing model (no WatermelonDB model)
- ✗ Missing repository (no CRUD repo)
- ✗ Missing hooks (no React hook)
- ✗ Missing types (no types file)
- ✗ Missing tests (no .test.ts)
- ✗ Missing module config (no entry in MODULES_CONFIG)
- ✗ Missing DB table (no schema entry)

================================================================================
STEP 6: DEPTH ANALYSIS — SCREEN-LEVEL
================================================================================

For each pathway screen:

```bash
# Check imports (what engines/models/repos does this screen use?)
grep -r "from.*calculators\|from.*models\|from.*repositories\|from.*hooks" app/patient/\[id\]/[screen].tsx

# Check RxJS usage
grep -r "combineLatest\|BehaviorSubject\|Observable\|observe\|watchQuery" app/patient/\[id\]/[screen].tsx

# Check WatermelonDB usage
grep -r "db\.\|Q\.\|write\|create\|destroyPermanently" app/patient/\[id\]/[screen].tsx

# Check Arabic labels
grep -r "title:\|label:\|placeholder:\|'[ء-ي]" app/patient/\[id\]/[screen].tsx | head -20

# Check error handling
grep -r "try\|catch\|error\|throw\|Alert\." app/patient/\[id\]/[screen].tsx | head -10
```

================================================================================
STEP 7: DEPTH ANALYSIS — ENGINE-LEVEL
================================================================================

For each pathway engine:

```bash
# Check method signatures
grep -r "^  [a-z].*(" src/domain/calculators/[engine].ts

# Check typed returns
grep -r "): " src/domain/calculators/[engine].ts | head -10

# Check rounding (2 decimal places)
grep -r "toFixed\|Math.round\|\.round" src/domain/calculators/[engine].ts

# Check defensive checks
grep -r "if.*NaN\|if.*null\|if.*undefined\|if.*<= 0\|if.*< 0" src/domain/calculators/[engine].ts
```

================================================================================
STEP 8: OUTPUT — FINAL AUDIT REPORT
================================================================================

Write: scratch/audit/18_Pathway_Audit_Report.md

FORMAT:
```markdown
# 18-Pathway Comprehensive Audit Report

## Summary
- Total Pathways: 18
- Total Screens: [COUNT]
- Total Engines: [COUNT]
- Total Tests: [COUNT]
- Total Models: [COUNT]
- Total Repositories: [COUNT]
- Total Hooks: [COUNT]
- Total Type Files: [COUNT]
- Overall Coverage: [SCORE]/144 ([PERCENT]%)

## Coverage Matrix
| Pathway | Scr | Eng | Mod | Rep | Hoo | Typ | Tst | Cfg | Score |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:-----:|
| Anemia | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | 5/8 |
| Diabetes | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | 4/8 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

## Detailed Findings

### P01 Anemia
- **Screens:** ✅ ncp-anemia-gateway.tsx, anemia-assessment.tsx
- **Engines:** ✅ AnemiaNutritionEngine.ts
- **Tests:** ❌ NO TESTS FOUND ⚠️
- **Models:** ❌ NO MODEL (no AnemiaModel.ts in src/data/models/)
- **Repositories:** ❌ NO REPOSITORY
- **Hooks:** ✅ useAnemiaAssessment.ts, useAnemiaNutritionPlan.ts, useAnemiaMonitoring.ts
- **Types:** ✅ src/domain/types/anemia.ts
- **Module Config:** ✅ entry in MODULES_CONFIG
- **Missing:** Tests, Model, Repository

### P02 Diabetes
...

## Ranking (Best → Worst)
1. Gout — 8/8 ⭐ (Fully covered)
2. ...
18. [...]

## Recommendations
1. Create missing models for [list]
2. Create missing repositories for [list]
3. Write tests for [list]
4. Add module config entries for [list]
5. Add DB schema tables for [list]
```

================================================================================
STEP 9: ALREADY KNOWN GAPS (FROM AGENTS.md)
================================================================================

Pre-existing issues to flag in audit:
1. ❌ Ghost UI: clinical-analysis.tsx — full data loss
2. ❌ Ghost UI: dietary-history.tsx — broken callback
3. ❌ Dead engines: 8 pediatric/SAM engines (dead code)
4. ❌ Dead code: syncStore — 100% dead (5 orphaned actions)
5. ❌ 27 dark tables (37.5% of schema — tables with no model/repo)
6. ❌ 20+ dead engine files
7. ❌ PediatricZScoreEngine queries empty who_growth_standards table
8. ❌ Pre-existing tsc error at app/admin/hidden-calories-dashboard.tsx:197

================================================================================
END OF AUDIT PROMPT
================================================================================
