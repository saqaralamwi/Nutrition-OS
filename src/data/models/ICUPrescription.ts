import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import ICUAdmission from './ICUAdmission';
import ICUNutritionAssessment from './ICUNutritionAssessment';
import ICUFormula from './ICUFormula';

export default class ICUPrescription extends Model {
  static table = 'icu_prescriptions';

  static associations = {
    icu_admissions: { type: 'belongs_to' as const, key: 'icu_admission_id' },
    icu_nutrition_assessments: { type: 'belongs_to' as const, key: 'icu_nutrition_assessment_id' },
    icu_formulas: { type: 'belongs_to' as const, key: 'formula_id' },
  };

  @relation('icu_admissions', 'icu_admission_id') icuAdmission?: ICUAdmission;
  @relation('icu_nutrition_assessments', 'icu_nutrition_assessment_id') icuNutritionAssessment?: ICUNutritionAssessment;
  @relation('icu_formulas', 'formula_id') formula?: ICUFormula;
  @field('icu_admission_id') icuAdmissionId!: string;
  @field('icu_nutrition_assessment_id') icuNutritionAssessmentId?: string;
  @date('prescription_date') prescriptionDate!: Date;
  @field('prescribed_by') prescribedBy!: string;
  @field('type') type!: string;
  @field('formula_name') formulaName?: string;
  @field('formula_id') formulaId?: string;
  @field('formula_name_ar') formulaNameAr?: string;
  @field('volume_ml') volumeMl?: number;
  @field('rate_ml_hr') rateMlHr?: number;
  @field('calories_kcal') caloriesKcal?: number;
  @field('protein_g') proteinG?: number;
  @field('carbs_g') carbsG?: number;
  @field('fat_g') fatG?: number;
  @field('fiber_g') fiberG?: number;
  @field('electrolytes_json') electrolytesJson?: string;
  @field('additives_json') additivesJson?: string;
  @field('status') status!: string;
  @field('status_ar') statusAr?: string;
  @date('start_time') startTime?: Date;
  @date('end_time') endTime?: Date;
  @field('reason') reason?: string;
  @field('route') route?: string;
  @field('route_ar') routeAr?: string;
  @field('feeding_method') feedingMethod?: string;
  @field('feeding_method_ar') feedingMethodAr?: string;
  @field('total_volume_ml') totalVolumeMl?: number;
  @field('duration_hours') durationHours?: number;
  @field('frequency') frequency?: string;
  @field('frequency_ar') frequencyAr?: string;
  @field('tube_type') tubeType?: string;
  @field('tube_type_ar') tubeTypeAr?: string;
  @field('tube_length') tubeLength?: number;
  @field('ppn_or_tpn') ppnOrTpn?: string;
  @field('ppn_or_tpn_ar') ppnOrTpnAr?: string;
  @field('central_access') centralAccess?: boolean;
  @field('infusion_device') infusionDevice?: string;
  @field('calories_override') caloriesOverride?: number;
  @field('protein_override') proteinOverride?: number;
  @field('fluid_override') fluidOverride?: number;
  @field('is_override') isOverride?: boolean;
  @field('instructions') instructions?: string;
  @field('instructions_ar') instructionsAr?: string;
  @field('slow_start') slowStart?: boolean;
  @field('slow_start_rate') slowStartRate?: number;
  @field('advance_plan') advancePlan?: string;
  @field('advance_plan_ar') advancePlanAr?: string;
  @date('paused_at') pausedAt?: Date;
  @field('paused_reason') pausedReason?: string;
  @field('paused_reason_ar') pausedReasonAr?: string;
  @date('prescribed_at') prescribedAt?: Date;
  @field('created_by') createdBy?: string;

  get isEN(): boolean { return this.type === 'enteral'; }
  get isPN(): boolean { return this.type === 'parenteral'; }
  get isActive(): boolean { return this.status === 'active'; }

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
