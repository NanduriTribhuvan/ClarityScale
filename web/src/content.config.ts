import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Blog content collection (Markdown). Posts live in src/content/blog/*.md.
 * Reading time is derived at render time from the body word count.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.string(),
    author: z.string().default('ClarityScale Team'),
    /** Gradient stops (brand tokens) used for the post's cover panel. */
    cover: z
      .object({
        g1: z.string(),
        g2: z.string(),
      })
      .default({ g1: 'var(--cyan)', g2: 'var(--purple)' }),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
