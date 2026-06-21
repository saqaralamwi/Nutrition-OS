import { describe, test, expect } from 'vitest';
import { AnemiaNutritionEngine } from '../AnemiaNutritionEngine';
import type { AnemiaAssessment, AnemiaSeverity, AnemiaType, IronStatus, B12Status, FolateStatus } from '../../types/anemia';

const baseAssessment: AnemiaAssessment = {
  patientId: 'p1',
  hemoglobin: 10,
  hemoglobinUnit: 'g/dL',
  severity: 'moderate',
  anemiaType: 'iron_deficiency',
  serumIron: 40,
  tibc: 400,
  ferritin: 15,
  transferrinSaturation: 10,
  ironStatus: 'low',
  vitaminB12: 300,
  b12Status: 'normal',
  serumFolate: 8,
  folateStatus: 'normal',
  mcv: 78,
  mch: 26,
  mchc: 32,
  rdw: 15,
  reticulocyteCount: 1.5,
  leukocyteCount: 6,
  plateletCount: 250,
  hasFatigue: true,
  hasWeakness: true,
  hasDyspnea: false,
  hasPalpitations: false,
  hasHeadache: true,
  hasDizziness: false,
  hasColdIntolerance: false,
  hasPallor: true,
  hasKoilonychia: false,
  hasGlossitis: false,
  hasMenstruation: true,
  isPregnant: false,
  isLactating: false,
  hasGIBleeding: false,
  hasChronicDisease: false,
  isVegetarian: false,
  isVegan: false,
  hasMalnutrition: false,
  avgIronIntake: 8,
  avgB12Intake: 2,
  avgFolateIntake: 200,
  dietaryPattern: 'regular',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('AnemiaNutritionEngine', () => {

  // =========================================================================
  // calculateRequirements
  // =========================================================================
  describe('calculateRequirements', () => {
    test('throws for zero weight', () => {
      expect(() => AnemiaNutritionEngine.calculateRequirements(baseAssessment, 0, 30, 'male'))
        .toThrow('Valid weight is required');
    });

    test('throws for negative weight', () => {
      expect(() => AnemiaNutritionEngine.calculateRequirements(baseAssessment, -10, 30, 'male'))
        .toThrow('Valid weight is required');
    });

    test('throws for undefined weight', () => {
      expect(() => AnemiaNutritionEngine.calculateRequirements(baseAssessment, undefined as unknown as number, 30, 'male'))
        .toThrow('Valid weight is required');
    });

    test('returns correct structure for male with normal iron', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        ironStatus: 'normal',
        b12Status: 'normal',
        folateStatus: 'normal',
        isVegan: false,
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 70, 30, 'male');
      expect(req.targetIron).toBe(8);
      expect(req.targetB12).toBe(2);
      expect(req.targetFolate).toBe(400);
      expect(req.targetProtein).toBe(84);
      expect(req.targetVitaminC).toBe(90);
      expect(req.targetZinc).toBe(11);
      expect(req.totalCalories).toBeGreaterThan(1500);
    });

    test('returns correct structure for female with normal status', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        ironStatus: 'normal',
        b12Status: 'normal',
        folateStatus: 'normal',
        isVegan: false,
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 60, 25, 'female');
      expect(req.targetIron).toBe(18);
      expect(req.targetB12).toBe(2);
      expect(req.targetFolate).toBe(400);
      expect(req.targetProtein).toBe(72);
      expect(req.targetVitaminC).toBe(75);
      expect(req.targetZinc).toBe(8);
    });

    test('doubles iron for depleted iron status', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        ironStatus: 'depleted',
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 70, 30, 'male');
      expect(req.targetIron).toBe(16);
    });

    test('1.5x iron for low iron status', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        ironStatus: 'low',
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 70, 30, 'male');
      expect(req.targetIron).toBe(12);
    });

    test('very_low iron status doubles iron', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        ironStatus: 'very_low',
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 70, 30, 'male');
      expect(req.targetIron).toBe(16);
    });

    test('pregnancy sets iron to 30 mg/day', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        ironStatus: 'normal',
        isPregnant: true,
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 60, 25, 'female', true);
      expect(req.targetIron).toBe(30);
    });

    test('lactation sets iron to 10 mg/day', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        ironStatus: 'normal',
        isLactating: true,
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 60, 25, 'female', false, true);
      expect(req.targetIron).toBe(10);
    });

    test('high B12 dose for deficient status', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        b12Status: 'deficient',
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 70, 30, 'male');
      expect(req.targetB12).toBe(1000);
    });

    test('moderate B12 dose for low status', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        b12Status: 'low',
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 70, 30, 'male');
      expect(req.targetB12).toBe(50);
    });

    test('very_low B12 status gets high dose', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        b12Status: 'very_low',
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 70, 30, 'male');
      expect(req.targetB12).toBe(1000);
    });

    test('doubles B12 for vegans', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        b12Status: 'normal',
        isVegan: true,
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 70, 30, 'male');
      expect(req.targetB12).toBe(5);
    });

    test('high folate for pregnancy', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        folateStatus: 'normal',
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 60, 25, 'female', true);
      expect(req.targetFolate).toBe(600);
    });

    test('high folate for deficient status', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        folateStatus: 'deficient',
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 70, 30, 'male');
      expect(req.targetFolate).toBe(1000);
    });

    test('very_low folate gets high dose', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        folateStatus: 'very_low',
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 70, 30, 'male');
      expect(req.targetFolate).toBe(1000);
    });

    test('moderate folate increase for low status', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        folateStatus: 'low',
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 70, 30, 'male');
      expect(req.targetFolate).toBe(800);
    });

    test('vitamin C increases when iron not normal', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        ironStatus: 'low',
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 70, 30, 'male');
      expect(req.targetVitaminC).toBe(200);
    });

    test('vitamin C is 75 for female with normal iron', () => {
      const assessment: AnemiaAssessment = {
        ...baseAssessment,
        ironStatus: 'normal',
      };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 60, 25, 'female');
      expect(req.targetVitaminC).toBe(75);
    });

    test('all return values are positive integers', () => {
      const assessment: AnemiaAssessment = { ...baseAssessment };
      const req = AnemiaNutritionEngine.calculateRequirements(assessment, 70, 30, 'male');
      expect(req.targetIron).toBeGreaterThan(0);
      expect(req.targetB12).toBeGreaterThan(0);
      expect(req.targetFolate).toBeGreaterThan(0);
      expect(req.targetProtein).toBeGreaterThan(0);
      expect(req.targetVitaminC).toBeGreaterThan(0);
      expect(req.targetZinc).toBeGreaterThan(0);
      expect(req.totalCalories).toBeGreaterThan(0);
      expect(Number.isInteger(req.targetIron)).toBe(true);
      expect(Number.isInteger(req.targetB12)).toBe(true);
      expect(Number.isInteger(req.targetFolate)).toBe(true);
      expect(Number.isInteger(req.targetProtein)).toBe(true);
      expect(Number.isInteger(req.targetVitaminC)).toBe(true);
      expect(Number.isInteger(req.targetZinc)).toBe(true);
      expect(Number.isInteger(req.totalCalories)).toBe(true);
    });
  });

  // =========================================================================
  // determineAnemiaType
  // =========================================================================
  describe('determineAnemiaType', () => {
    function makeAssessment(iron: IronStatus, b12: B12Status, folate: FolateStatus, fallback?: AnemiaType): AnemiaAssessment {
      return { ...baseAssessment, ironStatus: iron, b12Status: b12, folateStatus: folate, anemiaType: fallback ?? 'unknown' };
    }

    test('returns iron_deficiency when only iron is low', () => {
      expect(AnemiaNutritionEngine.determineAnemiaType(makeAssessment('low', 'normal', 'normal'))).toBe('iron_deficiency');
    });

    test('returns b12_deficiency when only b12 is low', () => {
      expect(AnemiaNutritionEngine.determineAnemiaType(makeAssessment('normal', 'low', 'normal'))).toBe('b12_deficiency');
    });

    test('returns folate_deficiency when only folate is low', () => {
      expect(AnemiaNutritionEngine.determineAnemiaType(makeAssessment('normal', 'normal', 'low'))).toBe('folate_deficiency');
    });

    // NOTE: The engine only returns 'mixed_deficiency' when ALL THREE statuses are non-normal.
    // When only 2 are low (iron+b12 or iron+folate), it returns 'iron_deficiency' because
    // the iron check comes first. This is a known behavior.
    test('returns iron_deficiency when iron and b12 are low (engine prioritizes iron)', () => {
      expect(AnemiaNutritionEngine.determineAnemiaType(makeAssessment('low', 'low', 'normal'))).toBe('iron_deficiency');
    });

    test('returns mixed_deficiency when all three are low', () => {
      expect(AnemiaNutritionEngine.determineAnemiaType(makeAssessment('low', 'low', 'low'))).toBe('mixed_deficiency');
    });

    test('returns iron_deficiency when iron and folate are low (engine prioritizes iron)', () => {
      expect(AnemiaNutritionEngine.determineAnemiaType(makeAssessment('low', 'normal', 'low'))).toBe('iron_deficiency');
    });

    test('returns fallback anemiaType when all normal', () => {
      expect(AnemiaNutritionEngine.determineAnemiaType(makeAssessment('normal', 'normal', 'normal', 'hemolytic'))).toBe('hemolytic');
    });

    test('returns unknown when all normal and no fallback', () => {
      expect(AnemiaNutritionEngine.determineAnemiaType(makeAssessment('normal', 'normal', 'normal'))).toBe('unknown');
    });

    test('treats very_low iron as deficiency', () => {
      expect(AnemiaNutritionEngine.determineAnemiaType(makeAssessment('very_low', 'normal', 'normal'))).toBe('iron_deficiency');
    });

    test('treats depleted iron as deficiency', () => {
      expect(AnemiaNutritionEngine.determineAnemiaType(makeAssessment('depleted', 'normal', 'normal'))).toBe('iron_deficiency');
    });

    test('treats very_low b12 as deficiency', () => {
      expect(AnemiaNutritionEngine.determineAnemiaType(makeAssessment('normal', 'very_low', 'normal'))).toBe('b12_deficiency');
    });

    test('treats deficient b12 as deficiency', () => {
      expect(AnemiaNutritionEngine.determineAnemiaType(makeAssessment('normal', 'deficient', 'normal'))).toBe('b12_deficiency');
    });

    test('treats very_low folate as deficiency', () => {
      expect(AnemiaNutritionEngine.determineAnemiaType(makeAssessment('normal', 'normal', 'very_low'))).toBe('folate_deficiency');
    });
  });

  // =========================================================================
  // generateSupplementationRecommendations
  // =========================================================================
  describe('generateSupplementationRecommendations', () => {
    function makeAssessment(iron: IronStatus, b12: B12Status, folate: FolateStatus): AnemiaAssessment {
      return { ...baseAssessment, ironStatus: iron, b12Status: b12, folateStatus: folate };
    }

    test('no supplementation when all normal', () => {
      const supp = AnemiaNutritionEngine.generateSupplementationRecommendations(makeAssessment('normal', 'normal', 'normal'));
      expect(supp.needsIron).toBe(false);
      expect(supp.needsB12).toBe(false);
      expect(supp.needsFolate).toBe(false);
      expect(supp.ironType).toBe('none');
      expect(supp.b12Type).toBe('none');
    });

    test('iron supplement for low iron status', () => {
      const supp = AnemiaNutritionEngine.generateSupplementationRecommendations(makeAssessment('low', 'normal', 'normal'));
      expect(supp.needsIron).toBe(true);
      expect(supp.ironType).toBe('ferrous_sulfate');
      expect(supp.ironDose).toBe(100);
      expect(supp.ironDuration).toBe(6);
    });

    test('iron supplement for depleted iron status', () => {
      const supp = AnemiaNutritionEngine.generateSupplementationRecommendations(makeAssessment('depleted', 'normal', 'normal'));
      expect(supp.needsIron).toBe(true);
      expect(supp.ironType).toBe('ferrous_sulfate');
      expect(supp.ironDose).toBe(200);
      expect(supp.ironDuration).toBe(12);
    });

    test('very_low iron gets 100 mg dose and 6 weeks', () => {
      const supp = AnemiaNutritionEngine.generateSupplementationRecommendations(makeAssessment('very_low', 'normal', 'normal'));
      expect(supp.needsIron).toBe(true);
      expect(supp.ironDose).toBe(100);
      expect(supp.ironDuration).toBe(6);
    });

    test('B12 supplement for low status — oral', () => {
      const supp = AnemiaNutritionEngine.generateSupplementationRecommendations(makeAssessment('normal', 'low', 'normal'));
      expect(supp.needsB12).toBe(true);
      expect(supp.b12Type).toBe('oral');
      expect(supp.b12Dose).toBe(500);
    });

    test('B12 supplement for deficient status — intramuscular', () => {
      const supp = AnemiaNutritionEngine.generateSupplementationRecommendations(makeAssessment('normal', 'deficient', 'normal'));
      expect(supp.needsB12).toBe(true);
      expect(supp.b12Type).toBe('intramuscular');
      expect(supp.b12Dose).toBe(1000);
    });

    test('B12 supplement for very_low status — oral', () => {
      const supp = AnemiaNutritionEngine.generateSupplementationRecommendations(makeAssessment('normal', 'very_low', 'normal'));
      expect(supp.needsB12).toBe(true);
      expect(supp.b12Type).toBe('oral');
      expect(supp.b12Dose).toBe(500);
    });

    test('folate supplement for low status', () => {
      const supp = AnemiaNutritionEngine.generateSupplementationRecommendations(makeAssessment('normal', 'normal', 'low'));
      expect(supp.needsFolate).toBe(true);
      expect(supp.folateDose).toBe(1);
    });

    test('folate supplement for deficient status', () => {
      const supp = AnemiaNutritionEngine.generateSupplementationRecommendations(makeAssessment('normal', 'normal', 'deficient'));
      expect(supp.needsFolate).toBe(true);
      expect(supp.folateDose).toBe(5);
    });

    test('folate supplement for very_low status', () => {
      const supp = AnemiaNutritionEngine.generateSupplementationRecommendations(makeAssessment('normal', 'normal', 'very_low'));
      expect(supp.needsFolate).toBe(true);
      expect(supp.folateDose).toBe(1);
    });

    test('combines all three supplementations when all deficient', () => {
      const supp = AnemiaNutritionEngine.generateSupplementationRecommendations(makeAssessment('depleted', 'deficient', 'deficient'));
      expect(supp.needsIron).toBe(true);
      expect(supp.needsB12).toBe(true);
      expect(supp.needsFolate).toBe(true);
      expect(supp.ironDose).toBe(200);
      expect(supp.b12Dose).toBe(1000);
      expect(supp.folateDose).toBe(5);
    });
  });

  // =========================================================================
  // generateDietaryRecommendations
  // =========================================================================
  describe('generateDietaryRecommendations', () => {
    test('returns iron-rich foods for iron_deficiency', () => {
      const recs = AnemiaNutritionEngine.generateDietaryRecommendations('iron_deficiency');
      expect(recs.ironRichFoods.length).toBeGreaterThan(0);
      expect(recs.ironRichFoods.some(f => f.toLowerCase().includes('meat'))).toBe(true);
      expect(recs.b12RichFoods.length).toBeGreaterThan(0);
      expect(recs.folateRichFoods.length).toBeGreaterThan(0);
      expect(recs.vitaminCRichFoods.length).toBeGreaterThan(0);
      expect(recs.avoidWithIron.length).toBeGreaterThan(0);
      expect(recs.mealTiming).toContain('hour');
    });

    test('returns B12-rich foods for b12_deficiency', () => {
      const recs = AnemiaNutritionEngine.generateDietaryRecommendations('b12_deficiency');
      expect(recs.ironRichFoods.some(f => f.toLowerCase().includes('liver'))).toBe(true);
    });

    test('returns folate-rich foods for folate_deficiency', () => {
      const recs = AnemiaNutritionEngine.generateDietaryRecommendations('folate_deficiency');
      expect(recs.ironRichFoods.some(f => f.toLowerCase().includes('beans') || f.toLowerCase().includes('lentil'))).toBe(true);
    });

    test('returns iron-rich foods for hemolytic anemia', () => {
      const recs = AnemiaNutritionEngine.generateDietaryRecommendations('hemolytic');
      expect(recs.ironRichFoods.length).toBeGreaterThan(0);
    });

    test('returns iron-rich foods for sickle_cell anemia', () => {
      const recs = AnemiaNutritionEngine.generateDietaryRecommendations('sickle_cell');
      expect(recs.ironRichFoods.length).toBeGreaterThan(0);
    });

    test('returns iron-rich foods for chronic_disease anemia', () => {
      const recs = AnemiaNutritionEngine.generateDietaryRecommendations('chronic_disease');
      expect(recs.ironRichFoods.length).toBeGreaterThan(0);
    });

    test('returns iron-rich foods for mixed_deficiency', () => {
      const recs = AnemiaNutritionEngine.generateDietaryRecommendations('mixed_deficiency');
      expect(recs.ironRichFoods.length).toBeGreaterThan(0);
    });

    test('returns iron-rich foods for unknown type', () => {
      const recs = AnemiaNutritionEngine.generateDietaryRecommendations('unknown');
      expect(recs.ironRichFoods.length).toBeGreaterThan(0);
    });

    test('dietary lists are non-empty for all types', () => {
      const types: AnemiaType[] = ['iron_deficiency', 'b12_deficiency', 'folate_deficiency', 'mixed_deficiency', 'hemolytic', 'sickle_cell', 'chronic_disease', 'unknown'];
      for (const t of types) {
        const r = AnemiaNutritionEngine.generateDietaryRecommendations(t);
        expect(r.ironRichFoods.length).toBeGreaterThan(0);
        expect(r.b12RichFoods.length).toBeGreaterThan(0);
        expect(r.folateRichFoods.length).toBeGreaterThan(0);
        expect(r.vitaminCRichFoods.length).toBeGreaterThan(0);
        expect(r.avoidWithIron.length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // classifySeverity
  // =========================================================================
  describe('classifySeverity', () => {
    // Male thresholds: <7 critical, <8 severe, <10 moderate, <13 mild, >=13 none
    test('male — critical below 7 g/dL', () => {
      expect(AnemiaNutritionEngine.classifySeverity(6, 'g/dL', 'male')).toBe('critical');
    });

    test('male — severe between 7 and 7.9 g/dL', () => {
      expect(AnemiaNutritionEngine.classifySeverity(7, 'g/dL', 'male')).toBe('severe');
    });

    test('male — moderate between 8 and 9.9 g/dL', () => {
      expect(AnemiaNutritionEngine.classifySeverity(8, 'g/dL', 'male')).toBe('moderate');
      expect(AnemiaNutritionEngine.classifySeverity(9.9, 'g/dL', 'male')).toBe('moderate');
    });

    test('male — mild between 10 and 12.9 g/dL', () => {
      expect(AnemiaNutritionEngine.classifySeverity(10, 'g/dL', 'male')).toBe('mild');
      expect(AnemiaNutritionEngine.classifySeverity(12.9, 'g/dL', 'male')).toBe('mild');
    });

    test('male — none at 13+ g/dL', () => {
      expect(AnemiaNutritionEngine.classifySeverity(13, 'g/dL', 'male')).toBe('none');
      expect(AnemiaNutritionEngine.classifySeverity(15, 'g/dL', 'male')).toBe('none');
    });

    // Female thresholds: <7 critical, <8 severe, <10 moderate, <12 mild, >=12 none
    test('female — moderate between 8 and 9.9 g/dL', () => {
      expect(AnemiaNutritionEngine.classifySeverity(8, 'g/dL', 'female')).toBe('moderate');
      expect(AnemiaNutritionEngine.classifySeverity(9.9, 'g/dL', 'female')).toBe('moderate');
    });

    test('female — mild between 10 and 11.9 g/dL', () => {
      expect(AnemiaNutritionEngine.classifySeverity(10, 'g/dL', 'female')).toBe('mild');
      expect(AnemiaNutritionEngine.classifySeverity(11.9, 'g/dL', 'female')).toBe('mild');
    });

    test('female — none at 12+ g/dL', () => {
      expect(AnemiaNutritionEngine.classifySeverity(12, 'g/dL', 'female')).toBe('none');
    });

    // Pregnant thresholds: <7 critical, <8 severe, <10 moderate, <11 mild, >=11 none
    test('pregnant — mild between 10 and 10.9 g/dL', () => {
      expect(AnemiaNutritionEngine.classifySeverity(10, 'g/dL', 'female', true)).toBe('mild');
      expect(AnemiaNutritionEngine.classifySeverity(10.5, 'g/dL', 'female', true)).toBe('mild');
    });

    test('pregnant — none at 11+ g/dL', () => {
      expect(AnemiaNutritionEngine.classifySeverity(11, 'g/dL', 'female', true)).toBe('none');
    });

    test('converts g/L to g/dL correctly', () => {
      // 80 g/L = 8 g/dL → moderate for male (8 is not < 8)
      expect(AnemiaNutritionEngine.classifySeverity(80, 'g/L', 'male')).toBe('moderate');
    });

    test('g/L — 100 g/L = 10 g/dL — mild for male', () => {
      expect(AnemiaNutritionEngine.classifySeverity(100, 'g/L', 'male')).toBe('mild');
    });

    test('g/L — 60 g/L = 6 g/dL — critical', () => {
      expect(AnemiaNutritionEngine.classifySeverity(60, 'g/L', 'male')).toBe('critical');
    });

    test('g/L — 130 g/L = 13 g/dL — none for male', () => {
      expect(AnemiaNutritionEngine.classifySeverity(130, 'g/L', 'male')).toBe('none');
    });

    test('g/L — 110 g/L = 11 g/dL — mild for female', () => {
      expect(AnemiaNutritionEngine.classifySeverity(110, 'g/L', 'female')).toBe('mild');
    });

    test('boundary at 7 g/dL exactly — severe', () => {
      expect(AnemiaNutritionEngine.classifySeverity(7, 'g/dL', 'male')).toBe('severe');
    });

    test('boundary at 8 g/dL exactly — moderate (8 < 8 is false)', () => {
      expect(AnemiaNutritionEngine.classifySeverity(8, 'g/dL', 'male')).toBe('moderate');
    });

    test('boundary at 10 g/dL exactly — mild (10 < 10 is false)', () => {
      expect(AnemiaNutritionEngine.classifySeverity(10, 'g/dL', 'male')).toBe('mild');
    });
  });

  // =========================================================================
  // calculateExpectedRecovery
  // =========================================================================
  describe('calculateExpectedRecovery', () => {
    test('mild iron_deficiency returns 4 weeks', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('mild', 'iron_deficiency')).toBe(4);
    });

    test('moderate iron_deficiency returns 8 weeks', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('moderate', 'iron_deficiency')).toBe(8);
    });

    test('severe iron_deficiency returns 12 weeks', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('severe', 'iron_deficiency')).toBe(12);
    });

    test('critical iron_deficiency returns 16 weeks', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('critical', 'iron_deficiency')).toBe(16);
    });

    test('default returns 0 weeks', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('none' as AnemiaSeverity, 'iron_deficiency')).toBe(0);
    });

    test('b12_deficiency takes 1.5x longer (mild: 6 weeks)', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('mild', 'b12_deficiency')).toBe(6);
    });

    test('b12_deficiency moderate: 12 weeks', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('moderate', 'b12_deficiency')).toBe(12);
    });

    test('b12_deficiency severe: 18 weeks', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('severe', 'b12_deficiency')).toBe(18);
    });

    test('b12_deficiency critical: 24 weeks', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('critical', 'b12_deficiency')).toBe(24);
    });

    test('folate_deficiency recovers 0.8x faster (mild: 3 weeks)', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('mild', 'folate_deficiency')).toBe(3);
    });

    test('folate_deficiency moderate: 6 weeks', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('moderate', 'folate_deficiency')).toBe(6);
    });

    test('folate_deficiency severe: 10 weeks', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('severe', 'folate_deficiency')).toBe(10);
    });

    test('folate_deficiency critical: 13 weeks', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('critical', 'folate_deficiency')).toBe(13);
    });

    test('all severities for iron_deficiency produce increasing weeks', () => {
      const mild = AnemiaNutritionEngine.calculateExpectedRecovery('mild', 'iron_deficiency');
      const moderate = AnemiaNutritionEngine.calculateExpectedRecovery('moderate', 'iron_deficiency');
      const severe = AnemiaNutritionEngine.calculateExpectedRecovery('severe', 'iron_deficiency');
      const critical = AnemiaNutritionEngine.calculateExpectedRecovery('critical', 'iron_deficiency');
      expect(mild).toBeLessThan(moderate);
      expect(moderate).toBeLessThan(severe);
      expect(severe).toBeLessThan(critical);
    });

    test('mixed_deficiency follows iron_deficiency pattern', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('moderate', 'mixed_deficiency')).toBe(8);
    });

    test('hemolytic follows iron_deficiency pattern', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('moderate', 'hemolytic')).toBe(8);
    });

    test('sickle_cell follows iron_deficiency pattern', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('moderate', 'sickle_cell')).toBe(8);
    });

    test('chronic_disease follows iron_deficiency pattern', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('moderate', 'chronic_disease')).toBe(8);
    });

    test('unknown follows iron_deficiency pattern', () => {
      expect(AnemiaNutritionEngine.calculateExpectedRecovery('moderate', 'unknown')).toBe(8);
    });

    test('all severity × type combinations return positive weeks', () => {
      const severities: AnemiaSeverity[] = ['none', 'mild', 'moderate', 'severe', 'critical'];
      const types: AnemiaType[] = ['iron_deficiency', 'b12_deficiency', 'folate_deficiency', 'mixed_deficiency', 'hemolytic', 'sickle_cell', 'chronic_disease', 'unknown'];
      for (const s of severities) {
        for (const t of types) {
          const weeks = AnemiaNutritionEngine.calculateExpectedRecovery(s, t);
          expect(weeks).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(weeks)).toBe(true);
        }
      }
    });
  });
});
