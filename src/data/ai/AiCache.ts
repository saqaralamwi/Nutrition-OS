import { AiGenerateInput, AiPlan } from '../../domain/entities/AiPlan';

interface CacheEntry {
  plan: AiPlan;
  timestamp: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 50;

function buildCacheKey(input: AiGenerateInput): string {
  const data = `${input.patientId}|${input.age}|${input.gender}|${input.weightKg}|${input.heightCm}|${input.diagnosis}|${input.activityLevel}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const chr = data.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash.toString();
}

export class AiCache {
  get(input: AiGenerateInput): AiPlan | null {
    const key = buildCacheKey(input);
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
      return null;
    }
    return entry.plan;
  }

  set(input: AiGenerateInput, plan: AiPlan): void {
    if (cache.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    const key = buildCacheKey(input);
    cache.set(key, { plan, timestamp: Date.now() });
  }

  clear(): void {
    cache.clear();
  }
}
