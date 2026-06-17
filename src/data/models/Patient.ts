import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';
import DischargeSummary from './DischargeSummary';
import MealPlan from './MealPlan';
import NutritionalPlan from './NutritionalPlan';
import ICUAdmission from './ICUAdmission';
import VitalsRecord from './VitalsRecord';
import PediatricGrowthChart from './PediatricGrowthChart';
import ClinicalAlert from './ClinicalAlert';
import ClinicalRecommendation from './ClinicalRecommendation';
import PatientFoodLog from './PatientFoodLog';
import PatientGlucoseLog from './PatientGlucoseLog';
import PatientWeightLog from './PatientWeightLog';
import PatientMedicationLog from './PatientMedicationLog';
import PatientAppointment from './PatientAppointment';
import PatientEducationContent from './PatientEducationContent';
import FhirNutritionOrder from './FhirNutritionOrder';
import FhirNutritionStatus from './FhirNutritionStatus';
import CgmDatum from './CgmDatum';
import WearableDatum from './WearableDatum';
import SmartScaleDatum from './SmartScaleDatum';
import GeneticProfile from './GeneticProfile';
import ElectrolyteMonitoring from './ElectrolyteMonitoring';

export default class Patient extends Model {
  static table = 'patients';

  static associations = {
    social_histories: { type: 'has_many' as const, foreignKey: 'patient_id' },
    medical_histories: { type: 'has_many' as const, foreignKey: 'patient_id' },
    medications: { type: 'has_many' as const, foreignKey: 'patient_id' },
    supplements: { type: 'has_many' as const, foreignKey: 'patient_id' },
    lab_results: { type: 'has_many' as const, foreignKey: 'patient_id' },
    physical_exam_items: { type: 'has_many' as const, foreignKey: 'patient_id' },
    calculations: { type: 'has_many' as const, foreignKey: 'patient_id' },
    interventions: { type: 'has_many' as const, foreignKey: 'patient_id' },
    follow_up_visits: { type: 'has_many' as const, foreignKey: 'patient_id' },
    attachments: { type: 'has_many' as const, foreignKey: 'patient_id' },
    discharge_summaries: { type: 'has_many' as const, foreignKey: 'patient_id' },
    meal_plans: { type: 'has_many' as const, foreignKey: 'patient_id' },
    nutritional_plans: { type: 'has_many' as const, foreignKey: 'patient_id' },
    icu_admissions: { type: 'has_many' as const, foreignKey: 'patient_id' },
    vitals_records: { type: 'has_many' as const, foreignKey: 'patient_id' },
    pediatric_growth_charts: { type: 'has_many' as const, foreignKey: 'patient_id' },
    pediatric_malnutrition_criteria: { type: 'has_many' as const, foreignKey: 'patient_id' },
    stamp_pediatric_screenings: { type: 'has_many' as const, foreignKey: 'patient_id' },
    clinical_alerts: { type: 'has_many' as const, foreignKey: 'patient_id' },
    clinical_recommendations: { type: 'has_many' as const, foreignKey: 'patient_id' },
    patient_food_logs: { type: 'has_many' as const, foreignKey: 'patient_id' },
    patient_glucose_logs: { type: 'has_many' as const, foreignKey: 'patient_id' },
    patient_weight_logs: { type: 'has_many' as const, foreignKey: 'patient_id' },
    patient_medication_logs: { type: 'has_many' as const, foreignKey: 'patient_id' },
    patient_appointments: { type: 'has_many' as const, foreignKey: 'patient_id' },
    patient_education_content: { type: 'has_many' as const, foreignKey: 'patient_id' },
    fhir_nutrition_orders: { type: 'has_many' as const, foreignKey: 'patient_id' },
    fhir_nutrition_statuses: { type: 'has_many' as const, foreignKey: 'patient_id' },
    cgm_data: { type: 'has_many' as const, foreignKey: 'patient_id' },
    wearable_data: { type: 'has_many' as const, foreignKey: 'patient_id' },
    smart_scale_data: { type: 'has_many' as const, foreignKey: 'patient_id' },
    genetic_profiles: { type: 'has_many' as const, foreignKey: 'patient_id' },
    electrolyte_monitorings: { type: 'has_many' as const, foreignKey: 'patient_id' },
  };

  @field('file_number') fileNumber!: string;
  @field('full_name') fullName!: string;
  @field('age') age!: number;
  @field('date_of_birth') dateOfBirth!: string;
  @field('gender') gender!: string;
  @field('national_id') nationalId!: string;
  @field('nationality') nationality!: string;
  @field('phone_number') phoneNumber!: string;
  @field('department') department!: string;
  @field('bed_number') bedNumber!: string;
  @date('admission_date') admissionDate!: Date;
  @field('referring_physician') referringPhysician!: string;
  @field('primary_diagnosis') primaryDiagnosis!: string;
  @field('patient_type') patientType!: string;
  @field('status') status!: string;
  @field('notes') notes!: string;
  @field('incomplete_sections') incompleteSections!: string;
  @field('name') name?: string;
  @field('name_ar') nameAr?: string;
  @field('birth_date') birthDate?: string;
  @field('blood_type') bloodType?: string;
  @field('clinical_tags') clinicalTags?: string;
  @field('clinical_tags_ar') clinicalTagsAr?: string;
  @field('mrn') mrn?: string;
  @field('phone_ar') phoneAr?: string;
  @field('address') address?: string;
  @field('address_ar') addressAr?: string;
  @field('occupation') occupation?: string;
  @field('occupation_ar') occupationAr?: string;
  @field('education') education?: string;
  @field('education_ar') educationAr?: string;
  @field('marital_status') maritalStatus?: string;
  @field('religion') religion?: string;
  @field('created_by') createdBy?: string;
  @date('deleted_at') deletedAt?: Date;

  @children('discharge_summaries') dischargeSummaries?: DischargeSummary[];
  @children('meal_plans') mealPlans?: MealPlan[];
  @children('nutritional_plans') nutritionalPlans?: NutritionalPlan[];
  @children('icu_admissions') icuAdmissions?: ICUAdmission[];
  @children('vitals_records') vitalsRecords?: VitalsRecord[];
  @children('pediatric_growth_charts') pediatricGrowthCharts?: PediatricGrowthChart[];
  @children('clinical_alerts') clinicalAlerts?: ClinicalAlert[];
  @children('clinical_recommendations') clinicalRecommendations?: ClinicalRecommendation[];
  @children('patient_food_logs') patientFoodLogs?: PatientFoodLog[];
  @children('patient_glucose_logs') patientGlucoseLogs?: PatientGlucoseLog[];
  @children('patient_weight_logs') patientWeightLogs?: PatientWeightLog[];
  @children('patient_medication_logs') patientMedicationLogs?: PatientMedicationLog[];
  @children('patient_appointments') patientAppointments?: PatientAppointment[];
  @children('patient_education_content') patientEducationContent?: PatientEducationContent[];
  @children('fhir_nutrition_orders') fhirNutritionOrders?: FhirNutritionOrder[];
  @children('fhir_nutrition_statuses') fhirNutritionStatuses?: FhirNutritionStatus[];
  @children('cgm_data') cgmData?: CgmDatum[];
  @children('wearable_data') wearableData?: WearableDatum[];
  @children('smart_scale_data') smartScaleData?: SmartScaleDatum[];
  @children('genetic_profiles') geneticProfiles?: GeneticProfile[];
  @children('electrolyte_monitorings') electrolyteMonitorings?: ElectrolyteMonitoring[];

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
