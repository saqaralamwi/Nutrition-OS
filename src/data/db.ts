import { Database } from '@nozbe/watermelondb';
import { schema } from './database/schema';
import { migrations } from './database/migrations';
import { seedDatabase } from './database/seed';
import { setupAuditTriggers } from './database/auditTrigger';

import { PatientModel } from './models/CoreModels';
import { VitalsRecordModel } from './models/CoreModels';
import { NutritionalPlanModel } from './models/CoreModels';
import { FileNumberCounterModel } from './models/CoreModels';
import { NutritionRequirementsModel } from './models/CoreModels';

import { PediatricGrowthChartModel } from './models/PediatricModels';
import { PediatricMalnutritionCriterionModel } from './models/PediatricModels';
import { StampPediatricScreeningModel } from './models/PediatricModels';

import { ICUAdmissionModel } from './models/ICUModels';
import { ICUPatientRecordModel } from './models/ICUModels';
import { ICUNutritionAssessmentModel } from './models/ICUModels';
import { ICUPrescriptionModel } from './models/ICUModels';
import { ICUFormulaModel } from './models/ICUModels';
import { ICUMonitoringModel } from './models/ICUModels';
import { ICUComplicationModel } from './models/ICUModels';
import { ICUTransitionModel } from './models/ICUModels';

import { NutritionTemplateModel } from './models/SpecializedModels';
import { FoodContraindicationFilterModel } from './models/SpecializedModels';
import { TherapeuticFoodModel } from './models/SpecializedModels';
import { DrugNutrientInteractionModel } from './models/SpecializedModels';

import { FoodModel } from './models/FoodModels';
import { RecipeModel } from './models/FoodModels';

import { ClinicalGuidelineModel } from './models/CDSSModels';
import { ClinicalAlertModel } from './models/CDSSModels';
import { ClinicalRecommendationModel } from './models/CDSSModels';

import { PatientFoodLogModel } from './models/PatientAppModels';
import { PatientGlucoseLogModel } from './models/PatientAppModels';
import { PatientWeightLogModel } from './models/PatientAppModels';
import { PatientMedicationLogModel } from './models/PatientAppModels';
import { PatientAppointmentModel } from './models/PatientAppModels';
import { PatientEducationContentModel } from './models/PatientAppModels';

import { FHIRNutritionOrderModel } from './models/FHIRWearablesModels';
import { FHIRNutritionStatusModel } from './models/FHIRWearablesModels';
import { CGMDataModel } from './models/FHIRWearablesModels';
import { WearableDataModel } from './models/FHIRWearablesModels';
import { SmartScaleDataModel } from './models/FHIRWearablesModels';
import { GeneticProfileModel } from './models/FHIRWearablesModels';
import RenalAssessment from './models/RenalAssessment';
import IcuCriticalAssessment from './models/IcuCriticalAssessment';
import ClinicalAuditLog from './models/ClinicalAuditLog';
import CardiovascularAssessment from './models/CardiovascularAssessment';

const modelClasses = [
  PatientModel,
  VitalsRecordModel,
  NutritionalPlanModel,
  FileNumberCounterModel,
  NutritionRequirementsModel,
  PediatricGrowthChartModel,
  PediatricMalnutritionCriterionModel,
  StampPediatricScreeningModel,
  ICUAdmissionModel,
  ICUPatientRecordModel,
  ICUNutritionAssessmentModel,
  ICUPrescriptionModel,
  ICUFormulaModel,
  ICUMonitoringModel,
  ICUComplicationModel,
  ICUTransitionModel,
  NutritionTemplateModel,
  FoodContraindicationFilterModel,
  FoodModel,
  RecipeModel,
  ClinicalGuidelineModel,
  ClinicalAlertModel,
  ClinicalRecommendationModel,
  PatientFoodLogModel,
  PatientGlucoseLogModel,
  PatientWeightLogModel,
  PatientMedicationLogModel,
  PatientAppointmentModel,
  PatientEducationContentModel,
  FHIRNutritionOrderModel,
  FHIRNutritionStatusModel,
  CGMDataModel,
  WearableDataModel,
  SmartScaleDataModel,
  GeneticProfileModel,
  RenalAssessment,
  IcuCriticalAssessment,
  ClinicalAuditLog,
  CardiovascularAssessment,
  TherapeuticFoodModel,
  DrugNutrientInteractionModel,
];

const DB_KEY = '__WATERMELONDB_ADCN__';

export async function initializeDB(): Promise<Database> {
  const cached = (globalThis as any)[DB_KEY];
  if (cached) {
    return cached;
  }

  const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

  let adapter: any;

  if (isWeb) {
    const LokiJSAdapter = (await import('@nozbe/watermelondb/adapters/lokijs')).default;
    adapter = new LokiJSAdapter({
      dbName: 'adcn-nutrition-os',
      schema,
      migrations,
      useWebWorker: false,
      useIncrementalIndexedDB: true,
    });
  } else {
    const SQLiteAdapter = (await import('@nozbe/watermelondb/adapters/sqlite')).default;
    adapter = new SQLiteAdapter({
      dbName: 'adcn-nutrition-os',
      schema,
      migrations,
      jsi: true,
      onSetUpError: (error: Error) => {
        console.error('Database setup error:', error);
      },
    });
  }

  setupAuditTriggers();

  const db = new Database({
    adapter,
    modelClasses,
  });

  await seedDatabase(db);

  (globalThis as any)[DB_KEY] = db;

  console.log(`WatermelonDB initialized: ${modelClasses.length} models`);

  return db;
}

export function getDatabaseInstance(): Database | null {
  return (globalThis as any)[DB_KEY] ?? null;
}

export async function resetDatabase(): Promise<void> {
  const db = (globalThis as any)[DB_KEY];
  if (db) {
    await db.unsafeResetDatabase();
    delete (globalThis as any)[DB_KEY];
  }
}
