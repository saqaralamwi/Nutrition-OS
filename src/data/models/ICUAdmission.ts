import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children, relation } from '@nozbe/watermelondb/decorators';
import Patient from './Patient';
import ICUPatientRecord from './ICUPatientRecord';
import ICUNutritionAssessment from './ICUNutritionAssessment';
import ICUPrescription from './ICUPrescription';
import ICUMonitoring from './ICUMonitoring';
import ICUComplication from './ICUComplication';
import ICUTransition from './ICUTransition';

export default class ICUAdmission extends Model {
  static table = 'icu_admissions';

  static associations = {
    patients: { type: 'belongs_to' as const, key: 'patient_id' },
    icu_patient_records: { type: 'has_many' as const, foreignKey: 'icu_admission_id' },
    icu_nutrition_assessments: { type: 'has_many' as const, foreignKey: 'icu_admission_id' },
    icu_prescriptions: { type: 'has_many' as const, foreignKey: 'icu_admission_id' },
    icu_monitorings: { type: 'has_many' as const, foreignKey: 'icu_admission_id' },
    icu_complications: { type: 'has_many' as const, foreignKey: 'icu_admission_id' },
    icu_transitions: { type: 'has_many' as const, foreignKey: 'icu_admission_id' },
  };

  @relation('patients', 'patient_id') patient?: Patient;
  @field('patient_id') patientId!: string;
  @field('full_name') fullName!: string;
  @field('full_name_ar') fullNameAr!: string;
  @field('age') age!: number;
  @field('gender') gender!: string;
  @field('weight_kg') weightKg!: number;
  @field('height_cm') heightCm!: number;
  @field('bmi') bmi!: number;
  @field('mrn') mrn!: string;
  @date('admission_date') admissionDate!: Date;
  @field('admission_source') admissionSource!: string;
  @field('admission_source_ar') admissionSourceAr?: string;
  @field('icu_type') icuType!: string;
  @field('icu_type_ar') icuTypeAr?: string;
  @field('primary_diagnosis') primaryDiagnosis!: string;
  @field('primary_diagnosis_ar') primaryDiagnosisAr!: string;
  @field('secondary_diagnoses') secondaryDiagnoses?: string;
  @field('secondary_diagnoses_ar') secondaryDiagnosesAr?: string;
  @field('apache_ii_score') apacheIIScore?: number;
  @field('gcs') gcs?: number;
  @field('severity_level') severityLevel!: string;
  @field('severity_level_ar') severityLevelAr?: string;
  @field('heart_rate') heartRate?: number;
  @field('bp_systolic') bpSystolic?: number;
  @field('bp_diastolic') bpDiastolic?: number;
  @field('respiratory_rate') respiratoryRate?: number;
  @field('temperature') temperature?: number;
  @field('o2_sat') o2Sat?: number;
  @field('oxygen_therapy') oxygenTherapy!: string;
  @field('oxygen_therapy_ar') oxygenTherapyAr?: string;
  @field('ventilator_type') ventilatorType?: string;
  @field('ventilator_type_ar') ventilatorTypeAr?: string;
  @field('pre_admission_weight_kg') preAdmissionWeightKg?: number;
  @field('weight_change_kg') weightChangeKg?: number;
  @field('weight_change_percent') weightChangePercent?: number;
  @field('appetite_before_admission') appetiteBeforeAdmission!: string;
  @field('appetite_before_admission_ar') appetiteBeforeAdmissionAr?: string;
  @field('eating_difficulty') eatingDifficulty!: string;
  @field('eating_difficulty_ar') eatingDifficultyAr?: string;
  @field('npo_status') npoStatus!: boolean;
  @field('npo_duration') npoDuration?: string;
  @field('previous_nutrition_support') previousNutritionSupport!: string;
  @field('previous_nutrition_support_ar') previousNutritionSupportAr?: string;
  @field('has_diabetes') hasDiabetes!: boolean;
  @field('diabetes_type') diabetesType?: string;
  @field('diabetes_type_ar') diabetesTypeAr?: string;
  @field('diabetes_control') diabetesControl?: string;
  @field('diabetes_control_ar') diabetesControlAr?: string;
  @field('has_cardiovascular') hasCardiovascular!: boolean;
  @field('cardiovascular_type') cardiovascularType?: string;
  @field('cardiovascular_type_ar') cardiovascularTypeAr?: string;
  @field('has_kidney') hasKidney!: boolean;
  @field('kidney_stage') kidneyStage?: string;
  @field('kidney_stage_ar') kidneyStageAr?: string;
  @field('has_liver') hasLiver!: boolean;
  @field('liver_type') liverType?: string;
  @field('liver_type_ar') liverTypeAr?: string;
  @field('has_lung') hasLung!: boolean;
  @field('lung_type') lungType?: string;
  @field('lung_type_ar') lungTypeAr?: string;
  @field('has_gi') hasGI!: boolean;
  @field('gi_type') giType?: string;
  @field('gi_type_ar') giTypeAr?: string;
  @field('has_cancer') hasCancer!: boolean;
  @field('cancer_type') cancerType?: string;
  @field('cancer_stage') cancerStage?: string;
  @field('allergies') allergies?: string;
  @field('allergies_ar') allergiesAr?: string;
  @field('previous_surgeries') previousSurgeries?: string;
  @field('previous_surgeries_ar') previousSurgeriesAr?: string;
  @field('medications') medications?: string;
  @field('medications_ar') medicationsAr?: string;
  @field('hemoglobin') hemoglobin?: number;
  @field('wbc') wbc?: number;
  @field('platelets') platelets?: number;
  @field('creatinine') creatinine?: number;
  @field('bun') bun?: number;
  @field('egfr') eGFR?: number;
  @field('sodium') sodium?: number;
  @field('potassium') potassium?: number;
  @field('chloride') chloride?: number;
  @field('glucose') glucose?: number;
  @field('hba1c') hba1c?: number;
  @field('total_protein') totalProtein?: number;
  @field('albumin') albumin?: number;
  @field('total_bilirubin') totalBilirubin?: number;
  @field('alt') alt?: number;
  @field('ast') ast?: number;
  @field('triglycerides') triglycerides?: number;
  @field('cholesterol') cholesterol?: number;
  @field('stamp_score') stampScore?: number;
  @field('malnutrition_risk') malnutritionRisk?: string;
  @field('malnutrition_risk_ar') malnutritionRiskAr?: string;
  @field('nutrition_concern') nutritionConcern!: boolean;
  @field('admission_reason') admissionReason!: string;
  @field('admission_reason_ar') admissionReasonAr!: string;
  @field('special_concerns') specialConcerns?: string;
  @field('special_concerns_ar') specialConcernsAr?: string;
  @field('physician_notes') physicianNotes?: string;
  @field('physician_notes_ar') physicianNotesAr?: string;
  @field('dietitian_notes') dietitianNotes?: string;
  @field('dietitian_notes_ar') dietitianNotesAr?: string;
  @field('nutrition_consent') nutritionConsent!: boolean;
  @field('guardian_consent') guardianConsent?: boolean;
  @field('signed_by') signedBy?: string;
  @date('consent_date') consentDate?: Date;
  @field('created_by') createdBy!: string;
  @field('is_transferred_to_icu') isTransferredToICU!: boolean;
  @date('transferred_at') transferredAt?: Date;

  get bmiCategory(): string {
    if (this.bmi < 18.5) return 'underweight';
    if (this.bmi < 25) return 'normal';
    if (this.bmi < 30) return 'overweight';
    return 'obese';
  }

  @children('icu_patient_records') icuPatientRecords?: ICUPatientRecord[];
  @children('icu_nutrition_assessments') icuNutritionAssessments?: ICUNutritionAssessment[];
  @children('icu_prescriptions') icuPrescriptions?: ICUPrescription[];
  @children('icu_monitorings') icuMonitorings?: ICUMonitoring[];
  @children('icu_complications') icuComplications?: ICUComplication[];
  @children('icu_transitions') icuTransitions?: ICUTransition[];

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
