import { SITE_AUTHOR } from '@/consts';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/blog/` directory.
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      author: z.string().default(SITE_AUTHOR),
      tags: z.array(z.string()).optional(),
      // Transform string to Date object
      pubDate: z.coerce.date(),
      heroImage: z.optional(image()),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
