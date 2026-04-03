// src/lib/visibility.ts
import { getCollection } from 'astro:content';

const isDev = import.meta.env.DEV;

export async function isSectionVisible(key: string): Promise<boolean> {
  if (isDev) return true;
  const vis = await getCollection('visibility');
  const entry = vis[0];
  return entry?.data?.[key] ?? false;
}

export async function getVisibleSections(): Promise<string[]> {
  if (isDev) return ['phd', 'projects', 'cv', 'stack', 'labs', 'misc'];
  const vis = await getCollection('visibility');
  const data = vis[0]?.data ?? {};
  return Object.entries(data)
    .filter(([, v]) => v)
    .map(([k]) => k);
}
