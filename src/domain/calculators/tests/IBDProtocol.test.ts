import { describe, it, expect } from 'vitest';
import { IBDProtocol, IBDPatient } from '../IBDProtocol';

describe('IBDProtocol', () => {
  const activeCrohnSevere: IBDPatient = {
    weight: 60,
    height: 165,
    age: 35,
    gender: 'female',
    diseaseType: 'crohn',
    phase: 'active',
    location: 'small_bowel',
    severity: 'severe',
    malabsorption: true,
    weightLoss: 8,
    diarrhea: 'moderate',
    bloodInStool: false,
    fistula: false,
    surgicalHistory: [],
    medications: [],
    nutrients: { iron: 60, b12: 250, folate: 4, vitaminD: 25, albumin: 3.2, hgb: 11 },
  };

  const activeUcModerate: IBDPatient = {
    weight: 65,
    height: 170,
    age: 40,
    gender: 'male',
    diseaseType: 'uc',
    phase: 'active',
    severity: 'moderate',
    malabsorption: false,
    weightLoss: 3,
    diarrhea: 'mild',
    bloodInStool: true,
    fistula: false,
    surgicalHistory: [],
    medications: [],
    nutrients: null,
  };

  const maintenanceCrohn: IBDPatient = {
    weight: 60,
    height: 165,
    age: 35,
    gender: 'female',
    diseaseType: 'crohn',
    phase: 'maintenance',
    location: 'small_bowel',
    severity: 'mild',
    malabsorption: true,
    weightLoss: 2,
    diarrhea: 'none',
    bloodInStool: false,
    fistula: false,
    surgicalHistory: [],
    medications: [],
    nutrients: { iron: 80, b12: 200, folate: 5, vitaminD: 35, albumin: 4.0, hgb: 13 },
  };

  const maintenanceUc: IBDPatient = {
    weight: 65,
    height: 170,
    age: 40,
    gender: 'male',
    diseaseType: 'uc',
    phase: 'maintenance',
    severity: 'mild',
    malabsorption: false,
    weightLoss: 1,
    diarrhea: 'none',
    bloodInStool: false,
    fistula: false,
    surgicalHistory: [],
    medications: [],
    nutrients: null,
  };

  describe('calculateCalories', () => {
    it('should calculate calories for active severe Crohn with weight loss compensation', () => {
      const calories = IBDProtocol.calculateCalories(activeCrohnSevere);
      expect(calories).toBeGreaterThanOrEqual(1500);
      expect(calories).toBeLessThanOrEqual(3500);
    });

    it('should calculate calories for active moderate UC', () => {
      const calories = IBDProtocol.calculateCalories(activeUcModerate);
      expect(calories).toBeGreaterThanOrEqual(1500);
      expect(calories).toBeLessThanOrEqual(3500);
    });

    it('should calculate lower calories for maintenance phase', () => {
      const activeCal = IBDProtocol.calculateCalories(activeCrohnSevere);
      const maintCal = IBDProtocol.calculateCalories(maintenanceCrohn);
      expect(activeCal).toBeGreaterThanOrEqual(maintCal);
    });

    it('should floor calories at 1500 for invalid inputs', () => {
      const result = IBDProtocol.calculateCalories({
        ...maintenanceUc,
        weight: 0,
      });
      expect(result).toBe(1500);
    });
  });

  describe('calculateProtein', () => {
    it('should calculate 1.5 g/kg for active severe Crohn plus malabsorption 0.2', () => {
      const protein = IBDProtocol.calculateProtein(activeCrohnSevere);
      expect(protein).toBe(Math.round(60 * 1.7));
    });

    it('should calculate 1.3 g/kg for active moderate UC', () => {
      const protein = IBDProtocol.calculateProtein(activeUcModerate);
      expect(protein).toBe(Math.round(65 * 1.3));
    });

    it('should calculate 1.0 g/kg for maintenance phase', () => {
      const protein = IBDProtocol.calculateProtein(maintenanceUc);
      expect(protein).toBe(Math.round(65 * 1.0));
    });

    it('should add 0.2 g/kg for steroids', () => {
      const onSteroids: IBDPatient = {
        ...activeUcModerate,
        medications: ['prednisone 20mg'],
      };
      const protein = IBDProtocol.calculateProtein(onSteroids);
      expect(protein).toBe(Math.round(65 * 1.5));
    });

    it('should cap protein at 150g', () => {
      const protein = IBDProtocol.calculateProtein({
        ...activeCrohnSevere,
        weight: 120,
      });
      expect(protein).toBeLessThanOrEqual(150);
    });

    it('should floor protein at 60g for invalid inputs', () => {
      const protein = IBDProtocol.calculateProtein({
        ...maintenanceUc,
        weight: 0,
      });
      expect(protein).toBe(60);
    });
  });

  describe('calculateMacros', () => {
    it('should use 50% carbs and 30% fat for normal diarrhea and no malabsorption', () => {
      const { carbs, fat } = IBDProtocol.calculateMacros(2000, 84, {
        ...maintenanceUc,
        diarrhea: 'none',
        malabsorption: false,
      });
      const proteinCalories = 84 * 4;
      const nonProteinCalories = 2000 - proteinCalories;
      const expectedCarbs = Math.round((nonProteinCalories * 0.50 / 0.80) / 4);
      const expectedFat = Math.round((nonProteinCalories * 0.30 / 0.80) / 9);
      expect(carbs).toBe(expectedCarbs);
      expect(fat).toBe(expectedFat);
    });

    it('should reduce carbs to 45% for severe diarrhea', () => {
      const { carbs } = IBDProtocol.calculateMacros(2000, 84, {
        ...maintenanceUc,
        diarrhea: 'severe',
        malabsorption: false,
      });
      const proteinCalories = 84 * 4;
      const nonProteinCalories = 2000 - proteinCalories;
      const expectedCarbs = Math.round((nonProteinCalories * 0.45 / 0.75) / 4);
      expect(carbs).toBe(expectedCarbs);
    });

    it('should increase fat to 35% for malabsorption', () => {
      const { fat } = IBDProtocol.calculateMacros(2000, 84, {
        ...maintenanceUc,
        malabsorption: true,
        diarrhea: 'none',
      });
      const proteinCalories = 84 * 4;
      const nonProteinCalories = 2000 - proteinCalories;
      const expectedFat = Math.round((nonProteinCalories * 0.35 / 0.85) / 9);
      expect(fat).toBe(expectedFat);
    });

    it('should return zeros for invalid inputs', () => {
      const { carbs, fat } = IBDProtocol.calculateMacros(0, 0, maintenanceUc);
      expect(carbs).toBe(0);
      expect(fat).toBe(0);
    });
  });

  describe('createMealPlan', () => {
    it('should create 3 main meals and 2 snacks', () => {
      const plan = IBDProtocol.createMealPlan(2000, 84, 250, 65, maintenanceUc);
      expect(plan.mainMeals).toHaveLength(3);
      expect(plan.snacks).toHaveLength(2);
    });

    it('should use low residue foods for active phase', () => {
      const plan = IBDProtocol.createMealPlan(2000, 100, 250, 65, activeCrohnSevere);
      const firstMealFoods = plan.mainMeals[0].foods;
      expect(firstMealFoods).toEqual(expect.arrayContaining(['أرز أبيض', 'خضار مسلوقة (غير ورقية)']));
    });

    it('should use normal foods for maintenance phase', () => {
      const plan = IBDProtocol.createMealPlan(2000, 65, 250, 65, maintenanceUc);
      const firstMealFoods = plan.mainMeals[0].foods;
      expect(firstMealFoods).toEqual(expect.arrayContaining(['خبز كامل', 'فواكه']));
    });

    it('should increase meal frequency to 6 for severe diarrhea', () => {
      const plan = IBDProtocol.createMealPlan(2000, 84, 250, 65, {
        ...maintenanceUc,
        diarrhea: 'severe',
      });
      expect(plan.mealFrequency).toBe(6);
    });

    it('should use meal frequency 5 for non-severe diarrhea', () => {
      const plan = IBDProtocol.createMealPlan(2000, 84, 250, 65, maintenanceUc);
      expect(plan.mealFrequency).toBe(5);
    });

    it('should return empty arrays for invalid inputs', () => {
      const plan = IBDProtocol.createMealPlan(0, 0, 0, 0, maintenanceUc);
      expect(plan.mainMeals).toHaveLength(0);
      expect(plan.snacks).toHaveLength(0);
    });
  });

  describe('createRestrictions', () => {
    it('should include Low residue restrictions for active phase', () => {
      const restrictions = IBDProtocol.createRestrictions(activeUcModerate);
      expect(restrictions).toEqual(expect.arrayContaining([
        expect.stringContaining('Low residue'),
      ]));
    });

    it('should include Low fat for diarrhea', () => {
      const restrictions = IBDProtocol.createRestrictions(activeUcModerate);
      expect(restrictions).toEqual(expect.arrayContaining([
        expect.stringContaining('Low fat'),
      ]));
    });

    it('should include Low fat for malabsorption', () => {
      const restrictions = IBDProtocol.createRestrictions(activeCrohnSevere);
      expect(restrictions).toEqual(expect.arrayContaining([
        expect.stringContaining('Low fat: تجنب الدهون'),
      ]));
    });

    it('should prohibit alcohol', () => {
      const restrictions = IBDProtocol.createRestrictions(maintenanceUc);
      expect(restrictions).toEqual(expect.arrayContaining([
        expect.stringContaining('الكحول'),
      ]));
    });

    it('should include Low fiber for Crohn small bowel', () => {
      const restrictions = IBDProtocol.createRestrictions(activeCrohnSevere);
      expect(restrictions).toEqual(expect.arrayContaining([
        expect.stringContaining('Low fiber'),
      ]));
    });

    it('should include spicy food restriction for UC with blood', () => {
      const restrictions = IBDProtocol.createRestrictions(activeUcModerate);
      expect(restrictions).toEqual(expect.arrayContaining([
        expect.stringContaining('تجنب الأطعمة الحارة'),
      ]));
    });
  });

  describe('createSupplementPlan', () => {
    it('should include iron when Hgb < 12', () => {
      const supp = IBDProtocol.createSupplementPlan(activeCrohnSevere);
      expect(supp.iron).not.toBeNull();
      expect(supp.iron!.dose).toBe(50);
    });

    it('should not include iron when Hgb >= 12', () => {
      const supp = IBDProtocol.createSupplementPlan(maintenanceCrohn);
      expect(supp.iron).toBeNull();
    });

    it('should include B12 for Crohn with malabsorption and low B12', () => {
      const supp = IBDProtocol.createSupplementPlan(maintenanceCrohn);
      expect(supp.b12).not.toBeNull();
      expect(supp.b12!.dose).toBe(1000);
    });

    it('should not include B12 if B12 >= 300', () => {
      const highB12: IBDPatient = {
        ...maintenanceCrohn,
        nutrients: { ...maintenanceCrohn.nutrients!, b12: 350 },
      };
      const supp = IBDProtocol.createSupplementPlan(highB12);
      expect(supp.b12).toBeNull();
    });

    it('should include folate for steroids', () => {
      const onSteroids: IBDPatient = {
        ...maintenanceUc,
        medications: ['prednisone'],
      };
      const supp = IBDProtocol.createSupplementPlan(onSteroids);
      expect(supp.folate).not.toBeNull();
      expect(supp.folate!.dose).toBe(1);
    });

    it('should include vitamin D at 1000 IU when low', () => {
      const supp = IBDProtocol.createSupplementPlan(activeCrohnSevere);
      expect(supp.vitaminD.dose).toBe(1000);
    });

    it('should include vitamin D at 600 IU when normal', () => {
      const supp = IBDProtocol.createSupplementPlan(maintenanceCrohn);
      expect(supp.vitaminD.dose).toBe(600);
    });

    it('should include calcium for steroids', () => {
      const onSteroids: IBDPatient = {
        ...maintenanceUc,
        medications: ['steroids'],
      };
      const supp = IBDProtocol.createSupplementPlan(onSteroids);
      expect(supp.calcium).not.toBeNull();
      expect(supp.calcium!.dose).toBe(1000);
    });

    it('should include probiotics for UC', () => {
      const supp = IBDProtocol.createSupplementPlan(maintenanceUc);
      expect(supp.probiotics).not.toBeNull();
    });

    it('should not include probiotics for Crohn', () => {
      const supp = IBDProtocol.createSupplementPlan(maintenanceCrohn);
      expect(supp.probiotics).toBeNull();
    });

    it('should always include multivitamin', () => {
      const supp = IBDProtocol.createSupplementPlan(maintenanceUc);
      expect(supp.multivitamin).toBeDefined();
    });
  });

  describe('createAlerts', () => {
    it('should include weight loss alert when > 5kg', () => {
      const alerts = IBDProtocol.createAlerts(activeCrohnSevere);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('Weight loss'),
      ]));
    });

    it('should include anemia alert when Hgb < 12', () => {
      const alerts = IBDProtocol.createAlerts(activeCrohnSevere);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('Anemia'),
      ]));
    });

    it('should include malabsorption alert', () => {
      const alerts = IBDProtocol.createAlerts(activeCrohnSevere);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('Malabsorption'),
      ]));
    });

    it('should include fistula alert', () => {
      const withFistula: IBDPatient = {
        ...activeCrohnSevere,
        fistula: true,
      };
      const alerts = IBDProtocol.createAlerts(withFistula);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('Fistula'),
      ]));
    });

    it('should include steroids alert', () => {
      const onSteroids: IBDPatient = {
        ...maintenanceUc,
        medications: ['prednisone'],
      };
      const alerts = IBDProtocol.createAlerts(onSteroids);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('Steroids'),
      ]));
    });

    it('should include severe diarrhea alert', () => {
      const severeD: IBDPatient = {
        ...maintenanceUc,
        diarrhea: 'severe',
      };
      const alerts = IBDProtocol.createAlerts(severeD);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('وجبات صغيرة'),
      ]));
    });

    it('should detect DNI interactions for mesalamine', () => {
      const onMesa: IBDPatient = {
        ...maintenanceUc,
        medications: ['mesalamine 500mg'],
      };
      const alerts = IBDProtocol.createAlerts(onMesa);
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('ميسالامين'),
      ]));
    });

    it('should handle invalid lab values gracefully', () => {
      const alerts = IBDProtocol.createAlerts({
        ...maintenanceUc,
        nutrients: { iron: NaN, b12: 250, folate: 4, vitaminD: 25, albumin: 3.2, hgb: NaN },
      });
      expect(alerts).toEqual(expect.arrayContaining([
        expect.stringContaining('بعض القيم المخبرية غير صالحة'),
      ]));
    });
  });

  describe('createMonitoringPlan', () => {
    it('should include basic lab tests', () => {
      const plan = IBDProtocol.createMonitoringPlan(maintenanceUc);
      expect(plan.labTests.map(t => t.test)).toContain('Hgb (CBC)');
      expect(plan.labTests.map(t => t.test)).toContain('Iron');
      expect(plan.labTests.map(t => t.test)).toContain('B12');
      expect(plan.labTests.map(t => t.test)).toContain('Vitamin D');
      expect(plan.labTests.map(t => t.test)).toContain('Albumin');
      expect(plan.labTests.map(t => t.test)).toContain('CRP/ESR');
    });

    it('should include clinical monitoring parameters', () => {
      const plan = IBDProtocol.createMonitoringPlan(maintenanceUc);
      expect(plan.clinical.map(c => c.parameter)).toContain('Weight');
      expect(plan.clinical.map(c => c.parameter)).toContain('Diarrhea frequency');
      expect(plan.clinical.map(c => c.parameter)).toContain('Blood in stool');
      expect(plan.clinical.map(c => c.parameter)).toContain('Muscle mass');
      expect(plan.clinical.map(c => c.parameter)).toContain('Phase');
    });
  });

  describe('createTitrationPlan', () => {
    it('should return plan when weight loss > 5kg', () => {
      const plan = IBDProtocol.createTitrationPlan(activeCrohnSevere);
      expect(plan).not.toBeNull();
      expect(plan!.increaseCalories).toBe(150);
      expect(plan!.increaseProtein).toBe(10);
    });

    it('should return plan when albumin < 3.5', () => {
      const lowAlb: IBDPatient = {
        ...maintenanceUc,
        nutrients: { iron: 80, b12: 300, folate: 4, vitaminD: 30, albumin: 3.2, hgb: 13 },
        weightLoss: 2,
      };
      const plan = IBDProtocol.createTitrationPlan(lowAlb);
      expect(plan).not.toBeNull();
    });

    it('should return null for stable patient', () => {
      const plan = IBDProtocol.createTitrationPlan(maintenanceUc);
      expect(plan).toBeNull();
    });
  });

  describe('generatePrescription', () => {
    it('should generate complete prescription for active severe Crohn', () => {
      const rx = IBDProtocol.generatePrescription(activeCrohnSevere);
      expect(rx.calories).toBeGreaterThanOrEqual(1500);
      expect(rx.protein).toBe(Math.round(60 * 1.7));
      expect(rx.restrictions).toContainEqual(expect.stringContaining('Low residue'));
      expect(rx.supplements.b12).toBeDefined();
      expect(rx.supplements.b12!.dose).toBe(1000);
      expect(rx.alerts.length).toBeGreaterThan(0);
      expect(rx.monitoring.labTests.length).toBeGreaterThan(0);
      expect(rx.monitoring.clinical.length).toBeGreaterThan(0);
    });

    it('should generate complete prescription for maintenance UC', () => {
      const rx = IBDProtocol.generatePrescription(maintenanceUc);
      expect(rx.calories).toBeGreaterThanOrEqual(1500);
      expect(rx.protein).toBe(Math.round(65 * 1.0));
      expect(rx.restrictions).not.toContainEqual(expect.stringContaining('Low residue'));
      expect(rx.supplements.probiotics).toBeDefined();
      expect(rx.alerts.length).toBeGreaterThan(0);
    });

    it('should include restrictions and supplement plan', () => {
      const rx = IBDProtocol.generatePrescription(activeCrohnSevere);
      expect(rx.restrictions.length).toBeGreaterThan(0);
      expect(rx.supplements.vitaminD).toBeDefined();
      expect(rx.supplements.multivitamin).toBeDefined();
    });

    it('should include titration for malnourished patient', () => {
      const rx = IBDProtocol.generatePrescription(activeCrohnSevere);
      expect(rx.titration).not.toBeNull();
    });

    it('should return safe fallback for invalid inputs', () => {
      const rx = IBDProtocol.generatePrescription({
        ...maintenanceUc,
        weight: -1,
      });
      expect(rx.calories).toBe(0);
      expect(rx.protein).toBe(0);
      expect(rx.meals.mainMeals).toHaveLength(0);
      expect(rx.alerts[0]).toContain('الرجاء إدخال بيانات صحيحة');
    });
  });
});
