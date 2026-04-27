import { stripMdxSyntax } from "@/lib/mdx-utils";

const WORDS_PER_MINUTE = 200;

export type ReadingTime = {
  words: number;
  minutes: number;
};

/**
 * Estimate reading time from raw MDX content.
 * Strips MDX/JSX/markdown syntax first so word count reflects prose only.
 * Minimum returned value is 1 minute.
 */
export function getReadingTime(content: string): ReadingTime {
  const text = stripMdxSyntax(content);
  const words = text.length === 0 ? 0 : text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return { words, minutes };
}
