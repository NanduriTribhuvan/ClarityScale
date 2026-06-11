/**
 * Estimate human reading time for a block of text.
 *
 * Uses a conventional reading speed of ~200 words per minute and always
 * returns at least "1 min read" so empty or very short posts still render a
 * sensible label.
 *
 * @param text - Raw post body (Markdown is fine; words are counted loosely).
 * @returns A label like `"5 min read"`.
 */
export function readingTime(text: string): string {
  const WORDS_PER_MINUTE = 200;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}
