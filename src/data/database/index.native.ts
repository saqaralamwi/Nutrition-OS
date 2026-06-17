import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { migrations } from './migrations';
import { seedDatabase } from './seed';
import Patient from '../models/Patient';
import SocialHistory from '../models/SocialHistory';
import MedicalHistory from '../models/MedicalHistory';
import Medication from '../models/Medication';
import Supplement from '../models/Supplement';
import LaboratoryRecord from '../models/LaboratoryRecord';
import TestCatalog from '../models/TestCatalog';
import TestReferenceRange from '../models/TestReferenceRange';
import PhysicalExamItem from '../models/PhysicalExamItem';
import Calculation from '../models/Calculation';
import CalculationOverride from '../models/CalculationOverride';
import Intervention from '../models/Intervention';
import FollowUpVisit from '../models/FollowUpVisit';
import Setting from '../models/Setting';
import DischargeSummary from '../models/DischargeSummary';
import FoodItem from '../models/FoodItem';
import MealPlan from '../models/MealPlan';
import AuditLog from '../models/AuditLog';
import NutritionalPlan from '../models/NutritionalPlan';
import ICUAdmission from '../models/ICUAdmission';
import VitalsRecord from '../models/VitalsRecord';
import PediatricGrowthChart from '../models/PediatricGrowthChart';
import PediatricMalnutritionCriteria from '../models/PediatricMalnutritionCriteria';
import StampPediatricScreening from '../models/StampPediatricScreening';
import ICUPatientRecord from '../models/ICUPatientRecord';
import ICUNutritionAssessment from '../models/ICUNutritionAssessment';
import ICUPrescription from '../models/ICUPrescription';
import ICUFormula from '../models/ICUFormula';
import ICUMonitoring from '../models/ICUMonitoring';
import ICUComplication from '../models/ICUComplication';
import ICUTransition from '../models/ICUTransition';
import NutritionTemplate from '../models/NutritionTemplate';
import FoodContraindicationFilter from '../models/FoodContraindicationFilter';
import Food from '../models/Food';
import Recipe from '../models/Recipe';
import ClinicalGuideline from '../models/ClinicalGuideline';
import ClinicalAlert from '../models/ClinicalAlert';
import ClinicalRecommendation from '../models/ClinicalRecommendation';
import PatientFoodLog from '../models/PatientFoodLog';
import PatientGlucoseLog from '../models/PatientGlucoseLog';
import PatientWeightLog from '../models/PatientWeightLog';
import PatientMedicationLog from '../models/PatientMedicationLog';
import PatientAppointment from '../models/PatientAppointment';
import PatientEducationContent from '../models/PatientEducationContent';
import FhirNutritionOrder from '../models/FhirNutritionOrder';
import FhirNutritionStatus from '../models/FhirNutritionStatus';
import CgmDatum from '../models/CgmDatum';
import WearableDatum from '../models/WearableDatum';
import SmartScaleDatum from '../models/SmartScaleDatum';
import GeneticProfile from '../models/GeneticProfile';
import ElectrolyteMonitoring from '../models/ElectrolyteMonitoring';
import FileNumberCounter from '../models/FileNumberCounter';
import RenalAssessment from '../models/RenalAssessment';
import IcuCriticalAssessment from '../models/IcuCriticalAssessment';
import GastroSurgeryAssessment from '../models/GastroSurgeryAssessment';
import ClinicalAuditLog from '../models/ClinicalAuditLog';
import CardiovascularAssessment from '../models/CardiovascularAssessment';
import NutritionRequirements from '../models/NutritionRequirements';
import TherapeuticFood from '../models/TherapeuticFood';
import DrugNutrientInteraction from '../models/DrugNutrientInteraction';
import GastrointestinalAssessment from '../models/GastrointestinalAssessment';
import ClinicalPriorityMatrix from '../models/ClinicalPriorityMatrix';
import BurnAssessmentRecord from '../models/BurnAssessmentRecord';
import RespiratoryAssessmentRecord from '../models/RespiratoryAssessmentRecord';
import FoodExchange from '../models/FoodExchange';
import PatientMealPlan from '../models/PatientMealPlan';
import DietaryHistorySession from '../models/DietaryHistorySession';
import DietaryHistoryItem from '../models/DietaryHistoryItem';
import { setupAuditTriggers } from './auditTrigger';

const modelClasses = [
  Patient,
  SocialHistory,
  MedicalHistory,
  Medication,
  Supplement,
  LaboratoryRecord,
  TestCatalog,
  TestReferenceRange,
  PhysicalExamItem,
  Calculation,
  CalculationOverride,
  Intervention,
  FollowUpVisit,
  Setting,
  DischargeSummary,
  FoodItem,
  MealPlan,
  AuditLog,
  NutritionalPlan,
  ICUAdmission,
  VitalsRecord,
  PediatricGrowthChart,
  PediatricMalnutritionCriteria,
  StampPediatricScreening,
  ICUPatientRecord,
  ICUNutritionAssessment,
  ICUPrescription,
  ICUFormula,
  ICUMonitoring,
  ICUComplication,
  ICUTransition,
  NutritionTemplate,
  FoodContraindicationFilter,
  Food,
  Recipe,
  ClinicalGuideline,
  ClinicalAlert,
  ClinicalRecommendation,
  PatientFoodLog,
  PatientGlucoseLog,
  PatientWeightLog,
  PatientMedicationLog,
  PatientAppointment,
  PatientEducationContent,
  FhirNutritionOrder,
  FhirNutritionStatus,
  CgmDatum,
  WearableDatum,
  SmartScaleDatum,
  GeneticProfile,
  ElectrolyteMonitoring,
  FileNumberCounter,
  RenalAssessment,
  IcuCriticalAssessment,
  GastroSurgeryAssessment,
  ClinicalAuditLog,
  CardiovascularAssessment,
  NutritionRequirements,
  TherapeuticFood,
  DrugNutrientInteraction,
  GastrointestinalAssessment,
  ClinicalPriorityMatrix,
  BurnAssessmentRecord,
  RespiratoryAssessmentRecord,
  FoodExchange,
  PatientMealPlan,
  DietaryHistorySession,
  DietaryHistoryItem,
];

const DB_KEY = '__WATERMELONDB_NATIVE__';
let initPromise: Promise<Database> | null = null;

export async function getDatabase(): Promise<Database> {
  const cached = (globalThis as any)[DB_KEY];
  if (cached) {
    return cached;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const adapter = new SQLiteAdapter({
      dbName: 'clinical_nutrition',
      schema,
      migrations,
      jsi: true,
      onSetUpError: (error: Error) => {
        console.error('Database setup error:', error);
      },
    });

    console.log('[WatermelonDB] Initializing SQLite adapter...');

    const db = new Database({
      adapter,
      modelClasses,
    });

    setupAuditTriggers(db);

    await seedDatabase(db);

    (globalThis as any)[DB_KEY] = db;
    return db;
  })();

  return initPromise;
}

export function getDatabaseInstance(): Database | null {
  return (globalThis as any)[DB_KEY] ?? null;
}

export async function resetDatabase(): Promise<void> {
  const db = (globalThis as any)[DB_KEY];
  if (db) {
    await db.write(async () => {
      await db.unsafeResetDatabase();
    });
    delete (globalThis as any)[DB_KEY];
  }
  initPromise = null;
}
