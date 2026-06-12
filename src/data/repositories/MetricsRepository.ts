import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database';
import CalculationModel from '../models/Calculation';
import { PatientMetrics, BmiCategory } from '../../domain/entities/PatientMetrics';
import { IMetricsRepository } from '../../domain/repositories/IMetricsRepository';

const categoryLabels: Record<string, string> = {
  underweight: 'نقص وزن', normal: 'وزن طبيعي', overweight: 'وزن زائد', obese: 'سمنة',
};
const categoryNotes: Record<string, string> = {
  underweight: 'نقص وزن - ينصح بزيادة السعرات',
  normal: 'وزن صحي',
  overweight: 'زيادة وزن - ينصح بتقليل السعرات',
  obese: 'سمنة - ينصح ببرنامج غذائي',
};

export class MetricsRepository implements IMetricsRepository {
  async save(metrics: PatientMetrics): Promise<string> {
    const db = await getDatabase();
    const result = await db.write(async () => {
      const collection = db.get<CalculationModel>('calculations');
      return collection.create((record) => {
        record.calculationType = 'body_metrics';
        record.formulaName = metrics.bmr.formulaName;
        record.inputValues = JSON.stringify({
          weightKg: metrics.weightKg,
          heightCm: metrics.heightCm,
          bmi: metrics.bmi,
          bmr: metrics.bmr,
          tdee: metrics.tdee,
        });
        record.resultValue = metrics.tdee.value;
        record.isOverridden = false;
      });
    });
    return result.id;
  }

  async getByPatientId(patientId: string): Promise<PatientMetrics | null> {
    const db = await getDatabase();
    const results = await db.get<CalculationModel>('calculations')
      .query(
        Q.where('patient_id', patientId),
        Q.where('calculation_type', 'body_metrics'),
        Q.sortBy('created_at', 'desc'),
      )
      .fetch();
    if (results.length === 0) return null;

    const calc = results[0];
    const inputs = JSON.parse(calc.inputValues || '{}');
    const bmiValue = inputs.bmi?.value || 0;
    const bmiCategory = (inputs.bmi?.category || 'normal') as BmiCategory;

    return {
      id: calc.id,
      patientId,
      weightKg: inputs.weightKg || 0,
      heightCm: inputs.heightCm || 0,
      bmi: {
        value: bmiValue,
        category: bmiCategory,
        categoryLabel: categoryLabels[bmiCategory] || '',
        clinicalNote: categoryNotes[bmiCategory] || '',
      },
      bmr: {
        value: inputs.bmr?.value || 0,
        formulaName: calc.formulaName,
        description: inputs.bmr?.description || '',
      },
      tdee: {
        value: calc.resultValue,
        activityMultiplier: inputs.tdee?.activityMultiplier || 1.2,
        activityLabel: inputs.tdee?.activityLabel || '',
      },
      createdAt: calc.createdAt?.toISOString(),
    };
  }

  async getLatestByPatientId(patientId: string): Promise<PatientMetrics | null> {
    return this.getByPatientId(patientId);
  }
}
