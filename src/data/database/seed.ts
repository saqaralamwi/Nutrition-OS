import { Database } from '@nozbe/watermelondb';
import { importSeedData } from '../../database/seed/importSeedData';
import { seedArabicFoods } from '../../domain/utils/arabicFoodSeed';
import { seedClinicalReferenceData } from '../../domain/utils/clinicalReferenceDataSeed';
import { seedFoodExchanges } from './seeds/seedFoodExchanges';
import { seedTestPatientMeals } from './seeds/seedTestPatientMeals';

const NOW = Date.now();

interface SettingSeed {
  key: string;
  value: string;
}

const SETTINGS: SettingSeed[] = [
  { key: 'user_name', value: '' },
  { key: 'user_role', value: 'dietitian' },
  { key: 'organization_name', value: '' },
  { key: 'default_language', value: 'ar' },
  { key: 'number_format', value: 'arabic' },
  { key: 'date_format', value: 'dd_mm_yyyy' },
  { key: 'default_bmr_formula', value: 'mifflin_st_jeor' },
  { key: 'default_protein_factor', value: '1.2' },
  { key: 'default_fluid_method', value: 'ml_per_kg' },
  { key: 'reference_range_preset', value: 'adult' },
  { key: 'max_attachment_size_mb', value: '10' },
  { key: 'require_override_reason', value: 'true' },
  { key: 'enable_ocr', value: 'true' },
  { key: 'enable_password_lock', value: 'false' },
  { key: 'db_version', value: '1' },
];

interface TestCatalogSeed {
  testNameAr: string;
  testNameEn: string;
  defaultUnit: string;
  defaultRangeLow: number;
  defaultRangeHigh: number;
  criticalLowFactor: number | null;
  criticalHighFactor: number | null;
  category: string;
}

const TEST_CATALOG: TestCatalogSeed[] = [
  // lipid (4)
  { testNameAr: 'كوليسترول كلي', testNameEn: 'Total Cholesterol', defaultUnit: 'mg/dL', defaultRangeLow: 0, defaultRangeHigh: 200, criticalLowFactor: null, criticalHighFactor: 1.5, category: 'lipid' },
  { testNameAr: 'كوليسترول HDL', testNameEn: 'HDL Cholesterol', defaultUnit: 'mg/dL', defaultRangeLow: 40, defaultRangeHigh: 60, criticalLowFactor: 0.5, criticalHighFactor: null, category: 'lipid' },
  { testNameAr: 'كوليسترول LDL', testNameEn: 'LDL Cholesterol', defaultUnit: 'mg/dL', defaultRangeLow: 0, defaultRangeHigh: 100, criticalLowFactor: null, criticalHighFactor: 1.9, category: 'lipid' },
  { testNameAr: 'دهون ثلاثية', testNameEn: 'Triglycerides', defaultUnit: 'mg/dL', defaultRangeLow: 0, defaultRangeHigh: 150, criticalLowFactor: null, criticalHighFactor: 3.3, category: 'lipid' },
  // glucose (4)
  { testNameAr: 'سكر صائم', testNameEn: 'Fasting Glucose', defaultUnit: 'mg/dL', defaultRangeLow: 70, defaultRangeHigh: 100, criticalLowFactor: 0.5, criticalHighFactor: 2.0, category: 'glucose' },
  { testNameAr: 'سكر فاطر', testNameEn: 'Postprandial Glucose', defaultUnit: 'mg/dL', defaultRangeLow: 70, defaultRangeHigh: 140, criticalLowFactor: null, criticalHighFactor: 1.5, category: 'glucose' },
  { testNameAr: 'هيموغلوبين سكري', testNameEn: 'HbA1c', defaultUnit: '%', defaultRangeLow: 0, defaultRangeHigh: 5.7, criticalLowFactor: null, criticalHighFactor: 2.0, category: 'glucose' },
  // electrolyte (4)
  { testNameAr: 'صوديوم', testNameEn: 'Sodium', defaultUnit: 'mmol/L', defaultRangeLow: 136, defaultRangeHigh: 145, criticalLowFactor: 0.9, criticalHighFactor: 1.1, category: 'electrolyte' },
  { testNameAr: 'بوتاسيوم', testNameEn: 'Potassium', defaultUnit: 'mmol/L', defaultRangeLow: 3.5, defaultRangeHigh: 5.1, criticalLowFactor: 0.7, criticalHighFactor: 1.3, category: 'electrolyte' },
  { testNameAr: 'كلوريد', testNameEn: 'Chloride', defaultUnit: 'mmol/L', defaultRangeLow: 98, defaultRangeHigh: 106, criticalLowFactor: 0.9, criticalHighFactor: 1.1, category: 'electrolyte' },
  { testNameAr: 'بيكربونات', testNameEn: 'Bicarbonate', defaultUnit: 'mmol/L', defaultRangeLow: 22, defaultRangeHigh: 29, criticalLowFactor: 0.7, criticalHighFactor: 1.2, category: 'electrolyte' },
  // mineral (3)
  { testNameAr: 'كالسيوم', testNameEn: 'Calcium', defaultUnit: 'mg/dL', defaultRangeLow: 8.5, defaultRangeHigh: 10.5, criticalLowFactor: 0.8, criticalHighFactor: 1.2, category: 'mineral' },
  { testNameAr: 'فوسفور', testNameEn: 'Phosphorus', defaultUnit: 'mg/dL', defaultRangeLow: 2.5, defaultRangeHigh: 4.5, criticalLowFactor: 0.6, criticalHighFactor: 1.4, category: 'mineral' },
  { testNameAr: 'مغنيسيوم', testNameEn: 'Magnesium', defaultUnit: 'mg/dL', defaultRangeLow: 1.7, defaultRangeHigh: 2.2, criticalLowFactor: 0.7, criticalHighFactor: 1.3, category: 'mineral' },
  // iron (4)
  { testNameAr: 'حديد', testNameEn: 'Iron', defaultUnit: 'µg/dL', defaultRangeLow: 50, defaultRangeHigh: 170, criticalLowFactor: 0.5, criticalHighFactor: 1.5, category: 'iron' },
  { testNameAr: 'فيريتين', testNameEn: 'Ferritin', defaultUnit: 'ng/mL', defaultRangeLow: 20, defaultRangeHigh: 250, criticalLowFactor: 0.5, criticalHighFactor: 2.0, category: 'iron' },
  { testNameAr: 'ترانسفيرين', testNameEn: 'Transferrin', defaultUnit: 'mg/dL', defaultRangeLow: 200, defaultRangeHigh: 360, criticalLowFactor: 0.6, criticalHighFactor: 1.5, category: 'iron' },
  { testNameAr: 'سعة ربط الحديد الكلية', testNameEn: 'TIBC', defaultUnit: 'µg/dL', defaultRangeLow: 250, defaultRangeHigh: 400, criticalLowFactor: null, criticalHighFactor: 1.5, category: 'iron' },
  // protein (3)
  { testNameAr: 'ألبومين', testNameEn: 'Albumin', defaultUnit: 'g/dL', defaultRangeLow: 3.5, defaultRangeHigh: 5.0, criticalLowFactor: 0.7, criticalHighFactor: null, category: 'protein' },
  { testNameAr: 'بري-ألبومين', testNameEn: 'Prealbumin', defaultUnit: 'mg/dL', defaultRangeLow: 15, defaultRangeHigh: 36, criticalLowFactor: 0.5, criticalHighFactor: null, category: 'protein' },
  { testNameAr: 'بروتين كلي', testNameEn: 'Total Protein', defaultUnit: 'g/dL', defaultRangeLow: 6.0, defaultRangeHigh: 8.0, criticalLowFactor: 0.7, criticalHighFactor: 1.2, category: 'protein' },
  // inflammatory (2)
  { testNameAr: 'بروتين متفاعل C', testNameEn: 'C-Reactive Protein', defaultUnit: 'mg/L', defaultRangeLow: 0, defaultRangeHigh: 5, criticalLowFactor: null, criticalHighFactor: 4.0, category: 'inflammatory' },
  { testNameAr: 'سرعة ترسيب الدم', testNameEn: 'ESR', defaultUnit: 'mm/hr', defaultRangeLow: 0, defaultRangeHigh: 20, criticalLowFactor: null, criticalHighFactor: 3.0, category: 'inflammatory' },
  // renal (3)
  { testNameAr: 'يوريا', testNameEn: 'Urea', defaultUnit: 'mg/dL', defaultRangeLow: 7, defaultRangeHigh: 20, criticalLowFactor: null, criticalHighFactor: 3.0, category: 'renal' },
  { testNameAr: 'كرياتينين', testNameEn: 'Creatinine', defaultUnit: 'mg/dL', defaultRangeLow: 0.7, defaultRangeHigh: 1.2, criticalLowFactor: null, criticalHighFactor: 3.0, category: 'renal' },
  { testNameAr: 'نيتروجين يوريا الدم', testNameEn: 'BUN', defaultUnit: 'mg/dL', defaultRangeLow: 7, defaultRangeHigh: 20, criticalLowFactor: null, criticalHighFactor: 3.0, category: 'renal' },
  // hepatic (6)
  { testNameAr: 'ناقلة أمين الأسبارتات', testNameEn: 'AST (SGOT)', defaultUnit: 'U/L', defaultRangeLow: 10, defaultRangeHigh: 40, criticalLowFactor: null, criticalHighFactor: 5.0, category: 'hepatic' },
  { testNameAr: 'ناقلة أمين الألانين', testNameEn: 'ALT (SGPT)', defaultUnit: 'U/L', defaultRangeLow: 7, defaultRangeHigh: 56, criticalLowFactor: null, criticalHighFactor: 5.0, category: 'hepatic' },
  { testNameAr: 'فوسفاتاز قلوية', testNameEn: 'ALP', defaultUnit: 'U/L', defaultRangeLow: 44, defaultRangeHigh: 147, criticalLowFactor: null, criticalHighFactor: 3.0, category: 'hepatic' },
  { testNameAr: 'جاما جلوتاميل ترانسفيراز', testNameEn: 'GGT', defaultUnit: 'U/L', defaultRangeLow: 8, defaultRangeHigh: 61, criticalLowFactor: null, criticalHighFactor: 4.0, category: 'hepatic' },
  { testNameAr: 'بيليروبين كلي', testNameEn: 'Total Bilirubin', defaultUnit: 'mg/dL', defaultRangeLow: 0.1, defaultRangeHigh: 1.2, criticalLowFactor: null, criticalHighFactor: 4.0, category: 'hepatic' },
  { testNameAr: 'بيليروبين مباشر', testNameEn: 'Direct Bilirubin', defaultUnit: 'mg/dL', defaultRangeLow: 0, defaultRangeHigh: 0.3, criticalLowFactor: null, criticalHighFactor: 5.0, category: 'hepatic' },
  // cbc (4)
  { testNameAr: 'هيموغلوبين', testNameEn: 'Hemoglobin', defaultUnit: 'g/dL', defaultRangeLow: 13, defaultRangeHigh: 17, criticalLowFactor: 0.6, criticalHighFactor: 1.3, category: 'cbc' },
  { testNameAr: 'كريات دم بيضاء', testNameEn: 'WBC', defaultUnit: 'x10³/µL', defaultRangeLow: 4.0, defaultRangeHigh: 11.0, criticalLowFactor: 0.5, criticalHighFactor: 3.0, category: 'cbc' },
  { testNameAr: 'صفائح دموية', testNameEn: 'Platelets', defaultUnit: 'x10³/µL', defaultRangeLow: 150, defaultRangeHigh: 400, criticalLowFactor: 0.3, criticalHighFactor: 2.0, category: 'cbc' },
  { testNameAr: 'هيماتوكريت', testNameEn: 'Hematocrit', defaultUnit: '%', defaultRangeLow: 40, defaultRangeHigh: 50, criticalLowFactor: 0.7, criticalHighFactor: 1.2, category: 'cbc' },
  // urinalysis (10)
  { testNameAr: 'لون البول', testNameEn: 'Urine Color', defaultUnit: '', defaultRangeLow: 0, defaultRangeHigh: 0, criticalLowFactor: null, criticalHighFactor: null, category: 'urinalysis' },
  { testNameAr: 'بول - عكورة', testNameEn: 'Urine Turbidity', defaultUnit: '', defaultRangeLow: 0, defaultRangeHigh: 0, criticalLowFactor: null, criticalHighFactor: null, category: 'urinalysis' },
  { testNameAr: 'بول - كثافة نوعية', testNameEn: 'Urine Specific Gravity', defaultUnit: '', defaultRangeLow: 1.005, defaultRangeHigh: 1.030, criticalLowFactor: null, criticalHighFactor: null, category: 'urinalysis' },
  { testNameAr: 'بول - pH', testNameEn: 'Urine pH', defaultUnit: '', defaultRangeLow: 4.5, defaultRangeHigh: 8.0, criticalLowFactor: null, criticalHighFactor: null, category: 'urinalysis' },
  { testNameAr: 'بول - بروتين', testNameEn: 'Urine Protein', defaultUnit: 'mg/dL', defaultRangeLow: 0, defaultRangeHigh: 15, criticalLowFactor: null, criticalHighFactor: 3.0, category: 'urinalysis' },
  { testNameAr: 'بول - جلوكوز', testNameEn: 'Urine Glucose', defaultUnit: 'mg/dL', defaultRangeLow: 0, defaultRangeHigh: 0, criticalLowFactor: null, criticalHighFactor: null, category: 'urinalysis' },
  { testNameAr: 'بول - كيتونات', testNameEn: 'Urine Ketones', defaultUnit: 'mg/dL', defaultRangeLow: 0, defaultRangeHigh: 0, criticalLowFactor: null, criticalHighFactor: null, category: 'urinalysis' },
  { testNameAr: 'بول - بيليروبين', testNameEn: 'Urine Bilirubin', defaultUnit: '', defaultRangeLow: 0, defaultRangeHigh: 0, criticalLowFactor: null, criticalHighFactor: null, category: 'urinalysis' },
  { testNameAr: 'بول - يوروبيلينوجين', testNameEn: 'Urine Urobilinogen', defaultUnit: 'mg/dL', defaultRangeLow: 0, defaultRangeHigh: 1, criticalLowFactor: null, criticalHighFactor: 3.0, category: 'urinalysis' },
  { testNameAr: 'بول - نترات', testNameEn: 'Urine Nitrite', defaultUnit: '', defaultRangeLow: 0, defaultRangeHigh: 0, criticalLowFactor: null, criticalHighFactor: null, category: 'urinalysis' },
  // stool (2)
  { testNameAr: 'تحليل براز', testNameEn: 'Stool Analysis', defaultUnit: '', defaultRangeLow: 0, defaultRangeHigh: 0, criticalLowFactor: null, criticalHighFactor: null, category: 'stool' },
  { testNameAr: 'دم خفي في البراز', testNameEn: 'Stool Occult Blood', defaultUnit: '', defaultRangeLow: 0, defaultRangeHigh: 0, criticalLowFactor: null, criticalHighFactor: null, category: 'stool' },
  // microbiology (2)
  { testNameAr: 'مزرعة بول', testNameEn: 'Urine Culture', defaultUnit: 'CFU/mL', defaultRangeLow: 0, defaultRangeHigh: 10000, criticalLowFactor: null, criticalHighFactor: 10.0, category: 'microbiology' },
  { testNameAr: 'مزرعة وحساسية', testNameEn: 'Culture & Sensitivity', defaultUnit: '', defaultRangeLow: 0, defaultRangeHigh: 0, criticalLowFactor: null, criticalHighFactor: null, category: 'microbiology' },
  // micronutrient (6)
  { testNameAr: 'فيتامين D', testNameEn: 'Vitamin D (25-OH)', defaultUnit: 'ng/mL', defaultRangeLow: 30, defaultRangeHigh: 100, criticalLowFactor: 0.4, criticalHighFactor: 1.5, category: 'micronutrient' },
  { testNameAr: 'فيتامين B12', testNameEn: 'Vitamin B12', defaultUnit: 'pg/mL', defaultRangeLow: 200, defaultRangeHigh: 900, criticalLowFactor: 0.5, criticalHighFactor: 1.5, category: 'micronutrient' },
  { testNameAr: 'حمض الفوليك', testNameEn: 'Folic Acid', defaultUnit: 'ng/mL', defaultRangeLow: 5.0, defaultRangeHigh: 20.0, criticalLowFactor: 0.5, criticalHighFactor: null, category: 'micronutrient' },
  { testNameAr: 'هوموسيستين', testNameEn: 'Homocysteine', defaultUnit: 'µmol/L', defaultRangeLow: 5, defaultRangeHigh: 15, criticalLowFactor: null, criticalHighFactor: 2.0, category: 'micronutrient' },
  { testNameAr: 'زنك', testNameEn: 'Zinc', defaultUnit: 'µg/dL', defaultRangeLow: 70, defaultRangeHigh: 120, criticalLowFactor: 0.6, criticalHighFactor: 1.4, category: 'micronutrient' },
  { testNameAr: 'سيلينيوم', testNameEn: 'Selenium', defaultUnit: 'µg/L', defaultRangeLow: 60, defaultRangeHigh: 120, criticalLowFactor: 0.6, criticalHighFactor: 1.4, category: 'micronutrient' },
];

export async function seedDatabase(database: Database): Promise<void> {
  if (!database) return;
  if ((globalThis as any).__SKIP_SEEDING__) {
    return;
  }

  try {
    await seedArabicFoods(database);
    await importSeedData(database);
    await seedClinicalReferenceData(database);
    await seedFoodExchanges(database);
    await seedTestPatientMeals(database);

    const testCatalogCollection = database.get('test_catalog');
    const settingsCollection = database.get('settings');

    if (!testCatalogCollection || !settingsCollection) {
      console.warn('[Seed] Required collections for basic setup not found, skipping final catalog seed.');
      return;
    }

    const existingTests = await testCatalogCollection.query().fetchCount();
    if (existingTests > 0) {
      return;
    }

    await database.write(async () => {
      const testRecords = TEST_CATALOG.map((t) =>
        testCatalogCollection.prepareCreate((record: any) => {
          record.testNameAr = t.testNameAr;
          record.testNameEn = t.testNameEn;
          record.defaultUnit = t.defaultUnit;
          record.defaultRangeLow = t.defaultRangeLow;
          record.defaultRangeHigh = t.defaultRangeHigh;
          record.criticalLowFactor = t.criticalLowFactor;
          record.criticalHighFactor = t.criticalHighFactor;
          record.category = t.category;
        }),
      );

      const settingRecords = SETTINGS.map((s) =>
        settingsCollection.prepareCreate((record: any) => {
          record.key = s.key;
          record.value = s.value;
        }),
      );

      await database.batch([...testRecords, ...settingRecords]);
    });
    console.log('[Seed] Database initialization seed completed.');
  } catch (err) {
    console.error('[Seed] Database seeding encountered a failure:', err);
  }
}
