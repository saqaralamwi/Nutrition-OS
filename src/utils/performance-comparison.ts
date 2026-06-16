/**
 * Benchmark utility to compare JSON parsing overhead vs direct flat column reads.
 */
export interface PerformanceBenchmarkResult {
  recordCount: number;
  iterations: number;
  jsonParsingTimeMs: number;
  flatColumnsTimeMs: number;
  speedupPercentage: number;
}

export function runPerformanceComparison(
  mockRecords: Array<{
    inputValues: string;
    inputWeightKg?: number;
    inputGender?: string;
  }>,
  iterations: number = 1000
): PerformanceBenchmarkResult {
  const recordCount = mockRecords.length;
  if (recordCount === 0) {
    return {
      recordCount: 0,
      iterations,
      jsonParsingTimeMs: 0,
      flatColumnsTimeMs: 0,
      speedupPercentage: 0,
    };
  }

  // 1. Benchmark legacy JSON parsing approach
  const startJson = performance.now();
  for (let i = 0; i < iterations; i++) {
    for (let j = 0; j < recordCount; j++) {
      const record = mockRecords[j];
      const parsed = JSON.parse(record.inputValues || '{}');
      const weight = parsed.weightKg ?? parsed.weight_kg ?? parsed.actualWeight ?? 0;
      const gender = parsed.gender ?? '';
      // Prevent compiler optimization of unused variables
      if (weight === -1 && gender === 'never') {
        console.log(weight, gender);
      }
    }
  }
  const endJson = performance.now();
  const jsonParsingTimeMs = endJson - startJson;

  // 2. Benchmark direct flat column read approach
  const startFlat = performance.now();
  for (let i = 0; i < iterations; i++) {
    for (let j = 0; j < recordCount; j++) {
      const record = mockRecords[j];
      const weight = record.inputWeightKg ?? 0;
      const gender = record.inputGender ?? '';
      // Prevent compiler optimization of unused variables
      if (weight === -1 && gender === 'never') {
        console.log(weight, gender);
      }
    }
  }
  const endFlat = performance.now();
  const flatColumnsTimeMs = endFlat - startFlat;

  // Calculate speedup percentage
  // If flat columns time is 0 (extremely fast), prevent division by zero
  const divisor = flatColumnsTimeMs > 0 ? flatColumnsTimeMs : 0.001;
  const speedupPercentage = ((jsonParsingTimeMs - flatColumnsTimeMs) / divisor) * 100;

  return {
    recordCount,
    iterations,
    jsonParsingTimeMs: Math.round(jsonParsingTimeMs * 100) / 100,
    flatColumnsTimeMs: Math.round(flatColumnsTimeMs * 100) / 100,
    speedupPercentage: Math.round(speedupPercentage * 10) / 10,
  };
}
