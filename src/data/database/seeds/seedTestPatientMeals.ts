import { Database } from '@nozbe/watermelondb';

const INTERVIEW_DATE = 1781654400000;

interface SessionSeed {
  patientId: string;
  interviewDate: number;
  dayType: string;
  reliabilityScore: string;
  totalComputedCalories: number;
  totalComputedProtein: number;
  totalFluidIntakeMl: number;
  recordedAt: number;
}

interface ItemSeed {
  sessionId: string;
  mealSlotType: string;
  consumptionTime: string;
  foodExchangeId: string;
  customReportedName: string;
  servingUnitUsed: string;
  servingsConsumed: number;
  derivedFluidMl: number;
  derivedCalories: number;
  derivedProtein: number;
  derivedCarbs: number;
  derivedFat: number;
}

const SESSION: SessionSeed = {
  patientId: 'test-patient-123',
  interviewDate: INTERVIEW_DATE,
  dayType: 'normal_weekday',
  reliabilityScore: 'high',
  totalComputedCalories: 825,
  totalComputedProtein: 56,
  totalFluidIntakeMl: 450,
  recordedAt: Date.now(),
};

const ITEMS: ItemSeed[] = [
  {
    sessionId: 'session-mega-test-001',
    mealSlotType: 'breakfast',
    consumptionTime: '08:15',
    foodExchangeId: 'meat_medium_egg',
    customReportedName: 'بيض مسلوق كامل',
    servingUnitUsed: 'piece',
    servingsConsumed: 2,
    derivedFluidMl: 0,
    derivedCalories: 150,
    derivedProtein: 14,
    derivedCarbs: 0,
    derivedFat: 10,
  },
  {
    sessionId: 'session-mega-test-001',
    mealSlotType: 'breakfast',
    consumptionTime: '08:30',
    foodExchangeId: 'milk_lactose_free',
    customReportedName: 'حليب بقري خالي من اللاكتوز',
    servingUnitUsed: 'cup',
    servingsConsumed: 1,
    derivedFluidMl: 250,
    derivedCalories: 90,
    derivedProtein: 8,
    derivedCarbs: 12,
    derivedFat: 0,
  },
  {
    sessionId: 'session-mega-test-001',
    mealSlotType: 'lunch',
    consumptionTime: '14:30',
    foodExchangeId: 'composite_salta',
    customReportedName: 'سلتة يمنية باللحم المفروم والحلبه',
    servingUnitUsed: 'cup',
    servingsConsumed: 1,
    derivedFluidMl: 0,
    derivedCalories: 231,
    derivedProtein: 14,
    derivedCarbs: 10,
    derivedFat: 15,
  },
  {
    sessionId: 'session-mega-test-001',
    mealSlotType: 'late_snack',
    consumptionTime: '22:45',
    foodExchangeId: 'milk_yogurt',
    customReportedName: 'زبادي طبيعي كامل الدسم',
    servingUnitUsed: 'cup',
    servingsConsumed: 1,
    derivedFluidMl: 200,
    derivedCalories: 150,
    derivedProtein: 8,
    derivedCarbs: 12,
    derivedFat: 8,
  },
];

function prepareSessionRecord(collection: any, seed: SessionSeed): any {
  return collection.prepareCreate((record: any) => {
    record._raw.patient_id = seed.patientId;
    record._raw.interview_date = seed.interviewDate;
    record._raw.day_type = seed.dayType;
    record._raw.reliability_score = seed.reliabilityScore;
    record._raw.total_computed_calories = seed.totalComputedCalories;
    record._raw.total_computed_protein = seed.totalComputedProtein;
    record._raw.total_fluid_intake_ml = seed.totalFluidIntakeMl;
    record._raw.recorded_at = seed.recordedAt;
  });
}

function prepareItemRecord(collection: any, seed: ItemSeed): any {
  return collection.prepareCreate((record: any) => {
    record._raw.session_id = seed.sessionId;
    record._raw.meal_slot_type = seed.mealSlotType;
    record._raw.consumption_time = seed.consumptionTime;
    record._raw.food_exchange_id = seed.foodExchangeId;
    record._raw.custom_reported_name = seed.customReportedName;
    record._raw.serving_unit_used = seed.servingUnitUsed;
    record._raw.servings_consumed = seed.servingsConsumed;
    record._raw.derived_fluid_ml = seed.derivedFluidMl;
    record._raw.derived_calories = seed.derivedCalories;
    record._raw.derived_protein = seed.derivedProtein;
    record._raw.derived_carbs = seed.derivedCarbs;
    record._raw.derived_fat = seed.derivedFat;
  });
}

export async function seedTestPatientMeals(database: Database): Promise<void> {
  try {
    if (!database) {
      console.warn('[seedTestPatientMeals] Database instance is null, skipping...');
      return;
    }

    // ROBUST ASYNCHRONOUS GUARD: Wait for collections to be ready
    let sessionsCollection: any = null;
    let itemsCollection: any = null;
    let retries = 0;
    const maxRetries = 50; // Total 5 seconds wait

    while (retries < maxRetries) {
      try {
        sessionsCollection = database.get('patient_dietary_history_sessions');
        itemsCollection = database.get('patient_dietary_history_items');
        if (sessionsCollection && itemsCollection) break;
      } catch (e) {
        // Collections might not be registered yet
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }

    if (!sessionsCollection || !itemsCollection) {
      console.error('[seedTestPatientMeals] Critical Error: Collections not found after waiting. Seeding aborted.');
      return;
    }

    const existingCount = await sessionsCollection.query().fetchCount();
    if (existingCount > 0) {
      console.log(`[seedTestPatientMeals] Skipping — ${existingCount} session(s) already exist.`);
      return;
    }

    console.log('[seedTestPatientMeals] Seeding test patient 24h dietary recall (1 session, 4 items)...');

    await database.write(async () => {
      const sessionRecord = prepareSessionRecord(sessionsCollection, SESSION);
      const itemRecords = ITEMS.map((item) => prepareItemRecord(itemsCollection, item));
      
      if (!sessionRecord) throw new Error('Failed to prepare session record');
      
      await database.batch([sessionRecord, ...itemRecords]);
    });

    console.log('[seedTestPatientMeals] Seeding completed.');
  } catch (error) {
    console.warn('[seedTestPatientMeals] Skipping — failed to seed test patient meals:', error);
  }
}
