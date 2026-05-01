/**
 * Estimates the number of tokens in a text string.
 * Uses a simple heuristic: ~4 characters per token (Claude average).
 * For production, use the Anthropic tokenizer or tiktoken.
 */
export function estimateTokens(text: string): number {
  // Remove extra whitespace for a more accurate estimate
  const normalized = text.replace(/\s+/g, ' ').trim();
  return Math.ceil(normalized.length / 4);
}

/**
 * Splits text into batches that fit within the token limit.
 * Splits on newlines to preserve code structure.
 */
export function batchTextByTokens(
  text: string,
  maxTokensPerBatch: number = 4000
): string[] {
  const lines = text.split('\n');
  const batches: string[] = [];
  let currentBatch: string[] = [];
  let currentTokens = 0;

  for (const line of lines) {
    const lineTokens = estimateTokens(line);

    if (currentTokens + lineTokens > maxTokensPerBatch && currentBatch.length > 0) {
      batches.push(currentBatch.join('\n'));
      currentBatch = [];
      currentTokens = 0;
    }

    currentBatch.push(line);
    currentTokens += lineTokens;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch.join('\n'));
  }

  return batches;
}

/**
 * Returns true if the text exceeds the token limit
 */
export function exceedsTokenLimit(text: string, limit: number = 100000): boolean {
  return estimateTokens(text) > limit;
}
