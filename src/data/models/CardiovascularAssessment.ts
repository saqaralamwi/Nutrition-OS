import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';
import type { ICardiovascularAssessment, EdemaGrading } from '../../data/types/cardiovascular';

export default class CardiovascularAssessment extends Model {
  static table = 'cardiovascular_assessments';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
  };

  @field('patient_id') patientId!: string;
  @field('systolic_blood_pressure') systolicBloodPressure!: number;
  @field('diastolic_blood_pressure') diastolicBloodPressure!: number;
  @field('total_cholesterol') totalCholesterol!: number;
  @field('ldl_cholesterol') ldlCholesterol!: number;
  @field('hdl_cholesterol') hdlCholesterol!: number;
  @field('triglycerides') triglycerides!: number;
  @field('measured_dry_weight_kg') measuredDryWeightKg!: number;
  @field('has_peripheral_edema') hasPeripheralEdema!: boolean;
  @field('edema_grading') edemaGrading!: string;
  @date('recorded_at') recordedAt!: Date;

  toDomain(): ICardiovascularAssessment {
    return {
      patientId: this.patientId,
      systolicBloodPressure: this.systolicBloodPressure,
      diastolicBloodPressure: this.diastolicBloodPressure,
      totalCholesterol: this.totalCholesterol,
      ldlCholesterol: this.ldlCholesterol,
      hdlCholesterol: this.hdlCholesterol,
      triglycerides: this.triglycerides,
      measuredDryWeightKg: this.measuredDryWeightKg,
      hasPeripheralEdema: this.hasPeripheralEdema,
      edemaGrading: this.edemaGrading as EdemaGrading,
      recordedAt: this.recordedAt?.getTime() ?? Date.now(),
    };
  }
}
