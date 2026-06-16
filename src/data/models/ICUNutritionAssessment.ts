import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import ICUAdmission from './ICUAdmission';
import ICUPatientRecord from './ICUPatientRecord';

export default class ICUNutritionAssessment extends Model {
  static table = 'icu_nutrition_assessments';

  static associations = {
    icu_admissions: { type: 'belongs_to' as const, key: 'icu_admission_id' },
    icu_patient_records: { type: 'belongs_to' as const, key: 'icu_patient_record_id' },
  };

  @relation('icu_admissions', 'icu_admission_id') icuAdmission?: ICUAdmission;
  @relation('icu_patient_records', 'icu_patient_record_id') icuPatientRecord?: ICUPatientRecord;
  @field('icu_admission_id') icuAdmissionId!: string;
  @field('icu_patient_record_id') icuPatientRecordId?: string;
  @date('assessment_date') assessmentDate!: Date;
  @field('assessed_by') assessedBy!: string;
  @field('energy_requirement_kcal') energyRequirementKcal?: number;
  @field('protein_requirement_g') proteinRequirementG?: number;
  @field('route') route!: string;
  @field('nutrition_risk_score') nutritionRiskScore?: number;
  @field('nrs_2002_score') nrs2002Score?: number;
  @field('nutric_score') nutricScore?: number;
  @field('malnutrition_diagnosis') malnutritionDiagnosis?: string;
  @field('recommendations') recommendations?: string;
  @field('energy_kcal') energyKcal?: number;
  @field('protein_g') proteinG?: number;
  @field('protein_g_per_kg') proteinGPerKg?: number;
  @field('fluid_ml') fluidMl?: number;
  @field('carbs_g') carbsG?: number;
  @field('carbs_percent') carbsPercent?: number;
  @field('fat_g') fatG?: number;
  @field('fat_percent') fatPercent?: number;
  @field('fiber_g') fiberG?: number;
  @field('stress_factor') stressFactor?: number;
  @field('stress_level') stressLevel?: string;
  @field('stress_level_ar') stressLevelAr?: string;
  @field('ventilation_status') ventilationStatus?: string;
  @field('ventilation_status_ar') ventilationStatusAr?: string;
  @field('burn_status') burnStatus?: boolean;
  @field('burn_percent') burnPercent?: number;
  @field('trauma_status') traumaStatus?: boolean;
  @field('trauma_type') traumaType?: string;
  @field('kidney_status') kidneyStatus?: string;
  @field('kidney_status_ar') kidneyStatusAr?: string;
  @field('liver_status') liverStatus?: string;
  @field('liver_status_ar') liverStatusAr?: string;
  @field('diabetes_status') diabetesStatus?: string;
  @field('diabetes_status_ar') diabetesStatusAr?: string;
  @date('assessed_at') assessedAt?: Date;
  @field('created_by') createdBy?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
