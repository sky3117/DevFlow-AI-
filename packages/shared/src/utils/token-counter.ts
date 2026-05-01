/**
 * Estimates the number of tokens in a text string.
 * Uses a simple approximation: ~4 characters per token for English text.
 * This is a rough estimate and may not match exact Claude tokenization.
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Splits text into chunks that fit within a token limit
 */
export function splitIntoChunks(text: string, maxTokensPerChunk: number): string[] {
  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk: string[] = [];
  let currentTokens = 0;

  for (const line of lines) {
    const lineTokens = estimateTokenCount(line);
    if (currentTokens + lineTokens > maxTokensPerChunk && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'));
      currentChunk = [line];
      currentTokens = lineTokens;
    } else {
      currentChunk.push(line);
      currentTokens += lineTokens;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }

  return chunks;
}

/**
 * Checks if text fits within a token limit
 */
export function fitsInTokenLimit(text: string, maxTokens: number): boolean {
  return estimateTokenCount(text) <= maxTokens;
}

export const TOKEN_LIMITS = {
  CLAUDE_CONTEXT_WINDOW: 200_000,
  MAX_OUTPUT_TOKENS: 4096,
  SAFE_INPUT_TOKENS: 150_000,
  CHUNK_SIZE: 50_000,
} as const;
