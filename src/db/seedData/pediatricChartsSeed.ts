import { Database } from '@nozbe/watermelondb';

const NOW = Date.now();

interface GrowthChartSeed {
  patientId?: string;
  ageMonths: number;
  sex: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  headCircumferenceCm?: number;
  weightZScore: number;
  heightZScore: number;
  weightForHeightZ: number;
  bmiZScore: number;
  whoPercentile: number;
}

const WHO_GROWTH_STANDARDS: GrowthChartSeed[] = [
  // Boys 0-24 months (simplified WHO standards)
  { ageMonths: 0, sex: 'male', weightKg: 3.5, heightCm: 50, headCircumferenceCm: 35, weightZScore: 0, heightZScore: 0, weightForHeightZ: 0, bmiZScore: 0, whoPercentile: 50 },
  { ageMonths: 1, sex: 'male', weightKg: 4.5, heightCm: 55, headCircumferenceCm: 37, weightZScore: 0, heightZScore: 0, weightForHeightZ: 0.1, bmiZScore: 0, whoPercentile: 50 },
  { ageMonths: 3, sex: 'male', weightKg: 6.0, heightCm: 62, headCircumferenceCm: 41, weightZScore: 0.1, heightZScore: 0, weightForHeightZ: 0, bmiZScore: 0, whoPercentile: 55 },
  { ageMonths: 6, sex: 'male', weightKg: 7.8, heightCm: 68, headCircumferenceCm: 44, weightZScore: 0, heightZScore: 0, weightForHeightZ: 0, bmiZScore: 0, whoPercentile: 50 },
  { ageMonths: 9, sex: 'male', weightKg: 9.0, heightCm: 72, headCircumferenceCm: 46, weightZScore: 0, heightZScore: 0, weightForHeightZ: 0, bmiZScore: 0, whoPercentile: 50 },
  { ageMonths: 12, sex: 'male', weightKg: 10.0, heightCm: 76, headCircumferenceCm: 47, weightZScore: 0, heightZScore: 0, weightForHeightZ: 0, bmiZScore: 0, whoPercentile: 50 },
  { ageMonths: 18, sex: 'male', weightKg: 11.5, heightCm: 82, headCircumferenceCm: 48, weightZScore: 0, heightZScore: 0, weightForHeightZ: 0, bmiZScore: 0, whoPercentile: 50 },
  { ageMonths: 24, sex: 'male', weightKg: 12.5, heightCm: 87, headCircumferenceCm: 49, weightZScore: 0, heightZScore: 0, weightForHeightZ: 0, bmiZScore: 0, whoPercentile: 50 },
  // Girls 0-24 months
  { ageMonths: 0, sex: 'female', weightKg: 3.4, heightCm: 49, headCircumferenceCm: 34, weightZScore: 0, heightZScore: 0, weightForHeightZ: 0, bmiZScore: 0, whoPercentile: 50 },
  { ageMonths: 1, sex: 'female', weightKg: 4.2, heightCm: 54, headCircumferenceCm: 36, weightZScore: 0, heightZScore: 0, weightForHeightZ: 0, bmiZScore: 0, whoPercentile: 50 },
  { ageMonths: 3, sex: 'female', weightKg: 5.6, heightCm: 60, headCircumferenceCm: 40, weightZScore: 0, heightZScore: 0, weightForHeightZ: 0, bmiZScore: 0, whoPercentile: 50 },
  { ageMonths: 6, sex: 'female', weightKg: 7.2, heightCm: 66, headCircumferenceCm: 43, weightZScore: 0, heightZScore: 0, weightForHeightZ: 0, bmiZScore: 0, whoPercentile: 50 },
  { ageMonths: 9, sex: 'female', weightKg: 8.4, heightCm: 70, headCircumferenceCm: 4, weightZScore: 0, heightZScore: 0, weightForHeightZ: 0, bmiZScore: 0, whoPercentile: 50 },
  { ageMonths: 12, sex: 'female', weightKg: 9.5, heightCm: 74, headCircumferenceCm: 46, weightZScore: 0, heightZScore: 0, weightForHeightZ: 0, bmiZScore: 0, whoPercentile: 50 },
  { ageMonths: 18, sex: 'female', weightKg: 10.8, heightCm: 80, headCircumferenceCm: 47, weightZScore: 0, heightZScore: 0, weightForHeightZ: 0, bmiZScore: 0, whoPercentile: 50 },
  { ageMonths: 24, sex: 'female', weightKg: 12.0, heightCm: 86, headCircumferenceCm: 48, weightZScore: 0, heightZScore: 0, weightForHeightZ: 0, bmiZScore: 0, whoPercentile: 50 },
  // Malnutrition examples (low Z-scores)
  { ageMonths: 12, sex: 'male', weightKg: 7.5, heightCm: 74, weightZScore: -2.5, heightZScore: -1.0, weightForHeightZ: -2.8, bmiZScore: -2.5, whoPercentile: 1 },
  { ageMonths: 24, sex: 'female', weightKg: 9.0, heightCm: 82, weightZScore: -2.3, heightZScore: -1.5, weightForHeightZ: -2.0, bmiZScore: -2.2, whoPercentile: 2 },
  // Obesity examples (high Z-scores)
  { ageMonths: 12, sex: 'male', weightKg: 13.0, heightCm: 78, weightZScore: 2.5, heightZScore: 0.5, weightForHeightZ: 2.8, bmiZScore: 2.6, whoPercentile: 98 },
  { ageMonths: 24, sex: 'female', weightKg: 16.0, heightCm: 88, weightZScore: 2.3, heightZScore: 0.3, weightForHeightZ: 2.5, bmiZScore: 2.4, whoPercentile: 97 },
];

export async function seedPediatricCharts(database: Database): Promise<void> {
  const existing = await database.get('pediatric_growth_charts').query().fetchCount();
  if (existing > 0) return;

  const collection = database.get('pediatric_growth_charts');

  await database.write(async () => {
    const records = WHO_GROWTH_STANDARDS.map((c) =>
      collection.prepareCreate((record: any) => {
        record.patientId = c.patientId ?? '';
        record.ageMonths = c.ageMonths;
        record.weightKg = c.weightKg;
        record.heightCm = c.heightCm;
        record.headCircumferenceCm = c.headCircumferenceCm ?? null;
        record.weightZScore = c.weightZScore;
        record.heightZScore = c.heightZScore;
        record.weightForHeightZ = c.weightForHeightZ;
        record.bmiZScore = c.bmiZScore;
        record.whoPercentile = c.whoPercentile;
        record._raw.created_at = NOW;
        record._raw.updated_at = NOW;
      }),
    );

    await database.batch(records);
  });

  console.log(`[Seed] Pediatric growth charts: ${WHO_GROWTH_STANDARDS.length} records`);
}
