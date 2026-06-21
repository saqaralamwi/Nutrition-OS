import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../../../data/database';
import Food from '../../../data/models/Food';
import Patient from '../../../data/models/Patient';
import type { IClinicalNotes } from '../../../data/models/Food';
import { ClinicalGuidelineRepository } from '../../../data/repositories/ClinicalGuidelineRepository';
import type { IGuidelineThresholds, IContraindicationFilter } from '../../../data/repositories/ClinicalGuidelineRepository';

export type SuitabilityScore = 'green' | 'orange' | 'red';

export interface ISuitabilityExplanation {
  type: 'benefit' | 'caution' | 'contraindication' | 'guideline_match';
  message: string;
  source: 'clinical_notes' | 'guideline' | 'contraindication_filter' | 'macro_analysis';
}

export interface IFoodAdvisorResult {
  foodId: string;
  foodNameAr: string;
  patientId: string;
  patientName: string;
  diagnosis: string;
  conditionKey: string;
  conditionAr: string;
  suitabilityScore: SuitabilityScore;
  isContraindicated: boolean;
  explanations: ISuitabilityExplanation[];
  macroConflicts: string[];
  matchedGuidelines: string[];
  servingRecommendation: string | null;
}

const CONDITION_TO_KEY: Record<string, string> = {
  'السكري': 'diabetes_mellitus',
  'سكر': 'diabetes_mellitus',
  'ضغط': 'hypertension',
  'قلب': 'heart_failure',
  'كلوي': 'chronic_kidney_disease',
  'كلى': 'chronic_kidney_disease',
  'سمنة': 'obesity',
  'وزن': 'obesity',
  'سرطان': 'cancer',
  'كبد': 'liver_cirrhosis',
  'فقر دم': 'iron_deficiency',
  'أنيميا': 'iron_deficiency',
  'نقرس': 'gout',
  'غسيل كلوي': 'haemodialysis',
  'حساسية قمح': 'gluten_allergy',
  'قولون': 'irritable_bowel_syndrome',
  'بنكرياس': 'pancreatic_insufficiency',
  'مرارة': 'gallbladder_disease',
  'غدة درقية': 'thyroid_disorders',
  'حمل': 'pregnancy',
  'رضاعة': 'lactation',
  'مسن': 'geriatric_malnutrition',
  'شيخوخة': 'geriatric_malnutrition',
  'عناية مركزة': 'critical_illness',
  'icu': 'critical_illness',
  'حروق': 'burn_injury',
  'سوء تغذية': 'paediatric_malnutrition',
  'نحافة': 'paediatric_malnutrition',
  'سكري حمل': 'gestational_diabetes',
  'دهون': 'hyperlipidaemia',
  'كولسترول': 'hyperlipidaemia',
};

function detectConditionKey(diagnosis: string): { key: string; ar: string } {
  const d = diagnosis.toLowerCase();
  for (const [keyword, key] of Object.entries(CONDITION_TO_KEY)) {
    if (d.includes(keyword)) return { key, ar: keyword };
  }
  return { key: 'general', ar: diagnosis };
}

function computeSuitability(
  macroConflicts: string[],
  isContraindicated: boolean,
  filters: IContraindicationFilter[],
): SuitabilityScore {
  if (isContraindicated) return 'red';
  if (macroConflicts.length > 0) return 'orange';

  const hasHighSeverity = filters.some(
    (f) => (f.severity === 'high' || f.severity === 'critical') && f.blockedFoodNamesAr,
  );
  if (hasHighSeverity) return 'orange';

  return 'green';
}

export class FoodAdvisorEngine {
  static async analyze(foodId: string, patientId: string): Promise<IFoodAdvisorResult> {
    const db = await getDatabase();

    const [patient, food] = await Promise.all([
      db.get<Patient>('patients').find(patientId).catch(() => null),
      db.get<Food>('foods').find(foodId).catch(() => null),
    ]);

    if (!patient) throw new Error('لم يتم العثور على بيانات المريض');
    if (!food) throw new Error('لم يتم العثور على بيانات الطعام');

    const diagnosis = patient.primaryDiagnosis || 'عام';
    const { key: conditionKey, ar: conditionAr } = detectConditionKey(diagnosis);

    const [guidelines, filters] = await Promise.all([
      ClinicalGuidelineRepository.getGuidelinesByCondition(conditionKey),
      ClinicalGuidelineRepository.getContraindicationFilters(conditionKey),
    ]);

    const thresholds: IGuidelineThresholds = ClinicalGuidelineRepository.extractThresholds(guidelines);
    const clinicalNotes: IClinicalNotes | null = food.parsedClinicalNotes;

    const macroConflicts: string[] = [];
    const explanations: ISuitabilityExplanation[] = [];

    if (thresholds.sodiumMg != null && food.sodiumMg != null && food.sodiumMg > thresholds.sodiumMg) {
      macroConflicts.push(
        `صوديوم مرتفع (${Math.round(food.sodiumMg)} ملجم) — يتجاوز الحد الموصى به (${thresholds.sodiumMg} ملجم) لـ ${conditionAr}`,
      );
    }

    if (thresholds.potassiumMg != null && food.potassiumMg != null && food.potassiumMg > thresholds.potassiumMg) {
      macroConflicts.push(
        `بوتاسيوم مرتفع (${Math.round(food.potassiumMg)} ملجم) — يتجاوز الحد الموصى به (${thresholds.potassiumMg} ملجم) لـ ${conditionAr}`,
      );
    }

    if (thresholds.phosphorusMg != null && food.phosphorusMg != null && food.phosphorusMg > thresholds.phosphorusMg) {
      macroConflicts.push(
        `فوسفور مرتفع (${Math.round(food.phosphorusMg)} ملجم) — يتجاوز الحد الموصى به (${thresholds.phosphorusMg} ملجم) لـ ${conditionAr}`,
      );
    }

    if (thresholds.proteinGPerKg != null && food.proteinG > thresholds.proteinGPerKg * 70) {
      macroConflicts.push(
        `بروتين مرتفع (${food.proteinG.toFixed(1)} جم) — قد يتجاوز احتياج المريض اليومي (${(thresholds.proteinGPerKg * 70).toFixed(1)} جم)`,
      );
    }

    let isContraindicated = false;

    for (const f of filters) {
      if (f.blockedFoodNamesAr) {
        const blockedNames = f.blockedFoodNamesAr.split(',').map((s) => s.trim());
        const match = blockedNames.some(
          (name) => food.nameAr.includes(name) || name.includes(food.nameAr),
        );
        if (match) {
          isContraindicated = true;
          explanations.push({
            type: 'contraindication',
            message: f.warningMessageAr || `ممنوع: ${food.nameAr} غير مناسب لـ ${f.conditionAr}`,
            source: 'contraindication_filter',
          });
        }
      }
      if (f.reason && !isContraindicated) {
        explanations.push({
          type: 'caution',
          message: f.reason,
          source: 'contraindication_filter',
        });
      }
    }

    for (const macro of macroConflicts) {
      explanations.push({
        type: 'caution',
        message: macro,
        source: 'macro_analysis',
      });
    }

    if (clinicalNotes?.contraindications) {
      const matchedContra = clinicalNotes.contraindications.filter((c) =>
        conditionAr.includes(c) || c.includes(conditionAr),
      );
      if (matchedContra.length > 0) {
        isContraindicated = true;
        explanations.push({
          type: 'contraindication',
          message: matchedContra.join('؛ ') + ` — غير مناسب لـ ${conditionAr}`,
          source: 'clinical_notes',
        });
      }
    }

    if (clinicalNotes?.benefits && clinicalNotes.benefits.length > 0) {
      explanations.push({
        type: 'benefit',
        message: clinicalNotes.benefits.slice(0, 3).join('؛ '),
        source: 'clinical_notes',
      });
    }

    const matchedGuidelines: string[] = guidelines.map((g) =>
      g.recommendationsAr || g.recommendationAr || g.summaryAr || g.titleAr || '',
    ).filter(Boolean);

    for (const g of matchedGuidelines) {
      explanations.push({
        type: 'guideline_match',
        message: g,
        source: 'guideline',
      });
    }

    if (!isContraindicated && explanations.length === 0) {
      explanations.push({
        type: 'benefit',
        message: `لا توجد موانع معروفة لـ ${food.nameAr} مع حالة ${conditionAr}`,
        source: 'macro_analysis',
      });
    }

    let servingRecommendation: string | null = null;
    if (clinicalNotes?.servingRecommendation) {
      const match = clinicalNotes.servingRecommendation.find(
        (s) => conditionAr.includes(s.condition) || s.condition.includes(conditionAr),
      );
      if (match) servingRecommendation = match.amount;
    }

    if (!servingRecommendation && isContraindicated) {
      servingRecommendation = 'غير مناسب — يمنع استخدام هذا الطعام';
    } else if (!servingRecommendation && macroConflicts.length > 0) {
      servingRecommendation = 'كمية محدودة مع مراقبة المؤشرات الحيوية';
    } else if (!servingRecommendation) {
      servingRecommendation = 'كمية معتدلة حسب احتياج المريض اليومي';
    }

    const suitabilityScore = computeSuitability(macroConflicts, isContraindicated, filters);

    return {
      foodId,
      foodNameAr: food.nameAr,
      patientId,
      patientName: patient.fullName,
      diagnosis,
      conditionKey,
      conditionAr,
      suitabilityScore,
      isContraindicated,
      explanations: explanations.slice(0, 12),
      macroConflicts,
      matchedGuidelines,
      servingRecommendation,
    };
  }
}
