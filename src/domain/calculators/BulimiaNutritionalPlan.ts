import { BmrSelectorEngine } from './BmrSelectorEngine';
import { RefeedingSyndromeMonitor } from '../monitors/RefeedingSyndromeMonitor';

export interface ElectrolyteStatus {
  potassium: number;
  phosphorus: number;
  magnesium: number;
}

export interface BulimiaPlanInput {
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female';
  mealFrequency: number;
  bingeFrequency: number;
  purgingFrequency: number;
  electrolytes: ElectrolyteStatus | null;
}

export interface ElectrolyteSchedule {
  potassium: { frequency: string; target: string };
  phosphorus: { frequency: string; target: string };
  magnesium: { frequency: string; target: string };
}

export interface EcgMonitoring {
  mandatory: boolean;
  timing: string;
  reason: string;
}

export interface Titration {
  initial: number;
  increase: number;
  frequency: string;
  target: string;
}

export interface BulimiaPlanResult {
  targetCalories: number;
  mealFrequency: number;
  snackFrequency: number;
  regularitySchedule: string;
  isSafe: boolean;
  errorCode?: string;
  message?: string;
  ree?: number;
  riskTier?: string;
  electrolyteSchedule?: ElectrolyteSchedule;
  ecgMonitoring?: EcgMonitoring;
  titration?: Titration;
}

export class BulimiaNutritionalPlan {
  static calculate(input: BulimiaPlanInput): BulimiaPlanResult {
    const { age, weight, height, gender, mealFrequency, bingeFrequency, purgingFrequency, electrolytes } = input;

    if (
      isNaN(age) || isNaN(weight) || isNaN(height) ||
      isNaN(mealFrequency) || isNaN(bingeFrequency) || isNaN(purgingFrequency) ||
      age <= 0 || weight <= 0 || height <= 0
    ) {
      return {
        targetCalories: 0,
        mealFrequency: 3,
        snackFrequency: 0,
        regularitySchedule: '',
        isSafe: false,
        errorCode: 'INVALID_INPUT',
        message: 'العمر والوزن والطول يجب أن تكون موجبة',
      };
    }

    if (!electrolytes) {
      return {
        targetCalories: 0,
        mealFrequency: 3,
        snackFrequency: 0,
        regularitySchedule: '',
        isSafe: false,
        errorCode: 'MISSING_ELECTROLYTES',
        message: '⚠️ Electrolytes مطلوبة قبل تحديد السعرات. Potassium و Phosphorus و Magnesium يجب قياسها.',
      };
    }

    const refeedInput = {
      serumPhosphorus: electrolytes.phosphorus,
      serumPotassium: electrolytes.potassium,
      serumMagnesium: electrolytes.magnesium,
      daysOfStarvationOrSevereMalnutrition: Math.max(mealFrequency <= 1 ? 10 : purgingFrequency >= 5 ? 7 : 3, 0),
      plannedInitialCalories: 1000,
      weightKg: weight,
    };

    const refeedResult = RefeedingSyndromeMonitor.evaluateRefeedingRisk(refeedInput);

    if (refeedResult.riskTier === 'critical') {
      return {
        targetCalories: 0,
        mealFrequency: 3,
        snackFrequency: 0,
        regularitySchedule: '',
        isSafe: false,
        errorCode: 'HIGH_REFEEDING_RISK',
        riskTier: 'critical',
        message: '⚠️ خطر Refeeding Syndrome عالي. Electrolytes مطلوبة قبل البدء.',
        electrolyteSchedule: {
          potassium: { frequency: 'قبل كل دفعة غذائية', target: '3.5-5.0 mmol/L' },
          phosphorus: { frequency: '2-3 مرات/أسبوع', target: '0.8-1.5 mmol/L' },
          magnesium: { frequency: '2-3 مرات/أسبوع', target: '1.7-2.2 mg/dL' },
        },
      };
    }

    const ree = BmrSelectorEngine.calculate({
      weightKg: weight,
      heightCm: height,
      age,
      gender,
      population: 'standard',
    });

    if (!ree.isSafe) {
      return {
        targetCalories: 0,
        mealFrequency: 3,
        snackFrequency: 0,
        regularitySchedule: '',
        isSafe: false,
        errorCode: 'BMR_ERROR',
        message: '⚠️ خطأ في حساب معدل الأيض الأساسي',
      };
    }

    const targetCalories = Math.round(ree.ree * 1.2);

    const regularitySchedule = 'وجبة كل 2-3 ساعات: 3 وجبات رئيسية + 3 وجبات خفيفة، بدون تخطي';

    return {
      targetCalories,
      mealFrequency: 3,
      snackFrequency: 3,
      regularitySchedule,
      isSafe: true,
      ree: ree.ree,
      riskTier: refeedResult.riskTier,
      electrolyteSchedule: {
        potassium: { frequency: 'قبل كل دفعة غذائية', target: '3.5-5.0 mmol/L' },
        phosphorus: { frequency: '2-3 مرات/أسبوع', target: '0.8-1.5 mmol/L' },
        magnesium: { frequency: '2-3 مرات/أسبوع', target: '1.7-2.2 mg/dL' },
      },
      ecgMonitoring: {
        mandatory: true,
        timing: 'قبل البدء + يوم 7',
        reason: 'Cardiac arrhythmia خطر في Bulimia',
      },
      titration: {
        initial: targetCalories,
        increase: 200,
        frequency: 'every 3-4 days',
        target: '0.5kg/week weight gain',
      },
    };
  }
}
