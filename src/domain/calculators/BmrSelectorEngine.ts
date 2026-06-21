import { calculateBmr } from './BmrCalculator';
import { calculateBmrHarris } from './BmrHarrisCalculator';
import { calculateBmrWho } from './BmrWhoCalculator';

export type ClinicalPopulation = 'standard' | 'chronic_disease' | 'icu_ventilated' | 'elderly' | 'pediatric';

export interface IBmrSelectorInput {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: 'male' | 'female';
  population: ClinicalPopulation;
  isObese?: boolean;
  minuteVentilationLMin?: number;
  maxTemperatureCelsius?: number;
}

export interface IBmrSelectorResult {
  ree: number;
  formulaName: string;
  description: string;
  isSafe: boolean;
  arabicLabel: string;
}

const r2 = (v: number): number => parseFloat(v.toFixed(2));

export class BmrSelectorEngine {
  public static calculate(input: IBmrSelectorInput): IBmrSelectorResult {
    const { weightKg, heightCm, age, gender, population, isObese } = input;

    if (isNaN(weightKg) || isNaN(heightCm) || isNaN(age) || weightKg <= 0 || heightCm <= 0 || age <= 0) {
      return {
        ree: 0,
        formulaName: 'none',
        description: '',
        isSafe: false,
        arabicLabel: 'الرجاء إدخال قيم صحيحة للوزن والطول والعمر',
      };
    }

    switch (population) {
      case 'pediatric': {
        const who = calculateBmrWho(weightKg, age, gender === 'male');
        return {
          ree: r2(who.value),
          formulaName: 'WHO (Schofield)',
          description: 'WHO/Schofield equation for pediatric',
          isSafe: true,
          arabicLabel: `WHO/Schofield: ${r2(who.value)} سعرة/يوم`,
        };
      }

      case 'elderly': {
        const who = calculateBmrWho(weightKg, age, gender === 'male');
        return {
          ree: r2(who.value),
          formulaName: 'WHO (Elderly)',
          description: 'WHO equation preferred for elderly (age > 60)',
          isSafe: true,
          arabicLabel: `WHO لكبار السن: ${r2(who.value)} سعرة/يوم`,
        };
      }

      case 'icu_ventilated': {
        const mifflin = calculateBmr(weightKg, heightCm, age, gender === 'male');
        if (isObese) {
          const ree = r2(mifflin.value * 0.71 + (input.minuteVentilationLMin || 0) * 64 + (input.maxTemperatureCelsius || 37) * 85 - 3085);
          return {
            ree,
            formulaName: 'Penn State 2010',
            description: 'Penn State 2010 for obese ICU patients',
            isSafe: true,
            arabicLabel: `Penn State 2010: ${ree} سعرة/يوم`,
          };
        }
        const ree = r2(mifflin.value * 0.96 + (input.minuteVentilationLMin || 0) * 31 + (input.maxTemperatureCelsius || 37) * 167 - 6212);
        return {
          ree,
          formulaName: 'Penn State 2003b',
          description: 'Penn State 2003b for non-obese ICU patients',
          isSafe: true,
          arabicLabel: `Penn State 2003b: ${ree} سعرة/يوم`,
        };
      }

      case 'chronic_disease': {
        const mifflin = calculateBmr(weightKg, heightCm, age, gender === 'male');
        if (isObese) {
          const ree = r2(mifflin.value);
          return {
            ree,
            formulaName: 'Mifflin-St Jeor (obese)',
            description: 'Mifflin-St Jeor preferred for chronic disease populations. Consider adjusted body weight.',
            isSafe: true,
            arabicLabel: `Mifflin-St Jeor: ${ree} سعرة/يوم`,
          };
        }
        return {
          ree: r2(mifflin.value),
          formulaName: 'Mifflin-St Jeor',
          description: 'Mifflin-St Jeor for chronic disease (liver, renal, diabetes)',
          isSafe: true,
          arabicLabel: `Mifflin-St Jeor: ${r2(mifflin.value)} سعرة/يوم`,
        };
      }

      default: {
        const mifflin = calculateBmr(weightKg, heightCm, age, gender === 'male');
        return {
          ree: r2(mifflin.value),
          formulaName: 'Mifflin-St Jeor',
          description: 'Mifflin-St Jeor standard',
          isSafe: true,
          arabicLabel: `Mifflin-St Jeor: ${r2(mifflin.value)} سعرة/يوم`,
        };
      }
    }
  }
}
