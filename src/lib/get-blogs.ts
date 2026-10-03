import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import axios from 'axios';

import { TENANT_TAG, tenantTag, resolveRequestHost } from './get-tenant';
import {
  blogSummaryFromApi,
  blogPostFromApi,
  type ApiBlogSummary,
  type ApiBlogPost,
  type BlogSummary,
  type BlogPost,
} from './blog';

const BACKEND_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const CACHE_REVALIDATE_SECONDS = 60;

async function fetchBlogList(host: string): Promise<BlogSummary[]> {
  const res = await axios.get<{ results?: ApiBlogSummary[] } | ApiBlogSummary[]>(
    `${BACKEND_URL}/api/companies/public/blogs/`,
    { params: { domain: host }, headers: { 'Content-Type': 'application/json' }, timeout: 5000 },
  );
  const raw = res.data;
  const list = Array.isArray(raw) ? raw : raw.results ?? [];
  return list.map(blogSummaryFromApi);
}

async function fetchBlogPost(host: string, slug: string): Promise<BlogPost | null> {
  try {
    const res = await axios.get<ApiBlogPost>(
      `${BACKEND_URL}/api/companies/public/blogs/${encodeURIComponent(slug)}/`,
      { params: { domain: host }, headers: { 'Content-Type': 'application/json' }, timeout: 5000 },
    );
    return blogPostFromApi(res.data);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

/** Published blog posts for the current tenant. Shares the tenant's
 *  cache tags so an admin content revalidation busts blogs too, plus a
 *  60s TTL fallback. */
export const getTenantBlogs = cache(async (): Promise<BlogSummary[]> => {
  const host = await resolveRequestHost();
  if (!host) return [];
  const cached = unstable_cache(
    () => fetchBlogList(host).catch(() => [] as BlogSummary[]),
    ['blogs', host],
    { tags: [TENANT_TAG, tenantTag(host)], revalidate: CACHE_REVALIDATE_SECONDS },
  );
  return cached();
});

export const getTenantBlogPost = cache(async (slug: string): Promise<BlogPost | null> => {
  const host = await resolveRequestHost();
  if (!host) return null;
  const cached = unstable_cache(
    () => fetchBlogPost(host, slug),
    ['blog', host, slug],
    { tags: [TENANT_TAG, tenantTag(host)], revalidate: CACHE_REVALIDATE_SECONDS },
  );
  return cached();
});
