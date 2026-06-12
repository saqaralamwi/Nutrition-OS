import { AiGenerateInput, AiGenerateResult, AiPlan, AI_MODEL_DEFAULT } from '../../domain/entities/AiPlan';
import { IAiRepository } from '../../domain/repositories/IAiRepository';
import { buildPrompt } from './PromptBuilder';
import { parseAiResponse, AiResponseParseError } from './ResponseParser';
import { AiCache } from './AiCache';

export class AiApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'AiApiError';
  }
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 45000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAiRequest {
  model: string;
  messages: OpenAiMessage[];
  temperature: number;
  max_tokens: number;
}

interface OpenAiResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  model: string;
}

function isRetryableError(statusCode: number): boolean {
  return (
    statusCode === 429 ||
    statusCode === 500 ||
    statusCode === 502 ||
    statusCode === 503
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AiService implements IAiRepository {
  private apiKey: string;
  private model: string;
  private cache: AiCache;

  constructor(apiKey: string, model: string = AI_MODEL_DEFAULT) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new AiApiError('مفتاح API غير صالح');
    }
    if (!apiKey.startsWith('sk-')) {
      throw new AiApiError('مفتاح API يجب أن يبدأ بـ sk-');
    }
    this.apiKey = apiKey;
    this.model = model;
    this.cache = new AiCache();
  }

  getCachedPlan(input: AiGenerateInput): AiPlan | null {
    return this.cache.get(input);
  }

  clearCache(): void {
    this.cache.clear();
  }

  async generatePlan(input: AiGenerateInput): Promise<AiGenerateResult> {
    const cached = this.cache.get(input);
    if (cached) {
      return {
        plan: cached,
        rawResponse: '(from cache)',
        latencyMs: 0,
      };
    }

    const { system, user } = buildPrompt(input);
    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const rawResponse = await this.callOpenAi(system, user);
        const plan = parseAiResponse(
          rawResponse,
          input.patientId,
          input.weightKg,
          this.model
        );
        plan.patientId = input.patientId;

        const lastMetrics = await this.loadLatestMetricsId(input.patientId);
        if (lastMetrics) {
          plan.patientMetricsId = lastMetrics;
        }

        this.cache.set(input, plan);

        const latencyMs = Date.now() - startTime;
        return { plan, rawResponse, latencyMs };
      } catch (e) {
        lastError = e as Error;

        if (e instanceof AiResponseParseError) {
          throw e;
        }

        if (e instanceof AiApiError && !e.isRetryable) {
          throw e;
        }

        if (attempt < MAX_RETRIES) {
          const backoffDelay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
          await delay(backoffDelay);
        }
      }
    }

    throw (
      lastError ||
      new AiApiError('فشل الاتصال بخدمة الذكاء الاصطناعي بعد 3 محاولات')
    );
  }

  private async callOpenAi(systemPrompt: string, userPrompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const body: OpenAiRequest = {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      };

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const status = response.status;
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch {}

        if (status === 401) {
          throw new AiApiError('مفتاح API غير صالح. يرجى التحقق من المفتاح.', status, false);
        }
        if (status === 429) {
          throw new AiApiError('تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً.', status, true);
        }
        if (status >= 500) {
          throw new AiApiError('خطأ في خادم الذكاء الاصطناعي', status, true);
        }
        throw new AiApiError(
          `خطأ في الاتصال (${status}): ${errorBody.substring(0, 200)}`,
          status,
          isRetryableError(status)
        );
      }

      const data = (await response.json()) as OpenAiResponse;

      if (!data.choices?.[0]?.message?.content) {
        throw new AiApiError('استجابة فارغة من الذكاء الاصطناعي', undefined, true);
      }

      return data.choices[0].message.content;
    } catch (e) {
      if (e instanceof AiApiError) throw e;
      if (e instanceof DOMException && e.name === 'AbortError') {
        throw new AiApiError('انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.', undefined, true);
      }
      throw new AiApiError(
        'فشل الاتصال بخدمة الذكاء الاصطناعي. تحقق من اتصال الإنترنت.',
        undefined,
        true
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async loadLatestMetricsId(patientId: string): Promise<string | null> {
    return null;
  }
}
