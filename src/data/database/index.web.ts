import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from './schema';
import { migrations } from './migrations';
import { seedDatabase } from './seed';
import Patient from '../models/Patient';
import SocialHistory from '../models/SocialHistory';
import MedicalHistory from '../models/MedicalHistory';
import Medication from '../models/Medication';
import Supplement from '../models/Supplement';
import LabResult from '../models/LabResult';
import TestCatalog from '../models/TestCatalog';
import TestReferenceRange from '../models/TestReferenceRange';
import PhysicalExamItem from '../models/PhysicalExamItem';
import Calculation from '../models/Calculation';
import CalculationOverride from '../models/CalculationOverride';
import Intervention from '../models/Intervention';
import FollowUpVisit from '../models/FollowUpVisit';
import Setting from '../models/Setting';
import LaboratoryRecord from '../models/LaboratoryRecord';
import DischargeSummary from '../models/DischargeSummary';
import FoodItem from '../models/FoodItem';
import MealPlan from '../models/MealPlan';
import AuditLog from '../models/AuditLog';
import { setupAuditTriggers } from './auditTrigger';

const modelClasses = [
  Patient,
  SocialHistory,
  MedicalHistory,
  Medication,
  Supplement,
  LabResult,
  TestCatalog,
  TestReferenceRange,
  PhysicalExamItem,
  Calculation,
  CalculationOverride,
  Intervention,
  FollowUpVisit,
  Setting,
  LaboratoryRecord,
  DischargeSummary,
  FoodItem,
  MealPlan,
  AuditLog,
];

const DB_KEY = '__WATERMELONDB_WEB__';

export async function getDatabase(): Promise<Database> {
  const cached = (globalThis as any)[DB_KEY];
  if (cached) {
    return cached;
  }

  const adapter = new LokiJSAdapter({
    dbName: 'clinical_nutrition',
    schema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
  });

  console.log('[WatermelonDB] Initializing LokiJS adapter for web...');

  setupAuditTriggers();

  const db = new Database({
    adapter,
    modelClasses,
  });

  await seedDatabase(db);

  (globalThis as any)[DB_KEY] = db;

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
