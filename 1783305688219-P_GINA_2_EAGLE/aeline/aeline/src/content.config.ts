import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Content collections. Rich-text fields are HTML strings rendered with set:html.
// Images live under /images/cms/.

const services = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/services" }),
  schema: z.object({
    name: z.string(),
    summary: z.string(),
    icon: z.string(),
    card: z.string(),
    headline: z.string(),
    subtext: z.string(),
    features: z.array(z.object({ title: z.string(), detail: z.string() })),
    quote: z.string(),
    author: z.string(),
    role: z.string(),
    avatar: z.string(),
    content: z.string(), // HTML
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/articles" }),
  schema: z.object({
    name: z.string(),
    thumbnail: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    description: z.string(),
    overview: z.string(), // HTML
  }),
});

const workers = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/workers" }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    photo: z.string(),
    summary: z.string(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
  }),
});

export const collections = { services, articles, workers };
