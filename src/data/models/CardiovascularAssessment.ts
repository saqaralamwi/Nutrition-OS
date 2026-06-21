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
  @field('heart_rate') heartRate!: number;
  @field('has_dyspnea') hasDyspnea!: boolean;
  @field('has_orthopnea') hasOrthopnea!: boolean;
  @field('dash_low_sodium') dashLowSodium!: boolean;
  @field('dash_low_saturated_fat') dashLowSaturatedFat!: boolean;
  @field('dash_fruit_veg') dashFruitVeg!: boolean;
  @field('dash_whole_grains') dashWholeGrains!: boolean;
  @field('dash_lean_protein') dashLeanProtein!: boolean;
  @field('dash_low_sugar') dashLowSugar!: boolean;
  @field('dash_moderate_alcohol') dashModerateAlcohol!: boolean;
  @field('dash_daily_exercise') dashDailyExercise!: boolean;
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
      heartRate: this.heartRate,
      hasDyspnea: this.hasDyspnea,
      hasOrthopnea: this.hasOrthopnea,
      dashLowSodium: this.dashLowSodium,
      dashLowSaturatedFat: this.dashLowSaturatedFat,
      dashFruitVeg: this.dashFruitVeg,
      dashWholeGrains: this.dashWholeGrains,
      dashLeanProtein: this.dashLeanProtein,
      dashLowSugar: this.dashLowSugar,
      dashModerateAlcohol: this.dashModerateAlcohol,
      dashDailyExercise: this.dashDailyExercise,
      recordedAt: this.recordedAt?.getTime() ?? Date.now(),
    };
  }
}
