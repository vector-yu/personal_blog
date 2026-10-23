import { cache } from 'react';
import { sanitizeUrl } from '@/components/mdx/sanitize-url';
import { client } from '@/lib/tina';

export type ProjectItem = {
  title: string;
  year: string;
  role: string;
  summary: string;
  stack: string[];
  image: string | null;
  link: string | null;
  repo: string | null;
  featured: boolean;
};

export type ProjectsContent = {
  intro: string;
  items: ProjectItem[];
};

export const PROJECTS_RELATIVE_PATH = 'projects.json';

export const DEFAULT_PROJECTS: ProjectsContent = {
  intro: '做过的一些东西。',
  items: [],
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item): item is string => item.length > 0);
}

export function normaliseProjects(value: unknown): ProjectsContent {
  const record = asRecord(value);
  const items = Array.isArray(record.items) ? record.items : [];

  return {
    intro: asText(record.intro) || DEFAULT_PROJECTS.intro,
    items: items
      .map((entry) => {
        const item = asRecord(entry);
        const title = asText(item.title);
        return {
          title,
          year: asText(item.year),
          role: asText(item.role),
          summary: asText(item.summary),
          stack: asStringList(item.stack),
          image: sanitizeUrl(asText(item.image)) ?? null,
          link: sanitizeUrl(asText(item.link)) ?? null,
          repo: sanitizeUrl(asText(item.repo)) ?? null,
          featured: item.featured === true,
        };
      })
      .filter((item) => item.title.length > 0),
  };
}

export const getProjects = cache(async (): Promise<ProjectsContent> => {
  try {
    const { data } = await client.queries.project({ relativePath: PROJECTS_RELATIVE_PATH });
    return normaliseProjects(data?.project);
  } catch (error) {
    console.error('Failed to load the projects document:', error);
    return DEFAULT_PROJECTS;
  }
});
