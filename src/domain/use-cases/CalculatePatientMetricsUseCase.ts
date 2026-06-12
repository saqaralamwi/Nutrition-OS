import { CalculationRepository } from '../../data/repositories/CalculationRepository';
import { CalculationResult } from '../entities/Calculation';
import { calculateBmi } from '../calculators/BmiCalculator';
import { calculateBmr } from '../calculators/BmrCalculator';
import { calculateBmrHarris } from '../calculators/BmrHarrisCalculator';
import { calculateBmrWho } from '../calculators/BmrWhoCalculator';
import { calculateTotalEnergy } from '../calculators/TotalEnergyCalculator';
import { calculateMacros } from '../calculators/MacronutrientCalculator';
import { calculateFluidRequirement } from '../calculators/FluidCalculator';
import { calculateIbw } from '../calculators/IbwCalculator';
import { calculateAbw } from '../calculators/AbwCalculator';

export interface CalculateMetricsInput {
  patientId: string;
  weightKg: number;
  heightCm: number;
  age: number;
  isMale: boolean;
  activityLevel: string;
  stressFactor?: number;
  fluidMethod?: 'simplified' | 'holliday_segar';
}

export class CalculatePatientMetricsUseCase {
  private repo = new CalculationRepository();

  async execute(input: CalculateMetricsInput): Promise<CalculationResult[]> {
    const { patientId, weightKg, heightCm, age, isMale, activityLevel, stressFactor, fluidMethod } = input;
    const results: CalculationResult[] = [];

    // 1. BMI
    const bmi = calculateBmi(weightKg, heightCm);
    results.push({
      patientId,
      calculationType: 'bmi',
      formulaName: 'BMI',
      inputValues: { weightKg, heightCm },
      resultValue: bmi.value,
      steps: [
        { label: 'الوزن', value: `${weightKg} كجم` },
        { label: 'الطول', value: `${heightCm} سم` },
        { label: 'مؤشر كتلة الجسم', value: bmi.value.toFixed(2) },
        { label: 'التصنيف', value: bmi.categoryLabel },
      ],
    });

    // 2. BMR Mifflin-St Jeor
    const bmrMifflin = calculateBmr(weightKg, heightCm, age, isMale);
    results.push({
      patientId,
      calculationType: 'bmr_mifflin',
      formulaName: 'Mifflin-St Jeor',
      inputValues: { weightKg, heightCm, age, isMale },
      resultValue: bmrMifflin.value,
      steps: [
        { label: 'المعادلة', value: bmrMifflin.description },
        { label: 'معدل الأيض الأساسي', value: `${bmrMifflin.value} سعرة/يوم` },
      ],
    });

    // 3. BMR Harris-Benedict
    const bmrHarris = calculateBmrHarris(weightKg, heightCm, age, isMale);
    results.push({
      patientId,
      calculationType: 'bmr_harris',
      formulaName: 'Harris-Benedict',
      inputValues: { weightKg, heightCm, age, isMale },
      resultValue: bmrHarris.value,
      steps: bmrHarris.steps,
    });

    // 4. BMR WHO
    const bmrWho = calculateBmrWho(weightKg, age, isMale);
    results.push({
      patientId,
      calculationType: 'bmr_who',
      formulaName: 'WHO',
      inputValues: { weightKg, age, isMale },
      resultValue: bmrWho.value,
      steps: bmrWho.steps,
    });

    // 5. Total Energy (TDEE + stress)
    const sf = stressFactor ?? 1.0;
    const totalEnergy = calculateTotalEnergy(bmrMifflin.value, activityLevel, sf);
    results.push({
      patientId,
      calculationType: 'total_energy',
      formulaName: 'الطاقة الكلية',
      inputValues: { bmr: bmrMifflin.value, activityLevel, stressFactor: sf },
      resultValue: totalEnergy.value,
      steps: totalEnergy.steps,
    });

    // 6. Macronutrients
    const macros = calculateMacros(totalEnergy.value, weightKg);
    results.push({
      patientId,
      calculationType: 'macros',
      formulaName: 'المغذيات الكبرى',
      inputValues: { totalCalories: totalEnergy.value, weightKg },
      resultValue: totalEnergy.value,
      steps: [
        { label: 'السعرات الكلية', value: `${totalEnergy.value} سعرة` },
        { label: 'البروتين', value: `${macros.proteinGrams} غم (${macros.proteinCalories} سعرة)` },
        { label: 'الكربوهيدرات', value: `${macros.carbsGrams} غم (${macros.carbsCalories} سعرة)` },
        { label: 'الدهون', value: `${macros.fatGrams} غم (${macros.fatCalories} سعرة)` },
      ],
    });

    // 7. Fluids
    const fluids = calculateFluidRequirement(weightKg, fluidMethod);
    results.push({
      patientId,
      calculationType: 'fluid',
      formulaName: fluids.formulaName,
      inputValues: { weightKg, method: fluidMethod ?? 'simplified' },
      resultValue: fluids.value,
      steps: fluids.steps,
    });

    // 8. IBW
    const ibw = calculateIbw(heightCm, isMale);
    results.push({
      patientId,
      calculationType: 'ibw',
      formulaName: ibw.formulaName,
      inputValues: { heightCm, isMale },
      resultValue: ibw.value,
      steps: ibw.steps,
    });

    // 9. ABW (only if actual > IBW)
    const abw = calculateAbw(weightKg, ibw.value);
    if (abw) {
      results.push({
        patientId,
        calculationType: 'abw',
        formulaName: abw.formulaName,
        inputValues: { actualWeight: weightKg, ibw: ibw.value },
        resultValue: abw.value,
        steps: abw.steps,
      });
    }

    // Save all to DB
    await this.repo.upsertBatch(results);

    return results;
  }
}
