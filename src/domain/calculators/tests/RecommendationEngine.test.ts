import { describe, it, expect } from 'vitest';
import { RecommendationEngine } from '../RecommendationEngine';
import { DynamicAssessmentEngine } from '../DynamicAssessmentEngine';
import { DNIEngine } from '../DNIEngine';
import { MealPlannerEngine } from '../MealPlannerEngine';
import type { PatientProfile } from '../../../data/types/meal_planner';
import type { DrugNutrientInteraction } from '../../../data/types/dni';
import type { FoodItem } from '../../../data/types/meal_planner';

function profile(overrides?: Partial<PatientProfile>): PatientProfile {
  return {
    id: 'test-patient',
    dryWeight: 70,
    targetCalories: 2100,
    targetProtein: 84,
    targetCarbs: 250,
    targetFats: 60,
    isStrictProteinRestriction: false,
    activeContraindicatedNutrients: [],
    ...overrides,
  };
}

describe('RecommendationEngine', () => {
  describe('generateSummary – protein restriction', () => {
    it('generates critical alert when protein restriction is active', () => {
      const p = profile({ isStrictProteinRestriction: true, targetProtein: 56 });
      const result = RecommendationEngine.generateSummary(p, [], 10);

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].level).toBe('critical');
      expect(result.alerts[0].titleAr).toContain('قيد بروتيني صارم');
      expect(result.alerts[0].messageAr).toContain('56');
      expect(result.educationalNotesAr.length).toBeGreaterThan(0);
    });

    it('does NOT generate protein alert when not restricted', () => {
      const result = RecommendationEngine.generateSummary(profile(), [], 15);
      const protAlerts = result.alerts.filter((a) => a.titleAr.includes('بروتيني'));
      expect(protAlerts).toHaveLength(0);
    });
  });

  describe('generateSummary – drug interactions', () => {
    it('generates critical alert for CRITICAL severity DNI', () => {
      const interactions: DrugNutrientInteraction[] = [{
        id: 'spiro',
        drugNameEn: 'Spironolactone',
        drugNameAr: 'سبيرونولاكتون',
        affectedNutrient: 'potassium',
        type: 'CONTRAINDICATION',
        severity: 'CRITICAL',
        mechanismAr: 'مضاد الألدوستيرون',
        recommendationAr: 'الحد من البوتاسيوم',
      }];

      const result = RecommendationEngine.generateSummary(profile(), interactions, 15);
      const dniAlerts = result.alerts.filter((a) => a.titleAr.includes('سبيرونولاكتون'));
      expect(dniAlerts).toHaveLength(1);
      expect(dniAlerts[0].level).toBe('critical');
    });

    it('generates warning alert for MODERATE severity DNI', () => {
      const interactions: DrugNutrientInteraction[] = [{
        id: 'met',
        drugNameEn: 'Metformin',
        drugNameAr: 'ميتفورمين',
        affectedNutrient: 'vitamin_b12',
        type: 'DEPLETION',
        severity: 'MODERATE',
        mechanismAr: 'يضعف امتصاص B12',
        recommendationAr: 'مراقبة B12 سنوياً',
      }];

      const result = RecommendationEngine.generateSummary(profile(), interactions, 15);
      const dniAlerts = result.alerts.filter((a) => a.titleAr.includes('ميتفورمين'));
      expect(dniAlerts).toHaveLength(1);
      expect(dniAlerts[0].level).toBe('warning');
    });

    it('generates alerts for multiple DNI interactions', () => {
      const interactions: DrugNutrientInteraction[] = [
        {
          id: 'spiro', drugNameEn: 'Spironolactone', drugNameAr: 'سبيرونولاكتون',
          affectedNutrient: 'potassium', type: 'CONTRAINDICATION', severity: 'CRITICAL',
          mechanismAr: '', recommendationAr: 'الحد من البوتاسيوم',
        },
        {
          id: 'warf', drugNameEn: 'Warfarin', drugNameAr: 'وارفارين',
          affectedNutrient: 'vitamin_k', type: 'CONTRAINDICATION', severity: 'CRITICAL',
          mechanismAr: '', recommendationAr: 'تجنب التقلبات في فيتامين ك',
        },
        {
          id: 'met', drugNameEn: 'Metformin', drugNameAr: 'ميتفورمين',
          affectedNutrient: 'vitamin_b12', type: 'DEPLETION', severity: 'MODERATE',
          mechanismAr: '', recommendationAr: 'مراقبة B12',
        },
      ];

      const result = RecommendationEngine.generateSummary(profile(), interactions, 15);
      expect(result.alerts).toHaveLength(3);
      expect(result.alerts.filter((a) => a.level === 'critical')).toHaveLength(2);
      expect(result.alerts.filter((a) => a.level === 'warning')).toHaveLength(1);
    });
  });

  describe('generateSummary – contraindicated nutrients', () => {
    it('generates potassium ban alert', () => {
      const p = profile({ activeContraindicatedNutrients: ['potassium'] });
      const result = RecommendationEngine.generateSummary(p, [], 15);
      const kAlert = result.alerts.find((a) => a.id.includes('K_BAN'));
      expect(kAlert).toBeDefined();
      expect(kAlert!.level).toBe('warning');
      expect(result.educationalNotesAr.some((n) => n.includes('بوتاسيوم'))).toBe(true);
    });

    it('generates sodium ban alert', () => {
      const p = profile({ activeContraindicatedNutrients: ['sodium'] });
      const result = RecommendationEngine.generateSummary(p, [], 15);
      const naAlert = result.alerts.find((a) => a.id.includes('NA_BAN'));
      expect(naAlert).toBeDefined();
      expect(naAlert!.level).toBe('warning');
    });

    it('generates vitamin_k alert for warfarin patients', () => {
      const p = profile({ activeContraindicatedNutrients: ['vitamin_k'] });
      const result = RecommendationEngine.generateSummary(p, [], 15);
      const vkAlert = result.alerts.find((a) => a.id.includes('VITK_BAN'));
      expect(vkAlert).toBeDefined();
      expect(vkAlert!.level).toBe('critical');
    });

    it('generates high_ammonia_triggers alert', () => {
      const p = profile({ activeContraindicatedNutrients: ['high_ammonia_triggers'] });
      const result = RecommendationEngine.generateSummary(p, [], 15);
      const nh3Alert = result.alerts.find((a) => a.id.includes('NH3_BAN'));
      expect(nh3Alert).toBeDefined();
      expect(nh3Alert!.level).toBe('critical');
    });

    it('generates generic alert for unknown contraindicated nutrient', () => {
      const p = profile({ activeContraindicatedNutrients: ['oxalate'] });
      const result = RecommendationEngine.generateSummary(p, [], 15);
      const genAlert = result.alerts.find((a) => a.id.includes('BAN_OXALATE'));
      expect(genAlert).toBeDefined();
      expect(genAlert!.level).toBe('warning');
    });
  });

  describe('generateSummary – action plan', () => {
    it('builds critical action plan when critical alerts exist', () => {
      const p = profile({
        isStrictProteinRestriction: true,
        activeContraindicatedNutrients: ['potassium'],
      });
      const result = RecommendationEngine.generateSummary(p, [], 11);
      expect(result.suggestedActionPlanAr).toContain('خطة حرجة');
      expect(result.suggestedActionPlanAr).toContain('Late-Night Snack');
    });

    it('builds critical action plan when protein is restricted via GCS≤12', () => {
      const p = profile({ isStrictProteinRestriction: true });
      const result = RecommendationEngine.generateSummary(p, [], 11);
      expect(result.suggestedActionPlanAr).toContain('خطة حرجة');
      expect(result.suggestedActionPlanAr).toContain('Late-Night Snack');
    });

    it('builds normal action plan for stable patient', () => {
      const result = RecommendationEngine.generateSummary(profile(), [], 15);
      expect(result.suggestedActionPlanAr).toContain('خطة اعتيادية');
      expect(result.suggestedActionPlanAr).toContain('2100');
      expect(result.suggestedActionPlanAr).toContain('84');
    });
  });

  describe('generateSummary – combined scenario', () => {
    it('combines protein restriction + DNI + contraindications in one call', () => {
      const p = profile({
        isStrictProteinRestriction: true,
        targetProtein: 48,
        activeContraindicatedNutrients: ['potassium', 'sodium'],
      });

      const interactions: DrugNutrientInteraction[] = [{
        id: 'spiro',
        drugNameEn: 'Spironolactone',
        drugNameAr: 'سبيرونولاكتون',
        affectedNutrient: 'potassium',
        type: 'CONTRAINDICATION',
        severity: 'CRITICAL',
        mechanismAr: '',
        recommendationAr: 'الحد من البوتاسيوم',
      }];

      const result = RecommendationEngine.generateSummary(p, interactions, 9);
      expect(result.alerts.length).toBeGreaterThanOrEqual(4); // prot + spiro + K + Na
      expect(result.educationalNotesAr.length).toBeGreaterThan(0);
      expect(result.suggestedActionPlanAr).toContain('خطة حرجة');
    });
  });

  describe('generateSummary – empty/edge', () => {
    it('returns empty alerts for stable patient with no issues', () => {
      const result = RecommendationEngine.generateSummary(profile(), [], 15);
      expect(result.alerts).toEqual([]);
      expect(result.educationalNotesAr).toEqual([]);
      expect(result.suggestedActionPlanAr).toContain('خطة اعتيادية');
    });
  });

  // ---------- Integration: full pipeline ----------
  describe('Integration – full pipeline with recommendations', () => {
    it('generates recommendations from assessment + DNI + meal plan output', () => {
      // Step 1: Assessment
      const rawInput = {
        patientId: 'integration-test',
        actualWeight: 80,
        edema: 'GRADE_2' as const,
        ascites: 'MILD' as const,
        labs: { potassium: 5.5, sodium: 128 },
        clinical: { gcsScore: 14 },
      };
      const assessment = DynamicAssessmentEngine.processAssessment(rawInput);
      expect(assessment.activeContraindicatedNutrients).toContain('potassium');
      expect(assessment.activeContraindicatedNutrients).toContain('sodium');

      // Step 2: DNI
      const spironolactone: DrugNutrientInteraction = {
        id: 'dni-spiro',
        drugNameEn: 'Spironolactone',
        drugNameAr: 'سبيرونولاكتون',
        affectedNutrient: 'potassium',
        type: 'CONTRAINDICATION',
        severity: 'CRITICAL',
        mechanismAr: '',
        recommendationAr: 'الحد من البوتاسيوم',
      };
      const dniResult = DNIEngine.evaluateInteractions(
        ['Spironolactone'],
        assessment.activeContraindicatedNutrients,
        [spironolactone],
      );
      const updatedProfile = DNIEngine.updatePatientProfile(assessment, dniResult);

      // Step 3: Meal Planner
      const banana: FoodItem = {
        id: 'banana', nameAr: 'موز', nameEn: 'Banana',
        calories: 105, protein: 1.3, carbs: 27, fats: 0.4,
        micronutrients: { potassium: 422 },
      };
      const safeFood: FoodItem = {
        id: 'safe', nameAr: 'طعام آمن', nameEn: 'Safe Food',
        calories: 201, protein: 8, carbs: 30, fats: 5.5,
        micronutrients: {},
      };
      const mealResult = MealPlannerEngine.filterAndPlanMeals(updatedProfile, [banana, safeFood]);
      expect(mealResult.filteredCount.contraindicated).toBe(1);
      expect(mealResult.safeFoods).toHaveLength(1);

      // Step 4: Recommendations
      const recs = RecommendationEngine.generateSummary(
        updatedProfile,
        dniResult.triggeredInteractions,
        rawInput.clinical.gcsScore,
      );

      expect(recs.patientId).toBe('integration-test');
      expect(recs.alerts.length).toBeGreaterThanOrEqual(2); // spiro + K + Na
      expect(recs.educationalNotesAr.length).toBeGreaterThan(0);
      expect(recs.suggestedActionPlanAr).toBeTruthy();
    });
  });
});
