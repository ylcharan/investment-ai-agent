export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const LLM_TIMEOUT_MS = 60_000;

function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("429") ||
    message.includes("Too Many Requests") ||
    message.includes("quota") ||
    message.includes("Quota exceeded")
  );
}

function getRetryDelayMs(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);
  const retryMatch = message.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (retryMatch) {
    return Math.min(20_000, Math.ceil(parseFloat(retryMatch[1]) * 1000) + 500);
  }
  return 5_000;
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  ms = LLM_TIMEOUT_MS
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Request timed out after ${ms / 1000}s`)),
        ms
      )
    ),
  ]);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 1
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(fn);
    } catch (error) {
      lastError = error;
      if (!isRateLimitError(error) || attempt === maxRetries) {
        throw error;
      }
      await sleep(getRetryDelayMs(error));
    }
  }

  throw lastError;
}

export function formatGeminiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("timed out")) {
    return "Request timed out. The API may be slow or rate-limited — try again in a minute.";
  }

  if (isRateLimitError(error)) {
    return (
      "Gemini API rate limit reached. Wait a minute and try again, or set " +
      "GEMINI_MODEL=gemini-3.1-flash-lite in .env.local."
    );
  }

  if (isModelUnavailableError(error)) {
    return (
      "Gemini model unavailable. Set GEMINI_MODEL=gemini-3.5-flash " +
      "or gemini-3.1-flash-lite in .env.local."
    );
  }

  return message;
}

export function isModelUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("404") ||
    message.includes("not found") ||
    message.includes("no longer available") ||
    message.includes("is not supported")
  );
}

export function isRetryableModelError(error: unknown): boolean {
  return isRateLimitError(error) || isModelUnavailableError(error);
}

export const GEMINI_MODEL_FALLBACKS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
] as const;

export function getGeminiModels(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const models = preferred
    ? [preferred, ...GEMINI_MODEL_FALLBACKS.filter((m) => m !== preferred)]
    : [...GEMINI_MODEL_FALLBACKS];
  return [...new Set(models)];
}
