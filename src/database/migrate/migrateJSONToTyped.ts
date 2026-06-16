import { getDatabase } from '../../data/database';
import CalculationModel from '../../data/models/Calculation';

/**
 * Migration: Convert JSON input_values/result_values to Typed Columns.
 * Iterates through all existing calculation entries, parses their input JSON,
 * and updates flat columns inside a transaction.
 */
export async function migrateJSONToTyped(): Promise<{
  migrated: number;
  errors: number;
}> {
  let migrated = 0;
  let errors = 0;

  try {
    const db = await getDatabase();
    const calculations = await db.get<CalculationModel>('calculations').query().fetch();

    await db.write(async () => {
      for (const calc of calculations) {
        try {
          const inputValues = JSON.parse(calc.inputValues || '{}');
          const resultValue = calc.resultValue || 0;

          await calc.update((r) => {
            r.inputWeightKg = inputValues.weightKg ?? inputValues.weight_kg ?? inputValues.actualWeight ?? 0;
            r.inputHeightCm = inputValues.heightCm ?? inputValues.height_cm ?? 0;
            r.inputAge = inputValues.age ?? 0;
            r.inputGender = inputValues.isMale !== undefined ? (inputValues.isMale ? 'male' : 'female') : (inputValues.gender || '');
            r.inputBmi = inputValues.bmi ?? (r.inputWeightKg && r.inputHeightCm ? r.inputWeightKg / Math.pow(r.inputHeightCm / 100, 2) : 0);
            
            let act = 1.2;
            if (inputValues.activityLevel) {
              if (inputValues.activityLevel === 'bed_rest') act = 1.1;
              else if (inputValues.activityLevel === 'ambulatory') act = 1.2;
              else act = parseFloat(inputValues.activityLevel) || 1.2;
            } else if (inputValues.activityFactor) {
              act = inputValues.activityFactor;
            }
            r.inputActivityFactor = act;
            r.inputStressFactor = inputValues.stressFactor ?? inputValues.stress_factor ?? inputValues.injuryFactor ?? 1.0;

            r.resultTee = calc.calculationType === 'total_energy' || calc.calculationType === 'tee' ? resultValue : 0;
            r.resultRee = inputValues.bmr ?? inputValues.ree ?? 0;
            r.resultProteinG = inputValues.proteinTarget ?? inputValues.protein_g ?? 0;
            r.resultCarbsG = inputValues.carbsTarget ?? inputValues.carbs_g ?? 0;
            r.resultFatG = inputValues.fatTarget ?? inputValues.fat_g ?? 0;
            r.resultFluidMl = inputValues.fluidTarget ?? inputValues.fluid_ml ?? 0;
            r.resultCalories = resultValue;
            r.createdBy = r.createdBy || 'system';
          });

          migrated++;
        } catch (error) {
          console.error(`Failed to migrate calculation ${calc.id}:`, error);
          errors++;
        }
      }
    });
  } catch (dbError) {
    console.error('Migration failed to initialize:', dbError);
    errors++;
  }

  return { migrated, errors };
}
