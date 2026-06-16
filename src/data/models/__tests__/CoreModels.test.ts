import { describe, test, expect } from 'vitest';

describe('Clinical Business Logic', () => {

  describe('BMI Calculation', () => {
    function calcBmi(weightKg: number, heightCm: number): number {
      if (heightCm <= 0) return 0;
      return Math.round((weightKg / ((heightCm / 100) ** 2)) * 10) / 10;
    }

    function getBmiCategory(bmi: number): { label: string; labelEn: string } {
      if (bmi < 18.5) return { label: 'نحافة', labelEn: 'Underweight' };
      if (bmi < 25) return { label: 'طبيعي', labelEn: 'Normal' };
      if (bmi < 30) return { label: 'وزن مرتفع', labelEn: 'Overweight' };
      if (bmi < 35) return { label: 'سمنة درجة 1', labelEn: 'Obese Class 1' };
      if (bmi < 40) return { label: 'سمنة درجة 2', labelEn: 'Obese Class 2' };
      return { label: 'سمنة درجة 3', labelEn: 'Obese Class 3' };
    }

    test('normal BMI range (18.5-24.9)', () => {
      const bmi = calcBmi(70, 175);
      expect(bmi).toBe(22.9);
      expect(getBmiCategory(bmi).labelEn).toBe('Normal');
    });

    test('underweight (< 18.5)', () => {
      const bmi = calcBmi(50, 170);
      expect(bmi).toBe(17.3);
      expect(getBmiCategory(bmi).labelEn).toBe('Underweight');
    });

    test('overweight (25-29.9)', () => {
      const bmi = calcBmi(85, 175);
      expect(bmi).toBe(27.8);
      expect(getBmiCategory(bmi).labelEn).toBe('Overweight');
    });

    test('obese class 1 (30-34.9)', () => {
      const bmi = calcBmi(100, 170);
      expect(bmi).toBe(34.6);
      expect(getBmiCategory(bmi).labelEn).toBe('Obese Class 1');
    });

    test('obese class 2 (35-39.9)', () => {
      const bmi = calcBmi(110, 165);
      expect(bmi).toBe(40.4);
      expect(getBmiCategory(bmi).labelEn).toBe('Obese Class 3');
    });

    test('obese class 3 (>= 40)', () => {
      const bmi = calcBmi(130, 165);
      expect(bmi).toBe(47.8);
      expect(getBmiCategory(bmi).labelEn).toBe('Obese Class 3');
    });

    test('returns 0 for zero height', () => {
      const bmi = calcBmi(70, 0);
      expect(bmi).toBe(0);
    });
  });

  describe('Age Calculation', () => {
    function calcAge(dateOfBirth: string): number {
      const birth = new Date(dateOfBirth);
      const today = new Date('2026-01-15');
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    }

    test('exact birthday', () => {
      expect(calcAge('1990-01-15')).toBe(36);
    });

    test('birthday later this year', () => {
      expect(calcAge('1990-06-15')).toBe(35);
    });

    test('newborn', () => {
      expect(calcAge('2025-12-01')).toBe(0);
    });
  });

  describe('Glucose Status', () => {
    function getGlucoseLevel(value: number, measurementType: string): { label: string; color: string } {
      if (measurementType === 'fasting') {
        if (value < 70) return { label: 'منخفض', color: 'text-red-600' };
        if (value > 126) return { label: 'مرتفع', color: 'text-red-600' };
        return { label: 'طبيعي', color: 'text-green-600' };
      }
      if (value < 70) return { label: 'منخفض', color: 'text-red-600' };
      if (value > 180) return { label: 'مرتفع', color: 'text-red-600' };
      return { label: 'طبيعي', color: 'text-green-600' };
    }

    test('fasting normal (70-100)', () => {
      const level = getGlucoseLevel(90, 'fasting');
      expect(level.label).toBe('طبيعي');
    });

    test('fasting high (> 126)', () => {
      const level = getGlucoseLevel(130, 'fasting');
      expect(level.label).toBe('مرتفع');
    });

    test('fasting low (< 70)', () => {
      const level = getGlucoseLevel(65, 'fasting');
      expect(level.label).toBe('منخفض');
    });

    test('postprandial normal (90-140)', () => {
      const level = getGlucoseLevel(120, 'postprandial');
      expect(level.label).toBe('طبيعي');
    });

    test('postprandial high (> 180)', () => {
      const level = getGlucoseLevel(200, 'postprandial');
      expect(level.label).toBe('مرتفع');
    });
  });

  describe('Meal Calculations', () => {
    function calcNutrientPerAmount(basePer100g: number, amountGrams: number): number {
      return (basePer100g * amountGrams) / 100;
    }

    test('calories for specific amount', () => {
      const calories = calcNutrientPerAmount(111, 200); // brown rice
      expect(calories).toBe(222);
    });

    test('protein for specific amount', () => {
      const protein = calcNutrientPerAmount(31, 150); // chicken breast
      expect(protein).toBe(46.5);
    });

    test('zero amount returns zero', () => {
      expect(calcNutrientPerAmount(100, 0)).toBe(0);
    });
  });

  describe('Arabic Helper Functions', () => {
    function getMealTypeAr(type: string): string {
      const map: Record<string, string> = {
        breakfast: 'إفطار',
        lunch: 'غداء',
        dinner: 'عشاء',
        snack: 'وجبة خفيفة',
      };
      return map[type] || type;
    }

    function getMeasurementTypeAr(type: string): string {
      const map: Record<string, string> = {
        fasting: 'صائم',
        random: 'عشوائي',
        before_meal: 'قبل الوجبة',
        after_meal: 'بعد الوجبة',
        postprandial: 'فاطر',
        bedtime: 'قبل النوم',
      };
      return map[type] || type;
    }

    test('meal type mapping', () => {
      expect(getMealTypeAr('breakfast')).toBe('إفطار');
      expect(getMealTypeAr('lunch')).toBe('غداء');
      expect(getMealTypeAr('dinner')).toBe('عشاء');
      expect(getMealTypeAr('snack')).toBe('وجبة خفيفة');
    });

    test('measurement type mapping', () => {
      expect(getMeasurementTypeAr('fasting')).toBe('صائم');
      expect(getMeasurementTypeAr('postprandial')).toBe('فاطر');
      expect(getMeasurementTypeAr('before_meal')).toBe('قبل الوجبة');
    });

    test('unknown type returns itself', () => {
      expect(getMealTypeAr('unknown')).toBe('unknown');
    });
  });
});
