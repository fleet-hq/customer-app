import type { FaqItem } from '@/services/companyContentServices';

export const BLOG_TRAIL = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
];

export interface ApiBlogSummary {
  id: number;
  title: string;
  slug: string;
  category: string;
  author_name?: string;
  excerpt: string;
  cover_image_url: string | null;
  cover_image_alt: string;
  read_minutes: number | null;
  published: boolean;
  published_at: string | null;
  updated_at?: string | null;
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
  authorName: string;
  excerpt: string;
  coverImage: string | null;
  coverImageAlt: string;
  readMinutes: number | null;
  publishedAt: string | null;
  updatedAt: string | null;
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
    authorName: api.author_name ?? '',
    excerpt: api.excerpt ?? '',
    coverImage: api.cover_image_url ?? null,
    coverImageAlt: api.cover_image_alt ?? '',
    readMinutes: api.read_minutes ?? null,
    publishedAt: api.published_at ?? null,
    updatedAt: api.updated_at ?? null,
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

const FAQ_HEADING = /^(faqs?|questions|frequently asked questions)$/i;

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '\u2014',
  ndash: '\u2013',
  rsquo: '\u2019',
  lsquo: '\u2018',
  rdquo: '\u201d',
  ldquo: '\u201c',
  hellip: '\u2026',
};

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
      if (code[0] === '#') {
        const point = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(point) ? String.fromCodePoint(point) : match;
      }
      return ENTITIES[code.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

export function blogFaqs(html: string): FaqItem[] {
  const sections = html.split(/<h2\b[^>]*>/i).slice(1);
  const section = sections.find((chunk) => FAQ_HEADING.test(plainText(chunk.split(/<\/h2>/i)[0])));
  if (!section) return [];
  const body = section.split(/<\/h2>/i).slice(1).join('');
  return body
    .split(/<h3\b[^>]*>/i)
    .slice(1)
    .map((chunk) => {
      const [question, ...answer] = chunk.split(/<\/h3>/i);
      return { question: plainText(question), answer: plainText(answer.join('')) };
    })
    .filter((faq) => faq.question && faq.answer);
}
