export interface ApiBlogSummary {
  id: number;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  cover_image_url: string | null;
  cover_image_alt: string;
  read_minutes: number | null;
  published: boolean;
  published_at: string | null;
}

export interface ApiBlogPost extends ApiBlogSummary {
  body: string;
  meta_title: string;
  meta_description: string;
}

export interface BlogSummary {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  coverImage: string | null;
  coverImageAlt: string;
  readMinutes: number | null;
  publishedAt: string | null;
}

export interface BlogPost extends BlogSummary {
  body: string;
  metaTitle: string;
  metaDescription: string;
}

export function blogSummaryFromApi(api: ApiBlogSummary): BlogSummary {
  return {
    id: String(api.id),
    title: api.title,
    slug: api.slug,
    category: api.category ?? '',
    excerpt: api.excerpt ?? '',
    coverImage: api.cover_image_url ?? null,
    coverImageAlt: api.cover_image_alt ?? '',
    readMinutes: api.read_minutes ?? null,
    publishedAt: api.published_at ?? null,
  };
}

export function blogPostFromApi(api: ApiBlogPost): BlogPost {
  return {
    ...blogSummaryFromApi(api),
    body: api.body ?? '',
    metaTitle: api.meta_title ?? '',
    metaDescription: api.meta_description ?? '',
  };
}

export function formatBlogDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
