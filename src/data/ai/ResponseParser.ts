import { AiPlan, AiMealSuggestion, AI_DISCLAIMER, AI_MODEL_DEFAULT } from '../../domain/entities/AiPlan';

export class AiResponseParseError extends Error {
  constructor(
    message: string,
    public readonly rawResponse: string,
    public readonly parseAttempts: number = 1
  ) {
    super(message);
    this.name = 'AiResponseParseError';
  }
}

interface RawAiResponse {
  totalCalories?: number;
  calorieAdjustment?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  mealPlan?: Array<{
    meal?: string;
    foods?: string[];
    calories?: number;
  }>;
  recommendations?: string[];
  restrictions?: string[];
  clinicalNotes?: string;
}

function sanitizeNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && !isNaN(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) return Math.round(parsed);
  }
  return fallback;
}

function sanitizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }
  return [];
}

function sanitizeMealPlan(value: unknown): AiMealSuggestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      meal: typeof item.meal === 'string' ? item.meal : 'وجبة',
      foods: Array.isArray(item.foods)
        ? item.foods.filter((f: unknown): f is string => typeof f === 'string')
        : [],
      calories: sanitizeNumber(item.calories, 0) || undefined,
    }))
    .filter((meal) => meal.foods.length > 0);
}

function validatePlan(parsed: RawAiResponse, weightKg: number): void {
  const maxSafeCalories = weightKg * 50;
  const minSafeCalories = 800;

  if (parsed.totalCalories && parsed.totalCalories > maxSafeCalories) {
    parsed.totalCalories = maxSafeCalories;
  }
  if (parsed.totalCalories && parsed.totalCalories < minSafeCalories) {
    parsed.totalCalories = minSafeCalories;
  }
  if (parsed.proteinGrams && parsed.proteinGrams > weightKg * 3) {
    parsed.proteinGrams = Math.round(weightKg * 1.5);
  }
  if (parsed.fatGrams && parsed.fatGrams > parsed.totalCalories! / 9) {
    parsed.fatGrams = Math.round((parsed.totalCalories! * 0.25) / 9);
  }
}

export function parseAiResponse(
  rawJson: string,
  patientId: string,
  weightKg: number,
  model: string = AI_MODEL_DEFAULT
): AiPlan {
  let parsed: RawAiResponse | null = null;
  let parseAttempts = 0;

  const tryParse = (text: string): RawAiResponse | null => {
    try {
      const cleaned = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*$/g, '')
        .trim();
      return JSON.parse(cleaned) as RawAiResponse;
    } catch {
      return null;
    }
  };

  parsed = tryParse(rawJson);
  parseAttempts++;

  if (!parsed) {
    const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = tryParse(jsonMatch[0]);
      parseAttempts++;
    }
  }

  if (!parsed) {
    throw new AiResponseParseError(
      'فشل تحليل استجابة الذكاء الاصطناعي',
      rawJson,
      parseAttempts
    );
  }

  validatePlan(parsed, weightKg);

  const totalCalories = sanitizeNumber(parsed.totalCalories, 2000);
  const proteinGrams = sanitizeNumber(parsed.proteinGrams, Math.round(weightKg * 1.2));
  const carbsGrams = sanitizeNumber(parsed.carbsGrams, Math.round(totalCalories * 0.55 / 4));
  const fatGrams = sanitizeNumber(parsed.fatGrams, Math.round(totalCalories * 0.25 / 9));

  const proteinCalories = proteinGrams * 4;
  const carbsCalories = carbsGrams * 4;
  const fatCalories = fatGrams * 9;

  return {
    patientId,
    patientMetricsId: '',
    // NutritionPlan required fields (mapped from AI output)
    targetCalories: totalCalories,
    proteinTarget: proteinGrams,
    carbsTarget: carbsGrams,
    fatTarget: fatGrams,
    fluidTarget: 2000,
    mealsJson: JSON.stringify(sanitizeMealPlan(parsed.mealPlan)),
    recommendationsJson: JSON.stringify(sanitizeStringArray(parsed.recommendations)),
    // AI-specific output fields
    totalCalories,
    calorieAdjustment: sanitizeNumber(parsed.calorieAdjustment, 0),
    macros: {
      proteinGrams,
      proteinCalories,
      carbsGrams,
      carbsCalories,
      fatGrams,
      fatCalories,
    },
    mealPlan: sanitizeMealPlan(parsed.mealPlan),
    recommendations: sanitizeStringArray(parsed.recommendations),
    restrictions: sanitizeStringArray(parsed.restrictions),
    clinicalNotes: typeof parsed.clinicalNotes === 'string' ? parsed.clinicalNotes : undefined,
    aiGenerated: true as const,
    model,
    disclaimer: AI_DISCLAIMER,
  };
}
