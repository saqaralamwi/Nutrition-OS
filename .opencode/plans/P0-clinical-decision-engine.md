# P0: Clinical Decision Engine - خطة التنفيذ

## 1. الملفات المطلوب إنشاؤها

### 1.1 أنواع البيانات (Types)

**`src/domain/clinical/types/index.ts`**

```typescript
// Core type definitions for the clinical engine:

export type ClinicalPhase =
  | 'healthy' | 'pediatrics' | 'pregnancy' | 'sports'
  | 'weight_management' | 'chronic_disease' | 'critical_care' | 'special_conditions';

export type PatientCategory =
  | 'healthy_adult' | 'healthy_elderly'
  | 'infant' | 'toddler' | 'child' | 'adolescent'
  | 'pregnancy_normal' | 'pregnancy_high_risk' | 'lactation'
  | 'endurance_athlete' | 'strength_athlete' | 'recreational_athlete'
  | 'obesity_loss' | 'underweight_gain'
  | 'diabetes_t1' | 'diabetes_t2' | 'ckd_nondialysis' | 'ckd_dialysis'
  | 'cardiovascular' | 'hypertension'
  | 'icu_ventilated' | 'icu_non_ventilated' | 'sepsis' | 'trauma'
  | 'gastrointestinal' | 'liver_disease' | 'respiratory_disease'
  | 'oncology' | 'autoimmune' | 'transplant';

export type Severity = 'mild' | 'moderate' | 'severe' | 'critical';
export type AlertPriority = 'critical' | 'high' | 'medium' | 'low';

export interface ProtocolNutrientTargets {
  calories: string;       // e.g. "25-30 kcal/kg"
  protein: number;        // g/kg
  carbsPercent: number;   // % of total calories
  fatPercent: number;     // % of total calories
  fluid: string;          // e.g. "30 ml/kg"
  glucoseTarget?: string;
  specialNutrients?: string[];
}

export interface ClinicalProtocol {
  id: string;
  category: PatientCategory;
  phase: ClinicalPhase;
  name: string;
  nameAr: string;
  nutrientTargets: ProtocolNutrientTargets;
  guidelines: string[];       // evidence-based guidelines references
  specialConsiderations: string[];
  contraindications: string[];
  monitoringRequirements: string[];
}

export interface PatientStory {
  summary: string;
  medicalHistory: {
    primaryDiagnosis: string;
    chronicConditions: string[];
    surgeries: string[];
    hospitalizations: string[];
    allergies: string[];
  };
  nutritionHistory: {
    previousDiets: string[];
    foodPreferences: string[];
    foodIntolerances: string[];
    eatingPatterns: string[];
  };
  currentMedications: {
    medications: string[];
    hiddenCalories: number;
  };
  currentIssues: {
    weightChange: number;
    glucoseIssues: boolean;
    electrolyteIssues: boolean;
    malnutrition: boolean;
  };
  narrative: string;
}

export interface RiskAssessment {
  refeeding: { riskScore: number; riskLevel: 'low' | 'medium' | 'high'; recommendations: string[] };
  overfeeding: { riskScore: number; riskLevel: 'low' | 'medium' | 'high'; hiddenCalories: number };
  muscleWasting: { riskScore: number; riskLevel: 'low' | 'medium' | 'high' };
  hyperglycemia: { riskScore: number; riskLevel: 'low' | 'medium' | 'high' };
  malnutrition: { riskScore: number; riskLevel: 'low' | 'medium' | 'high'; type?: string };
}

export interface ClinicalAssessment {
  severity: Severity;
  nutritionalDiagnosis: string;
  risks: RiskAssessment;
  problems: string[];
  goals: string[];
  overallAssessment: string;
}

export interface NutritionIntervention {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  education: string[];
}

export interface ClinicalRecommendation {
  priority: AlertPriority;
  category: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  evidenceLevel?: string;
}

export interface MonitoringPlan {
  frequency: string;
  parameters: string[];
  tests: string[];
  followUpSchedule: string;
  reassessmentCriteria: string[];
}

export interface TreatmentPlan {
  nutrition: {
    calories: number;
    protein: number;
    proteinPerKg: number;
    carbs: number;
    carbsPercent: number;
    fat: number;
    fatPercent: number;
    fluid: number;
  };
  medications: string[];
  monitoring: MonitoringPlan;
  followUp: string[];
  goals: string[];
  expectations: string;
}

export interface ComprehensiveReport {
  patientInfo: {
    name: string; age: number; gender: string;
    weight: number; height: number; bmi: number;
    department: string; diagnosis: string;
  };
  patientStory: PatientStory;
  clinicalAssessment: ClinicalAssessment;
  protocol: ClinicalProtocol;
  treatmentPlan: TreatmentPlan;
  interventions: NutritionIntervention;
  recommendations: ClinicalRecommendation[];
  monitoringPlan: MonitoringPlan;
  executiveSummary: string;
  alerts: string[];
  conclusion: string;
  generatedAt: string;
}

export interface ClinicalEngineInput {
  patient: import('../../entities/Patient').Patient;
  weightKg: number; heightCm: number; age: number;
  isMale: boolean; diagnosis: string; department: string;
  glucoseMgDl?: number; phosphorus?: number; potassium?: number;
  magnesium?: number; albumin?: number; creatinine?: number; urea?: number;
  medications?: string[];
  isVentilated?: boolean; onDialysis?: boolean;
  hasDiabetes?: boolean; hasKidneyDisease?: boolean;
  weightChangePercent?: number; npoDays?: number; hasMalnutrition?: boolean;
}

export interface ClinicalEngineOutput {
  patientStory: PatientStory;
  assessment: ClinicalAssessment;
  protocol: ClinicalProtocol;
  treatmentPlan: TreatmentPlan;
  interventions: NutritionIntervention;
  recommendations: ClinicalRecommendation[];
  monitoringPlan: MonitoringPlan;
  report: ComprehensiveReport;
}
```

---

### 1.2 ProtocolRegistry

**`src/domain/clinical/protocols/ProtocolRegistry.ts`**

```typescript
import { ClinicalProtocol, PatientCategory } from '../types';

export class ProtocolRegistry {
  private static protocols: Map<PatientCategory, ClinicalProtocol> = new Map();

  static register(protocol: ClinicalProtocol): void {
    this.protocols.set(protocol.category, protocol);
  }

  static get(category: PatientCategory): ClinicalProtocol {
    const protocol = this.protocols.get(category);
    if (!protocol) throw new Error(`No protocol registered for: ${category}`);
    return protocol;
  }

  static getAll(): ClinicalProtocol[] {
    return Array.from(this.protocols.values());
  }

  static getByPhase(phase: string): ClinicalProtocol[] {
    return this.getAll().filter(p => p.phase === phase);
  }

  static registerAll(protocols: ClinicalProtocol[]): void {
    protocols.forEach(p => this.register(p));
  }
}
```

---

### 1.3 ProtocolSelector

**`src/domain/clinical/engine/ProtocolSelector.ts`**

```typescript
import { Patient } from '../../../entities/Patient';
import { ClinicalProtocol, PatientCategory } from '../types';
import { ProtocolRegistry } from '../protocols/ProtocolRegistry';

export class ProtocolSelector {
  static select(patient: Patient, weightKg: number, age: number): ClinicalProtocol {
    const category = this.matchCategory(patient, age);
    return ProtocolRegistry.get(category);
  }

  private static matchCategory(patient: Patient, age: number): PatientCategory {
    const diagnosis = (patient.primaryDiagnosis || '').toLowerCase();
    const department = (patient.department || '').toLowerCase();

    // Phase 7: Critical Care - check first (highest priority)
    if (department === 'icu' || department === 'critical-care' || diagnosis.includes('icu') || diagnosis.includes('ventilat') || diagnosis.includes('sepsis') || diagnosis.includes('trauma')) {
      if (diagnosis.includes('sepsis')) return 'sepsis';
      if (diagnosis.includes('trauma') || diagnosis.includes('صدمة')) return 'trauma';
      return 'icu_ventilated'; // default to ventilated ICU
    }

    // Phase 6: Chronic Diseases
    if (diagnosis.includes('diabetes') || diagnosis.includes('سكري') || department === 'diabetes') {
      if (diagnosis.includes('type 1') || diagnosis.includes('t1d')) return 'diabetes_t1';
      return 'diabetes_t2';
    }
    if (diagnosis.includes('ckd') || diagnosis.includes('kidney') || diagnosis.includes('كلية') || diagnosis.includes('كلى') || diagnosis.includes('renal')) {
      if (diagnosis.includes('dialysis') || diagnosis.includes('ديال')) return 'ckd_dialysis';
      return 'ckd_nondialysis';
    }
    if (diagnosis.includes('heart') || diagnosis.includes('cardiovascular') || diagnosis.includes('قلب')) return 'cardiovascular';
    if (diagnosis.includes('hypertension') || diagnosis.includes('ضغط')) return 'hypertension';

    // Phase 5: Weight Management
    if (diagnosis.includes('obesity') || diagnosis.includes('obese') || diagnosis.includes('سمنة') || diagnosis.includes('زيادة وزن')) return 'obesity_loss';
    if (diagnosis.includes('underweight') || diagnosis.includes('نحافة') || diagnosis.includes('نقص وزن')) return 'underweight_gain';

    // Phase 2: Pediatrics
    if (age <= 1) return 'infant';
    if (age <= 3) return 'toddler';
    if (age <= 12) return 'child';
    if (age <= 18) return 'adolescent';

    // Phase 3: Pregnancy
    if (department === 'obgyn' || department === 'pregnancy' || diagnosis.includes('pregnancy') || diagnosis.includes('حمل') || diagnosis.includes('lactation') || diagnosis.includes('رضاعة')) {
      if (diagnosis.includes('lactation') || diagnosis.includes('رضاعة')) return 'lactation';
      if (diagnosis.includes('high risk') || diagnosis.includes('خطورة')) return 'pregnancy_high_risk';
      return 'pregnancy_normal';
    }

    // Phase 4: Sports
    if (department === 'sports' || department === 'nutrition_sports') {
      if (diagnosis.includes('endurance') || diagnosis.includes('تحمل')) return 'endurance_athlete';
      if (diagnosis.includes('strength') || diagnosis.includes('قوة')) return 'strength_athlete';
      return 'recreational_athlete';
    }

    // Phase 8: Special Conditions
    if (diagnosis.includes('liver') || diagnosis.includes('كبد') || diagnosis.includes('hepatic')) return 'liver_disease';
    if (diagnosis.includes('gi') || diagnosis.includes('gastro') || diagnosis.includes('هضمي') || diagnosis.includes('colitis') || diagnosis.includes('crohn')) return 'gastrointestinal';
    if (diagnosis.includes('respiratory') || diagnosis.includes('رئة') || diagnosis.includes('copd') || diagnosis.includes('asthma')) return 'respiratory_disease';
    if (diagnosis.includes('cancer') || diagnosis.includes('tumor') || diagnosis.includes('سرطان') || diagnosis.includes('ورم') || diagnosis.includes('oncology')) return 'oncology';
    if (diagnosis.includes('transplant') || diagnosis.includes('زرع')) return 'transplant';
    if (diagnosis.includes('autoim') || diagnosis.includes('lupus') || diagnosis.includes('rheumatoid') || diagnosis.includes('مناعي')) return 'autoimmune';

    // Phase 1: Healthy - by age
    if (age >= 65) return 'healthy_elderly';
    return 'healthy_adult';
  }
}
```

---

### 1.4 PatientStoryBuilder

**`src/domain/clinical/engine/PatientStoryBuilder.ts`**

```typescript
import { PatientStory, ClinicalEngineInput } from '../types';

export class PatientStoryBuilder {
  static build(input: ClinicalEngineInput): PatientStory {
    const narrative = this.buildNarrative(input);
    return {
      summary: `${input.patient.fullName}, ${input.age} سنة، ${input.isMale ? 'ذكر' : 'أنثى'}، وزن ${input.weightKg} كلغ، BMI ${this.calcBmi(input.weightKg, input.heightCm)}`,
      medicalHistory: {
        primaryDiagnosis: input.diagnosis,
        chronicConditions: [],
        surgeries: [],
        hospitalizations: [],
        allergies: [],
      },
      nutritionHistory: {
        previousDiets: [],
        foodPreferences: [],
        foodIntolerances: [],
        eatingPatterns: [],
      },
      currentMedications: {
        medications: input.medications || [],
        hiddenCalories: 0,
      },
      currentIssues: {
        weightChange: input.weightChangePercent || 0,
        glucoseIssues: (input.glucoseMgDl || 0) > 140 || (input.glucoseMgDl || 0) < 70,
        electrolyteIssues: (input.phosphorus || 1) < 0.8 || (input.potassium || 4) < 3.5,
        malnutrition: this.calcBmi(input.weightKg, input.heightCm) < 18.5 || (input.hasMalnutrition || false),
      },
      narrative,
    };
  }

  private static buildNarrative(input: ClinicalEngineInput): string {
    const bmi = this.calcBmi(input.weightKg, input.heightCm);
    const gender = input.isMale ? 'ذكر' : 'أنثى';
    const parts: string[] = [];

    parts.push(`"${input.patient.fullName}" ${gender}، ${input.age} سنة.`);
    parts.push(`الوزن ${input.weightKg} كلغ، الطول ${input.heightCm} سم، BMI ${bmi.toFixed(1)}.`);
    parts.push(`التشخيص: ${input.diagnosis}.`);

    if (input.glucoseMgDl) {
      parts.push(`سكر الدم: ${input.glucoseMgDl} mg/dL.`);
    }
    if (bmi < 16) {
      parts.push('المريض يعاني من سوء تغذية شديد - خطر متلازمة إعادة التغذية عالٍ.');
    } else if (bmi < 18.5) {
      parts.push('المريض يعاني من نقص الوزن.');
    } else if (bmi >= 30) {
      parts.push('المريض يعاني من السمنة.');
    }

    if (input.isVentilated) {
      parts.push('المريض على جهاز تنفس اصطناعي.');
    }
    if (input.onDialysis) {
      parts.push('المريض على جلسات غسيل كلوي.');
    }

    return parts.join('\n');
  }

  private static calcBmi(weight: number, height: number): number {
    if (height <= 0) return 0;
    return weight / Math.pow(height / 100, 2);
  }
}
```

---

### 1.5 ClinicalAssessmentEngine

**`src/domain/clinical/engine/ClinicalAssessmentEngine.ts`**

```typescript
import { ClinicalAssessment, RiskAssessment, Severity, ClinicalEngineInput } from '../types';

export class ClinicalAssessmentEngine {
  static assess(input: ClinicalEngineInput): ClinicalAssessment {
    const bmi = this.calcBmi(input.weightKg, input.heightCm);
    const severity = this.determineSeverity(input, bmi);
    const nutritionalDiagnosis = this.diagnoseNutrition(bmi, input);
    const risks = this.assessRisks(input, bmi);
    const problems = this.identifyProblems(input, bmi, risks);
    const goals = this.identifyGoals(input, nutritionalDiagnosis);

    return {
      severity,
      nutritionalDiagnosis,
      risks,
      problems,
      goals,
      overallAssessment: this.buildAssessment(input, bmi, severity, nutritionalDiagnosis, risks),
    };
  }

  private static calcBmi(w: number, h: number): number {
    return h > 0 ? w / Math.pow(h / 100, 2) : 0;
  }

  private static determineSeverity(input: ClinicalEngineInput, bmi: number): Severity {
    let score = 0;
    if (bmi < 16) score += 3;
    else if (bmi < 18.5) score += 2;
    if ((input.weightChangePercent || 0) > 10) score += 2;
    else if ((input.weightChangePercent || 0) > 5) score += 1;
    if ((input.phosphorus || 1) < 0.8) score += 2;
    else if ((input.phosphorus || 1) < 1.0) score += 1;
    if ((input.potassium || 4) < 3.5) score += 2;
    else if ((input.potassium || 4) < 3.8) score += 1;
    if ((input.glucoseMgDl || 0) > 200) score += 2;
    else if ((input.glucoseMgDl || 0) > 180) score += 1;
    if (input.isVentilated) score += 2;
    if (input.department === 'ICU' || input.department === 'icu') score += 2;
    if (input.hasDiabetes) score += 1;
    if (input.hasKidneyDisease) score += 1;
    return score >= 8 ? 'critical' : score >= 5 ? 'severe' : score >= 3 ? 'moderate' : 'mild';
  }

  private static diagnoseNutrition(bmi: number, input: ClinicalEngineInput): string {
    if (bmi < 16) return 'سوء تغذية شديد (Severe Malnutrition)';
    if (bmi < 18.5) return 'سوء تغذية (Malnutrition)';
    if (bmi >= 30) return 'سمنة (Obesity)';
    if ((input.weightChangePercent || 0) > 10) return 'فقدان وزن كبير (Significant Weight Loss)';
    if ((input.glucoseMgDl || 0) > 140) return 'اضطراب سكر الدم (Dysglycemia)';
    if (input.hasKidneyDisease) return 'احتياجات خاصة لأمراض الكلى (CKD-Specific)';
    return 'تغذية طبيعية (Normal Nutrition)';
  }

  private static assessRisks(input: ClinicalEngineInput, bmi: number): RiskAssessment {
    const refeedingScore =
      ((input.phosphorus || 1) < 0.8 ? 2 : (input.phosphorus || 1) < 1.0 ? 1 : 0) +
      ((input.potassium || 4) < 3.5 ? 2 : (input.potassium || 4) < 3.8 ? 1 : 0) +
      ((input.magnesium || 1) < 0.7 ? 2 : 0) +
      (bmi < 16 ? 3 : bmi < 18.5 ? 1 : 0) +
      ((input.npoDays || 0) >= 5 ? 1 : 0) +
      ((input.weightChangePercent || 0) > 10 ? 1 : 0);

    const glucoseRisk = (input.glucoseMgDl || 0) > 200 ? 3 : (input.glucoseMgDl || 0) > 140 ? 1 : 0;

    const muscleWastingRisk =
      ((input.weightChangePercent || 0) > 10 ? 2 : (input.weightChangePercent || 0) > 5 ? 1 : 0) +
      (bmi < 18.5 ? 1 : 0);

    return {
      refeeding: {
        riskScore: refeedingScore,
        riskLevel: refeedingScore >= 5 ? 'high' : refeedingScore >= 3 ? 'medium' : 'low',
        recommendations: refeedingScore >= 3
          ? ['تقييد السعرات الحرارية في اليوم الأول', 'مراقبة الفوسفور والبوتاسيوم والمغنيسيوم يومياً', 'تعويض الإلكتروليتات قبل البدء بالتغذية']
          : [],
      },
      overfeeding: {
        riskScore: input.isVentilated ? 2 : 0,
        riskLevel: 'low',
        hiddenCalories: 0,
      },
      muscleWasting: {
        riskScore: muscleWastingRisk,
        riskLevel: muscleWastingRisk >= 2 ? 'high' : muscleWastingRisk >= 1 ? 'medium' : 'low',
      },
      hyperglycemia: {
        riskScore: glucoseRisk,
        riskLevel: glucoseRisk >= 2 ? 'high' : glucoseRisk >= 1 ? 'medium' : 'low',
      },
      malnutrition: {
        riskScore: bmi < 18.5 ? 3 : bmi < 20 ? 1 : 0,
        riskLevel: bmi < 16 ? 'high' : bmi < 18.5 ? 'medium' : 'low',
        type: bmi < 16 ? 'Severe' : bmi < 18.5 ? 'Moderate' : undefined,
      },
    };
  }

  private static identifyProblems(input: ClinicalEngineInput, bmi: number, risks: RiskAssessment): string[] {
    const problems: string[] = [];
    if (risks.refeeding.riskLevel === 'high') problems.push('خطر متلازمة إعادة التغذية');
    if (risks.hyperglycemia.riskLevel === 'high') problems.push('فرط سكر الدم غير المسيطر عليه');
    if (risks.muscleWasting.riskLevel === 'high') problems.push('خطر هزال العضلات');
    if (bmi < 18.5) problems.push('نقص الوزن');
    if (bmi >= 30) problems.push('السمنة');
    if (input.hasKidneyDisease) problems.push('مرض كلوي - يحتاج تقييد بروتين/بوتاسيوم/فوسفور');
    if (input.isVentilated) problems.push('مريض على جهاز تنفس - يحتاج تقليل الكربوهيدرات');
    return problems;
  }

  private static identifyGoals(input: ClinicalEngineInput, diagnosis: string): string[] {
    const goals = ['تحقيق التوازن الغذائي', 'منع المزيد من التدهور الغذائي'];
    if (diagnosis.includes('Severe') || diagnosis.includes('Malnutrition')) goals.push('استعادة الوزن والكتلة العضلية');
    if (diagnosis.includes('Obesity')) goals.push('فقدان الوزن التدريجي');
    if ((input.glucoseMgDl || 0) > 140) goals.push('السيطرة على سكر الدم (80-140 mg/dL)');
    if (input.isVentilated) goals.push('تقليل إنتاج CO2 من خلال خفض الكربوهيدرات');
    if (input.onDialysis) goals.push('تعويض البروتين المفقود خلال الغسيل الكلوي');
    return goals;
  }

  private static buildAssessment(input: ClinicalEngineInput, bmi: number, severity: Severity, diagnosis: string, risks: RiskAssessment): string {
    return `مريض ${input.isMale ? 'ذكر' : 'أنثى'} عمر ${input.age} سنة. التشخيص الغذائي: ${diagnosis}. الشدة: ${severity}. BMI: ${bmi.toFixed(1)}. ` +
      `خطر إعادة التغذية: ${risks.refeeding.riskLevel} (${risks.refeeding.riskScore}/6). ` +
      `خطر فرط السكر: ${risks.hyperglycemia.riskLevel}. ` +
      `خطر هزال العضلات: ${risks.muscleWasting.riskLevel}.`;
  }
}
```

---

### 1.6 ClinicalDecisionEngine (المحرك الرئيسي)

**`src/domain/clinical/engine/ClinicalDecisionEngine.ts`**

```typescript
import { ClinicalEngineInput, ClinicalEngineOutput } from '../types';
import { ProtocolSelector } from './ProtocolSelector';
import { PatientStoryBuilder } from './PatientStoryBuilder';
import { ClinicalAssessmentEngine } from './ClinicalAssessmentEngine';
import { DepartmentPlannerRegistry, PlannerPatient } from '../../calculators/DepartmentPlannerRegistry';
import { calculateNutritionalRequirementsWithHiddenCalories } from '../../calculators/NutritionEngine';
import { validateLabMetrics } from '../../../utils/clinicalAlertsEngine';

export class ClinicalDecisionEngine {
  static async process(input: ClinicalEngineInput): Promise<ClinicalEngineOutput> {
    // 1. Build patient story
    const patientStory = PatientStoryBuilder.build(input);

    // 2. Assess patient
    const assessment = ClinicalAssessmentEngine.assess(input);

    // 3. Select protocol
    const protocol = ProtocolSelector.select(input.patient, input.weightKg, input.age);

    // 4. Get planner-based calculations
    const plannerPatient: PlannerPatient = {
      ...input.patient as any,
      weight_kg: input.weightKg,
      height_cm: input.heightCm,
      age: input.age,
      is_ventilated: input.isVentilated,
      has_diabetes: input.hasDiabetes,
      has_kidney_disease: input.hasKidneyDisease,
      on_dialysis: input.onDialysis,
    };
    const planner = DepartmentPlannerRegistry.getPlannerByPatient(plannerPatient);
    const calories = Math.round(planner.calculateTEE(plannerPatient));
    const protein = Math.round(planner.calculateProtein(plannerPatient));
    const carbs = Math.round(planner.calculateCarbs(plannerPatient, calories));
    const fat = Math.round(planner.calculateFat(plannerPatient, calories));
    const proteinPerKg = input.weightKg > 0 ? protein / input.weightKg : 1.2;

    // 5. Get advanced calculations (hidden calories, etc.)
    let hiddenCalories = 0;
    try {
      const advanced = await calculateNutritionalRequirementsWithHiddenCalories(input.patient.id);
      hiddenCalories = advanced.hiddenCalories.total;
    } catch {}

    // 6. Build treatment plan
    const treatmentPlan = {
      nutrition: {
        calories,
        protein,
        proteinPerKg,
        carbs,
        carbsPercent: calories > 0 ? Math.round((carbs * 4 / calories) * 100) : 55,
        fat,
        fatPercent: calories > 0 ? Math.round((fat * 9 / calories) * 100) : 30,
        fluid: Math.round(30 * input.weightKg),
      },
      medications: input.medications || [],
      monitoring: {
        frequency: 'يومي',
        parameters: ['الوزن', 'سكر الدم', 'الإلكتروليتات', 'توازن السوائل'],
        tests: ['صورة دم كاملة', 'وظائف الكلى', 'وظائف الكبد', 'فيتامين د'],
        followUpSchedule: 'أسبوعيا لإعادة التقييم',
        reassessmentCriteria: ['تغير الوزن > 5%', 'تغير الحالة السريرية', 'نتائج مختبر غير طبيعية'],
      },
      followUp: ['مراجعة أسبوعية', 'تقييم الالتزام بالحمية', 'تعديل الخطة حسب الاستجابة'],
      goals: assessment.goals,
      expectations: `تحسن الحالة الغذائية خلال 7-14 يوماً مع الالتزام بالخطة العلاجية`,
    };

    // 7. Define interventions
    const interventions = {
      immediate: assessment.risks.refeeding.riskLevel === 'high'
        ? ['تقييد السعرات إلى 10 كيلو كالوري/كلغ في اليوم الأول', 'مراقبة الفوسفور والبوتاسيوم قبل البدء', 'تعويض الإلكتروليتات']
        : ['البدء بالتغذية حسب الخطة'],
      shortTerm: ['زيادة السعرات تدريجياً', 'مراقبة تحمل التغذية', 'تعديل الماكرو nutrients حسب الاستجابة'],
      longTerm: protocol.specialConsiderations,
      education: ['توعية المريض بالحمية المطلوبة', 'تعليم المريض قراءة الملصقات الغذائية'],
    };

    // 8. Generate recommendations
    const recommendations = [
      {
        priority: 'high' as const,
        category: 'Nutrition',
        title: 'خطة تغذية مخصصة',
        titleAr: `خطة تغذية لـ ${assessment.nutritionalDiagnosis}`,
        description: `TEE: ${calories} kcal/day, Protein: ${protein} g/day (${proteinPerKg.toFixed(1)} g/kg)`,
        descriptionAr: `السعرات: ${calories} ك.ك/يوم، البروتين: ${protein} غ/يوم`,
      },
      ...(assessment.risks.refeeding.riskLevel === 'high'
        ? [{
            priority: 'critical' as const,
            category: 'Nutrition',
            title: 'Caloric Restriction',
            titleAr: 'تقييد السعرات لإعادة التغذية',
            description: 'Day 1: 10 kcal/kg',
            descriptionAr: 'اليوم 1: 10 ك.ك/كلغ، اليوم 2: 12، اليوم 3: 15',
          }]
        : []),
      ...protocol.specialConsiderations.slice(0, 3).map(s => ({
        priority: 'medium' as const,
        category: 'General',
        title: s,
        titleAr: s,
        description: s,
        descriptionAr: s,
      })),
    ];

    // 9. Build monitoring plan
    const monitoringPlan = {
      frequency: protocol.phase === 'critical_care' ? 'يومياً' : 'أسبوعياً',
      parameters: protocol.monitoringRequirements,
      tests: assessment.risks.malnutrition.riskLevel === 'high' ? ['ألبومين', 'بري-ألبومين', 'فيتامين د'] : ['صورة دم'],
      followUpSchedule: protocol.phase === 'critical_care' ? 'كل 24 ساعة' : 'أسبوعياً',
      reassessmentCriteria: ['تغير الوزن', 'تغير الحالة السريرية'],
    };

    // 10. Get clinical alerts
    let alerts: string[] = [];
    try {
      const clinicalAlerts = validateLabMetrics(
        { phosphorus: input.phosphorus, potassium: input.potassium, magnesium: input.magnesium, albumin: input.albumin, bloodGlucose: input.glucoseMgDl, creatinine: input.creatinine, urea: input.urea },
        undefined,
        { weightKg: input.weightKg, bmi: this.calcBmi(input.weightKg, input.heightCm), weightLossPercent: input.weightChangePercent, npoDays: input.npoDays, hasMalnutrition: (input.hasMalnutrition || false) }
      );
      alerts = clinicalAlerts.map(a => a.title);
    } catch {}

    // 11. Build comprehensive report
    const report = {
      patientInfo: {
        name: input.patient.fullName,
        age: input.age,
        gender: input.isMale ? 'ذكر' : 'أنثى',
        weight: input.weightKg,
        height: input.heightCm,
        bmi: this.calcBmi(input.weightKg, input.heightCm),
        department: input.department,
        diagnosis: input.diagnosis,
      },
      patientStory,
      clinicalAssessment: assessment,
      protocol,
      treatmentPlan,
      interventions,
      recommendations,
      monitoringPlan,
      executiveSummary: this.buildExecutiveSummary(input, assessment, treatmentPlan, protocol),
      alerts,
      conclusion: `تم إنشاء خطة تغذية علاجية شاملة للمريض ${input.patient.fullName} حسب بروتوكول ${protocol.nameAr}. الشدة: ${assessment.severity}. المخاطر الرئيسية: ${assessment.risks.refeeding.riskLevel === 'high' ? 'إعادة تغذية - ' : ''}${assessment.risks.hyperglycemia.riskLevel === 'high' ? 'فرط سكر - ' : ''}${assessment.risks.muscleWasting.riskLevel === 'high' ? 'هزال عضلات' : ''}.`,
      generatedAt: new Date().toISOString(),
    };

    return {
      patientStory,
      assessment,
      protocol,
      treatmentPlan,
      interventions,
      recommendations,
      monitoringPlan,
      report,
    };
  }

  private static calcBmi(w: number, h: number): number {
    return h > 0 ? w / Math.pow(h / 100, 2) : 0;
  }

  private static buildExecutiveSummary(input: ClinicalEngineInput, assessment: any, plan: any, protocol: any): string {
    return [
      `ملخص المريض: ${input.patient.fullName}, ${input.age} سنة, ${input.weightKg} كلغ, BMI ${this.calcBmi(input.weightKg, input.heightCm).toFixed(1)}`,
      `المشكلة الرئيسية: ${assessment.nutritionalDiagnosis}`,
      `البروتوكول: ${protocol.nameAr}`,
      `الشدة: ${assessment.severity}`,
      `السعرات: ${plan.nutrition.calories} ك.ك/يوم, بروتين: ${plan.nutrition.protein} غ/يوم`,
      `مراقبة: ${plan.monitoring.frequency}`,
    ].join(' | ');
  }
}
```

---

## 2. بروتوكولات الثماني مراحل (بيانات)

**`src/domain/clinical/protocols/protocolsData.ts`**

```typescript
import { ClinicalProtocol } from '../types';
import { ProtocolRegistry } from './ProtocolRegistry';

const healthyProtocols: ClinicalProtocol[] = [
  {
    id: 'healthy_adult',
    category: 'healthy_adult',
    phase: 'healthy',
    name: 'Healthy Adult Nutrition',
    nameAr: 'تغذية بالغ سليم',
    nutrientTargets: { calories: '25-30 kcal/kg', protein: 0.8, carbsPercent: 55, fatPercent: 30, fluid: '30 ml/kg' },
    guidelines: ['WHO Healthy Diet Guidelines', 'ESPEN General Nutrition'],
    specialConsiderations: ['توازن المغذيات الكبرى', 'تناول ألياف 25-30 غم/يوم', 'تقليل السكريات المضافة والدهون المشبعة'],
    contraindications: [],
    monitoringRequirements: ['الوزن شهرياً', 'مؤشر كتلة الجسم'],
  },
  {
    id: 'healthy_elderly',
    category: 'healthy_elderly',
    phase: 'healthy',
    name: 'Elderly Nutrition',
    nameAr: 'تغذية كبار السن',
    nutrientTargets: { calories: '25-30 kcal/kg', protein: 1.2, carbsPercent: 50, fatPercent: 35, fluid: '30 ml/kg', specialNutrients: ['كالسيوم 1200 ملغ', 'فيتامين د 800 وحدة'] },
    guidelines: ['ESPEN Elderly Guidelines', 'WHO Aging Guidelines'],
    specialConsiderations: ['زيادة البروتين لمنع هزال العضلات', 'فيتامين د والكالسيوم لصحة العظام', 'فيتامين ب12', 'تقسيم الوجبات إلى 5-6 وجبات صغيرة'],
    contraindications: [],
    monitoringRequirements: ['الوزن شهرياً', 'كتلة العضلات', 'كثافة العظام سنوياً'],
  },
];

const pediatricProtocols: ClinicalProtocol[] = [
  {
    id: 'infant',
    category: 'infant',
    phase: 'pediatrics',
    name: 'Infant Nutrition',
    nameAr: 'تغذية رضيع',
    nutrientTargets: { calories: '100-120 kcal/kg', protein: 1.5, carbsPercent: 40, fatPercent: 45, fluid: '100-150 ml/kg', specialNutrients: ['حديد 11 ملغ', 'فيتامين د 400 وحدة'] },
    guidelines: ['AAP Infant Guidelines', 'ESPEN Pediatric'],
    specialConsiderations: ['الرضاعة الطبيعية حصراً لأول 6 أشهر', 'بدء الطعام الصلب من 6 أشهر', 'تجنب العسل في السنة الأولى'],
    contraindications: ['حليب البقر قبل 12 شهر'],
    monitoringRequirements: ['مخطط النمو شهرياً', 'وزن شهرياً', 'طول شهرياً'],
  },
  {
    id: 'toddler',
    category: 'toddler',
    phase: 'pediatrics',
    name: 'Toddler Nutrition',
    nameAr: 'تغذية طفل صغير',
    nutrientTargets: { calories: '1000-1400 kcal/day', protein: 1.0, carbsPercent: 50, fatPercent: 30, fluid: '1000-1500 ml/day' },
    guidelines: ['AAP Toddler Guidelines'],
    specialConsiderations: ['وجبات صغيرة متكررة', 'تقديم أنواع متنوعة من الطعام', 'تجنب السكريات المضافة'],
    contraindications: [],
    monitoringRequirements: ['مخطط النمو شهرياً', 'وزن شهرياً'],
  },
  {
    id: 'child',
    category: 'child',
    phase: 'pediatrics',
    name: 'Child Nutrition',
    nameAr: 'تغذية طفل',
    nutrientTargets: { calories: '1400-2200 kcal/day', protein: 0.9, carbsPercent: 55, fatPercent: 30, fluid: '1500-2000 ml/day' },
    guidelines: ['AAP Child Guidelines', 'ESPEN Pediatric'],
    specialConsiderations: ['تشجيع النشاط البدني', 'الحد من وقت الشاشات', 'وجبة إفطار متوازنة'],
    contraindications: [],
    monitoringRequirements: ['وزن شهرياً', 'طول شهرياً'],
  },
  {
    id: 'adolescent',
    category: 'adolescent',
    phase: 'pediatrics',
    name: 'Adolescent Nutrition',
    nameAr: 'تغذية مراهق',
    nutrientTargets: { calories: '2000-3200 kcal/day', protein: 0.85, carbsPercent: 55, fatPercent: 30, fluid: '2000-3000 ml/day', specialNutrients: ['كالسيوم 1300 ملغ', 'حديد 11 ملغ'] },
    guidelines: ['AAP Adolescent Guidelines'],
    specialConsiderations: ['زيادة احتياجات الحديد للإناث', ['دعم صحة العظام بالكالسيوم'], ['تجنب المشروبات الغازية']],
    contraindications: [],
    monitoringRequirements: ['وزن شهرياً', 'فحص الهيموغلوبين سنوياً'],
  },
];

const pregnancyProtocols: ClinicalProtocol[] = [
  {
    id: 'pregnancy_normal',
    category: 'pregnancy_normal',
    phase: 'pregnancy',
    name: 'Normal Pregnancy',
    nameAr: 'حمل طبيعي',
    nutrientTargets: { calories: '+300 kcal/day', protein: 1.1, carbsPercent: 50, fatPercent: 30, fluid: '3000 ml/day', specialNutrients: ['حديد 27 ملغ', 'حمض فوليك 600 ميكروغرام', 'كالسيوم 1000 ملغ'] },
    guidelines: ['ACOG Pregnancy Guidelines', 'WHO Antenatal Care'],
    specialConsiderations: ['مكمل حمض الفوليك قبل الحمل وأول 12 أسبوع', 'تجنب الكحول والتدخين', 'الحد من الكافيين (<200 ملغ/يوم)', 'تجنب الأجبان غير المبسترة'],
    contraindications: ['الكحول', 'التدخين', 'الكافيين الزائد'],
    monitoringRequirements: ['وزن شهرياً', 'فحص سكر الحمل (24-28 أسبوع)', 'ضغط الدم كل زيارة'],
  },
  {
    id: 'pregnancy_high_risk',
    category: 'pregnancy_high_risk',
    phase: 'pregnancy',
    name: 'High-Risk Pregnancy',
    nameAr: 'حمل عالي الخطورة',
    nutrientTargets: { calories: '+350 kcal/day', protein: 1.3, carbsPercent: 40, fatPercent: 35, fluid: '2500 ml/day', glucoseTarget: '<140 mg/dL', specialNutrients: ['حديد 27 ملغ', 'حمض فوليك 1000 ميكروغرام'] },
    guidelines: ['ACOG High-Risk Guidelines'],
    specialConsiderations: ['مراقبة سكر الدم 4 مرات/يوم', 'تقليل الصوديوم <2000 ملغ', 'مكملات إضافية حسب الحالة'],
    contraindications: ['الكحول', 'التدخين', 'الأدوية الممنوعة في الحمل'],
    monitoringRequirements: ['وزن كل أسبوعين', 'سكر الدم 4 مرات/يوم', 'ضغط الدم يومياً', 'فحص البول للبروتين'],
  },
  {
    id: 'lactation',
    category: 'lactation',
    phase: 'pregnancy',
    name: 'Lactation Nutrition',
    nameAr: 'تغذية رضاعة',
    nutrientTargets: { calories: '+500 kcal/day', protein: 1.3, carbsPercent: 50, fatPercent: 30, fluid: '3500 ml/day', specialNutrients: ['حديد 9 ملغ', 'كالسيوم 1000 ملغ'] },
    guidelines: ['ACOG Lactation Guidelines', 'WHO Breastfeeding'],
    specialConsiderations: ['زيادة السوائل لإدرار الحليب', ['تجنب الأدوية الممنوعة في الرضاعة'], ['تقليل الكافيين']],
    contraindications: ['الكحول', 'التدخين'],
    monitoringRequirements: ['وزن الأم شهرياً', 'مخطط نمو الرضيع', 'تقييم إدرار الحليب'],
  },
];

const sportsProtocols: ClinicalProtocol[] = [
  {
    id: 'endurance_athlete',
    category: 'endurance_athlete',
    phase: 'sports',
    name: 'Endurance Athlete Nutrition',
    nameAr: 'تغذية رياضي تحمل',
    nutrientTargets: { calories: '35-40 kcal/kg', protein: 1.2, carbsPercent: 70, fatPercent: 20, fluid: '500-1000 ml/hour', specialNutrients: ['صوديوم 500-700 ملغ/لتر ماء'] },
    guidelines: ['ISSN Endurance Guidelines', 'ACSM Sports Nutrition'],
    specialConsiderations: ['تحميل الكربوهيدرات قبل المنافسة', ['تعويض السوائل والكهارل أثناء التمرين'], ['تناول 20-30 غم بروتين بعد التمرين']],
    contraindications: [],
    monitoringRequirements: ['الوزن قبل وبعد التمرين', 'فحص الجفاف', 'تقييم الأداء الرياضي'],
  },
  {
    id: 'strength_athlete',
    category: 'strength_athlete',
    phase: 'sports',
    name: 'Strength Athlete Nutrition',
    nameAr: 'تغذية رياضي قوة',
    nutrientTargets: { calories: '35-40 kcal/kg', protein: 1.8, carbsPercent: 50, fatPercent: 25, fluid: '500-1000 ml/hour', specialNutrients: ['كرياتين 3-5 غم'] },
    guidelines: ['ISSN Strength Guidelines', 'ACSM Sports Nutrition'],
    specialConsiderations: ['توزيع البروتين على 4-6 وجبات', ['تناول بروتين بعد التمرين (<30 دقيقة)'], ['الكرياتين كمكمل فعال']],
    contraindications: ['مكملات غير مدروسة'],
    monitoringRequirements: ['كتلة العضلات شهرياً', 'نسبة الدهون شهرياً', 'تقييم القوة'],
  },
  {
    id: 'recreational_athlete',
    category: 'recreational_athlete',
    phase: 'sports',
    name: 'Recreational Athlete Nutrition',
    nameAr: 'تغذية رياضي هواة',
    nutrientTargets: { calories: '30-35 kcal/kg', protein: 1.0, carbsPercent: 55, fatPercent: 30, fluid: '30 ml/kg' },
    guidelines: ['ISSN Recreational Guidelines'],
    specialConsiderations: ['تغذية متوازنة', ['ترطيب كافٍ قبل وأثناء وبعد التمرين'], ['وجبة خفيفة بعد التمرين']],
    contraindications: [],
    monitoringRequirements: ['الوزن', 'تقييم الأداء'],
  },
];

const weightProtocols: ClinicalProtocol[] = [
  {
    id: 'obesity_loss',
    category: 'obesity_loss',
    phase: 'weight_management',
    name: 'Obesity Weight Loss',
    nameAr: 'فقدان الوزن للسمنة',
    nutrientTargets: { calories: 'TEE - 500 kcal/day', protein: 1.3, carbsPercent: 40, fatPercent: 35, fluid: '30 ml/kg', specialNutrients: ['ألياف 30-40 غم'] },
    guidelines: ['AMA Obesity Guidelines', 'AHA/ACC/TOS Guidelines'],
    specialConsiderations: ['عجز سعري 500-750 ك.ك/يوم', ['بروتين مرتفع للحفاظ على العضلات'], ['ألياف عالية للشعور بالشبع'], ['نشاط بدني 150-300 دقيقة/أسبوع']],
    contraindications: ['الحميات القاسية (<800 ك.ك/يوم)'],
    monitoringRequirements: ['وزن أسبوعي', 'محيط الخصر شهرياً', 'دهون الدم كل 3 أشهر', 'ضغط الدم شهرياً'],
  },
  {
    id: 'underweight_gain',
    category: 'underweight_gain',
    phase: 'weight_management',
    name: 'Underweight Weight Gain',
    nameAr: 'زيادة الوزن للنحافة',
    nutrientTargets: { calories: 'TEE + 500 kcal/day', protein: 1.5, carbsPercent: 55, fatPercent: 30, fluid: '30 ml/kg' },
    guidelines: ['ASPEN Weight Gain Guidelines'],
    specialConsiderations: ['وجبات صغيرة متكررة 5-6/يوم', ['مكملات غذائية عالية السعرات'], ['تمارين مقاومة لبناء العضلات']],
    contraindications: [],
    monitoringRequirements: ['وزن أسبوعي', 'كتلة العضلات شهرياً'],
  },
];

const chronicProtocols: ClinicalProtocol[] = [
  {
    id: 'diabetes_t1',
    category: 'diabetes_t1',
    phase: 'chronic_disease',
    name: 'Type 1 Diabetes Nutrition',
    nameAr: 'تغذية سكري نوع 1',
    nutrientTargets: { calories: 'TEE', protein: 1.0, carbsPercent: 45, fatPercent: 35, fluid: '30 ml/kg', glucoseTarget: '80-140 mg/dL' },
    guidelines: ['ADA Diabetes Guidelines', 'ISPAD Guidelines'],
    specialConsiderations: ['حساب الكربوهيدرات', ['جرعات الأنسولين حسب الكربوهيدرات'], ['توزيع الوجبات 3 رئيسية + 2-3 خفيفة'], ['مراقبة سكر الدم 4-6 مرات/يوم']],
    contraindications: ['السكريات السائلة المركزة'],
    monitoringRequirements: ['سكر الدم 4-6 مرات/يوم', 'HbA1c كل 3 أشهر', 'وظائف الكلى سنوياً'],
  },
  {
    id: 'diabetes_t2',
    category: 'diabetes_t2',
    phase: 'chronic_disease',
    name: 'Type 2 Diabetes Nutrition',
    nameAr: 'تغذية سكري نوع 2',
    nutrientTargets: { calories: 'TEE', protein: 1.2, carbsPercent: 35, fatPercent: 45, fluid: '30 ml/kg', glucoseTarget: '80-140 mg/dL', specialNutrients: ['ألياف 25-30 غم'] },
    guidelines: ['ADA Diabetes Guidelines', 'EASD Guidelines'],
    specialConsiderations: ['خفض الكربوهيدرات إلى 35%', ['دهون صحية غير مشبعة 45%'], ['فقدان الوزن 5-10%'], ['النشاط البدني 150 دقيقة/أسبوع']],
    contraindications: ['الدهون المتحولة', 'السكريات المضافة'],
    monitoringRequirements: ['سكر الدم 2-4 مرات/يوم', 'HbA1c كل 3 أشهر', 'دهون الدم سنوياً'],
  },
  {
    id: 'ckd_nondialysis',
    category: 'ckd_nondialysis',
    phase: 'chronic_disease',
    name: 'CKD Non-Dialysis Nutrition',
    nameAr: 'تغذية كلى غير دياليزا',
    nutrientTargets: { calories: '30-35 kcal/kg', protein: 0.7, carbsPercent: 55, fatPercent: 30, fluid: '30 ml/kg', specialNutrients: ['بوتاسيوم <2000 ملغ', 'فوسفور <800 ملغ', 'صوديوم <2000 ملغ'] },
    guidelines: ['KDIGO CKD Guidelines', 'NKF KDOQI Guidelines'],
    specialConsiderations: ['تقييد البروتين 0.6-0.8 غ/كلغ لإبطاء تقدم المرض', ['تقييد البوتاسيوم حسب المستوى'], ['تقييد الفوسفور'], ['تجنب الأغذية عالية الصوديوم']],
    contraindications: ['الأغذية عالية البوتاسيوم (موز، طماطم، برتقال)', 'الأغذية عالية الفوسفور (أجبان، مكسرات)'],
    monitoringRequirements: ['وظائف الكلى شهرياً', 'بوتاسيوم أسبوعي', 'فوسفور شهرياً', 'ألبومين شهرياً'],
  },
  {
    id: 'ckd_dialysis',
    category: 'ckd_dialysis',
    phase: 'chronic_disease',
    name: 'CKD Dialysis Nutrition',
    nameAr: 'تغذية كلى دياليزا',
    nutrientTargets: { calories: '35 kcal/kg', protein: 1.2, carbsPercent: 55, fatPercent: 30, fluid: '2000-2500 ml/day', specialNutrients: ['بروتين مرتفع', 'بوتاسيوم <3000 ملغ'] },
    guidelines: ['KDIGO Dialysis Guidelines', 'NKF KDOQI Dialysis'],
    specialConsiderations: ['بروتين 1.2 غ/كلغ لتعويض الفقد', ['تقييد السوائل حسب إخراج البول'], ['تقييد الفوسفور'], ['تناول مكملات الفيتامينات المائية']],
    contraindications: ['الأغذية عالية الفوسفور', 'السوائل الزائدة'],
    monitoringRequirements: ['وزن يومي', 'وظائف الكلى أسبوعياً', 'بوتاسيوم أسبوعياً', 'فوسفور شهرياً', 'ألبومين شهرياً'],
  },
  {
    id: 'cardiovascular',
    category: 'cardiovascular',
    phase: 'chronic_disease',
    name: 'Cardiovascular Nutrition',
    nameAr: 'تغذية قلب',
    nutrientTargets: { calories: 'TEE or TEE-500', protein: 1.0, carbsPercent: 50, fatPercent: 30, fluid: '30 ml/kg', specialNutrients: ['أوميغا-3 1-2 غم', 'ألياف 25-30 غم'] },
    guidelines: ['AHA Cardiovascular Guidelines', 'ACC/AHA Guidelines'],
    specialConsiderations: ['حمية البحر المتوسط', ['تقليل الدهون المشبعة <7%'], ['تقليل الصوديوم <2000 ملغ'], ['أوميغا-3 من الأسماك مرتين/أسبوع']],
    contraindications: ['الدهون المتحولة', 'الدهون المشبعة', 'الصوديوم المرتفع'],
    monitoringRequirements: ['دهون الدم كل 3-6 أشهر', 'ضغط الدم شهرياً', 'الوزن شهرياً'],
  },
  {
    id: 'hypertension',
    category: 'hypertension',
    phase: 'chronic_disease',
    name: 'Hypertension Nutrition (DASH)',
    nameAr: 'تغذية ضغط DASH',
    nutrientTargets: { calories: 'TEE or TEE-500', protein: 1.0, carbsPercent: 55, fatPercent: 30, fluid: '30 ml/kg', specialNutrients: ['صوديوم <1500 ملغ', 'بوتاسيوم 4700 ملغ'] },
    guidelines: ['AHA Hypertension Guidelines', 'DASH Diet Guidelines'],
    specialConsiderations: ['حمية DASH (خضار، فواكه، حبوب كاملة، ألبان قليلة الدسم)', ['صوديوم <1500 ملغ/يوم'], ['زيادة البوتاسيوم من المصادر الطبيعية']],
    contraindications: ['الأغذية المصنعة', 'الملح المضاف'],
    monitoringRequirements: ['ضغط الدم أسبوعياً', 'وظائف الكلى سنوياً'],
  },
];

const criticalCareProtocols: ClinicalProtocol[] = [
  {
    id: 'icu_ventilated',
    category: 'icu_ventilated',
    phase: 'critical_care',
    name: 'ICU Ventilated Nutrition',
    nameAr: 'تغذية عناية مركزة - متصل',
    nutrientTargets: { calories: '25-30 kcal/kg', protein: 1.8, carbsPercent: 40, fatPercent: 45, fluid: '30 ml/kg', glucoseTarget: '80-150 mg/dL' },
    guidelines: ['ESPEN ICU Guidelines', 'ASPEN Critical Care', 'SSC Guidelines'],
    specialConsiderations: ['تغذية معوية مبكرة خلال 24-48 ساعة', ['بروتين عالي (1.5-2.0 غ/كلغ) لمنع هزال العضلات'], ['كربوهيدرات منخفضة (40%) لتقليل CO2'], ['دهون مرتفعة (45%) لتقليل الحمل الأيضي']],
    contraindications: ['فرط التغذية (>TEE)', 'إعطاء تغذية وريدية إذا كانت المعوية ممكنة'],
    monitoringRequirements: ['سكر الدم كل 6 ساعات', 'إلكتروليتات يومياً', 'توازن السوائل يومياً', 'فحص وظائف الكبد أسبوعياً'],
  },
  {
    id: 'icu_non_ventilated',
    category: 'icu_non_ventilated',
    phase: 'critical_care',
    name: 'ICU Non-Ventilated Nutrition',
    nameAr: 'تغذية عناية مركزة - غير متصل',
    nutrientTargets: { calories: '25-30 kcal/kg', protein: 1.5, carbsPercent: 45, fatPercent: 40, fluid: '30 ml/kg' },
    guidelines: ['ESPEN ICU Guidelines', 'ASPEN Critical Care'],
    specialConsiderations: ['تغذية معوية مبكرة', ['بروتين معتدل-مرتفع'], ['مراقبة علامات سوء التغذية']],
    contraindications: [],
    monitoringRequirements: ['سكر الدم يومياً', 'إلكتروليتات يومياً', 'توازن السوائل'],
  },
  {
    id: 'sepsis',
    category: 'sepsis',
    phase: 'critical_care',
    name: 'Sepsis Nutrition',
    nameAr: 'تغذية تسمم دم',
    nutrientTargets: { calories: '25-30 kcal/kg', protein: 1.8, carbsPercent: 40, fatPercent: 45, fluid: '30 ml/kg', glucoseTarget: '80-150 mg/dL' },
    guidelines: ['SSC Sepsis Guidelines', 'ESPEN ICU Guidelines'],
    specialConsiderations: ['البدء المبكر بالتغذية المعوية (<24 ساعة)', ['بروتين عالي (1.5-2.0 غ/كلغ)'], ['سيطرة صارمة على سكر الدم'], ['مراقبة علامات الالتهاب']],
    contraindications: ['فرط التغذية'],
    monitoringRequirements: ['سكر الدم كل 4-6 ساعات', ['إلكتروليتات يومياً'], ['علامات الالتهاب (CRP, PCT)'], ['توازن السوائل كل 8 ساعات']],
  },
  {
    id: 'trauma',
    category: 'trauma',
    phase: 'critical_care',
    name: 'Trauma Nutrition',
    nameAr: 'تغذية صدمة',
    nutrientTargets: { calories: '30-35 kcal/kg', protein: 2.0, carbsPercent: 50, fatPercent: 35, fluid: '30 ml/kg' },
    guidelines: ['ASPEN Trauma Guidelines', 'EAST Guidelines'],
    specialConsiderations: ['احتياجات طاقية مرتفعة (30-35 ك.ك/كلغ) بسبب فرط الأيض', ['بروتين عالي جداً (2.0 غ/كلغ) لتعويض الهدم'], ['تغذية معوية فورية إن أمكن'], ['مراقبة الحالة التغذوية عن كثب']],
    contraindications: [],
    monitoringRequirements: ['توازن نيتروجين أسبوعياً', 'إلكتروليتات يومياً', 'علامات الالتهاب', 'وظائف الأعضاء'],
  },
];

const specialProtocols: ClinicalProtocol[] = [
  {
    id: 'gastrointestinal',
    category: 'gastrointestinal',
    phase: 'special_conditions',
    name: 'GI Disease Nutrition',
    nameAr: 'تغذية أمراض هضمية',
    nutrientTargets: { calories: '30-35 kcal/kg', protein: 1.3, carbsPercent: 50, fatPercent: 30, fluid: '30 ml/kg', specialNutrients: ['ألياف قليلة في النوبة', 'ألياف عالية في الهدوء'] },
    guidelines: ['ASPEN GI Guidelines', 'ECCO Guidelines'],
    specialConsiderations: ['خلال النوبات: ألياف منخفضة، وجبات صغيرة', ['خلال الهدوء: ألياف عالية، بروبيوتيك'], ['تجنب الأغذية المهيجة'], ['مكملات فيتامين د والحديد حسب النوع']],
    contraindications: ['الأغذية الحارة', 'الكافيين في النوبات', 'اللاكتوز في حالات عدم التحمل'],
    monitoringRequirements: ['الوزن أسبوعياً', 'فيتامين د شهرياً', 'حديد شهرياً', 'كرياتينين شهرياً'],
  },
  {
    id: 'liver_disease',
    category: 'liver_disease',
    phase: 'special_conditions',
    name: 'Liver Disease Nutrition',
    nameAr: 'تغذية أمراض كبد',
    nutrientTargets: { calories: '35 kcal/kg', protein: 1.3, carbsPercent: 50, fatPercent: 30, fluid: '30 ml/kg', specialNutrients: ['صوديوم <2000 ملغ', 'فيتامين ك'] },
    guidelines: ['AASLD Liver Guidelines', 'EASL Guidelines'],
    specialConsiderations: ['تجنب الكحول تماماً', ['بروتين كافٍ (إلا في حالة الاعتلال الدماغي)'], ['صوديوم منخفض للوذمة/الاستسقاء'], ['مكمل فيتامين ك وفيتامين د']],
    contraindications: ['الكحول', 'الحديد الزائد في داء ترسب الأصبغة الدموية'],
    monitoringRequirements: ['وظائف الكبد شهرياً', 'ألبومين شهرياً', 'INR شهرياً', 'صوديوم أسبوعياً'],
  },
  {
    id: 'respiratory_disease',
    category: 'respiratory_disease',
    phase: 'special_conditions',
    name: 'Respiratory Disease Nutrition',
    nameAr: 'تغذية أمراض رئة',
    nutrientTargets: { calories: '30-35 kcal/kg', protein: 1.3, carbsPercent: 40, fatPercent: 45, fluid: '30 ml/kg' },
    guidelines: ['ASPEN Respiratory Guidelines', 'ERS Guidelines'],
    specialConsiderations: ['كربوهيدرات منخفضة لتقليل إنتاج CO2', ['دهون مرتفعة كمصدر طاقة بديل'], ['وجبات صغيرة متكررة لتجنب عسر التنفس بعد الأكل'], ['فيتامين د والمغنيسيوم']],
    contraindications: ['الكربوهيدرات العالية في مرضى التنفس'],
    monitoringRequirements: ['غازات الدم الشرياني', 'الوزن أسبوعياً', 'فيتامين د شهرياً'],
  },
  {
    id: 'oncology',
    category: 'oncology',
    phase: 'special_conditions',
    name: 'Oncology Nutrition',
    nameAr: 'تغذية أورام',
    nutrientTargets: { calories: '35-40 kcal/kg', protein: 1.5, carbsPercent: 50, fatPercent: 30, fluid: '30 ml/kg', specialNutrients: ['أوميغا-3 2-3 غم'] },
    guidelines: ['ASPEN Oncology Guidelines', 'ESPEN Cancer Guidelines'],
    specialConsiderations: ['بروتين عالي لمنع الدنف', ['أوميغا-3 لدعم المناعة وتقليل الالتهاب'], ['تقسيم الوجبات لتحمل أفضل للعلاج'], ['معالجة الغثيان وفقدان الشهية']],
    contraindications: [],
    monitoringRequirements: ['الوزن أسبوعياً', 'ألبومين شهرياً', 'كتلة العضلات', 'جودة الحياة'],
  },
  {
    id: 'autoimmune',
    category: 'autoimmune',
    phase: 'special_conditions',
    name: 'Autoimmune Disease Nutrition',
    nameAr: 'تغذية أمراض مناعية',
    nutrientTargets: { calories: '25-30 kcal/kg', protein: 1.2, carbsPercent: 50, fatPercent: 30, fluid: '30 ml/kg', specialNutrients: ['أوميغا-3 2-3 غم', 'فيتامين د 2000 وحدة'] },
    guidelines: ['AAO Autoimmune Guidelines'],
    specialConsiderations: ['نظام غذائي مضاد للالتهاب', ['أوميغا-3 لتقليل الالتهاب'], ['فيتامين د لتنظيم المناعة'], ['تجنب الأغذية المثبتة كمحفزات']],
    contraindications: ['الأغذية المثيرة للحساسية حسب كل حالة'],
    monitoringRequirements: ['علامات الالتهاب شهرياً', 'فيتامين د شهرياً', 'الوزن شهرياً'],
  },
  {
    id: 'transplant',
    category: 'transplant',
    phase: 'special_conditions',
    name: 'Organ Transplant Nutrition',
    nameAr: 'تغذية زرع أعضاء',
    nutrientTargets: { calories: '30-35 kcal/kg', protein: 1.5, carbsPercent: 50, fatPercent: 30, fluid: '30 ml/kg', specialNutrients: ['بروتين عالي', 'فيتامين د'] },
    guidelines: ['AST Transplant Guidelines', 'ESPEN Transplant'],
    specialConsiderations: ['بروتين عالي للتعافي الجراحي', ['تجنب العدوى الغذائية (غسل الخضار جيداً، طهي اللحوم جيداً)'], ['مراقبة تفاعل الأدوية المثبطة للمناعة مع الغذاء (جريب فروت)'], ['تجنب المكملات العشبية غير المعروفة']],
    contraindications: ['الجريب فروت والجريب فروت - تفاعل مع مثبطات الكالسينيورين'],
    monitoringRequirements: ['وظائف العضو المزروع', 'مستوى الأدوية المثبطة للمناعة', 'الوزن أسبوعياً', 'ألبومين شهرياً'],
  },
];

export function registerAllProtocols(): void {
  const all = [
    ...healthyProtocols,
    ...pediatricProtocols,
    ...pregnancyProtocols,
    ...sportsProtocols,
    ...weightProtocols,
    ...chronicProtocols,
    ...criticalCareProtocols,
    ...specialProtocols,
  ];
  ProtocolRegistry.registerAll(all);
}
```

---

## 3. التكامل مع الوحدات الموجودة

### 3.1 ربط ClinicalDecisionEngine مع DepartmentPlannerRegistry

الـ `ClinicalDecisionEngine` سيستخدم `DepartmentPlannerRegistry` للحصول على الحسابات (السعرات، البروتين، الكربوهيدرات، الدهون) لكل حالة.

### 3.2 ربط مع clinicalAlertsEngine

`ClinicalDecisionEngine` سيستخدم `validateLabMetrics` من `clinicalAlertsEngine` لإضافة التنبيهات السريرية إلى التقرير.

### 3.3 ربط مع kauRequirementsEngine

`ClinicalDecisionEngine` سيستخدم `calculateNutritionalRequirementsWithHiddenCalories` للحصول على السعرات المخفية وحسابات متقدمة.

---

## 4. خطوات التنفيذ (بعد الخروج من Plan Mode)

1. إنشاء `src/domain/clinical/types/index.ts`
2. إنشاء `src/domain/clinical/protocols/ProtocolRegistry.ts`
3. إنشاء `src/domain/clinical/protocols/protocolsData.ts`
4. إنشاء `src/domain/clinical/engine/ProtocolSelector.ts`
5. إنشاء `src/domain/clinical/engine/PatientStoryBuilder.ts`
6. إنشاء `src/domain/clinical/engine/ClinicalAssessmentEngine.ts`
7. إنشاء `src/domain/clinical/engine/ClinicalDecisionEngine.ts`
8. إنشاء `src/domain/clinical/report/ComprehensiveReportBuilder.ts` (P1)
9. إنشاء `src/domain/clinical/report/HtmlReportTemplate.ts` (P1)
10. كتابة اختبارات التكامل
11. ربط مع Patient Screen (استبدال الكود المباشر في `[id].tsx`)
