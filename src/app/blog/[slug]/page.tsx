import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCurrentTenant } from '@/lib/get-tenant';
import { getTenantBlogPost } from '@/lib/get-blogs';
import { formatBlogDate } from '@/lib/blog';
import { paths } from '@/lib/paths';
import { BackLink } from '@/components/ui/back-link';
import { BlogBody } from '@/components/sections/blog/blog-body';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getTenantBlogPost(slug);
  if (!post) return { title: 'Post not found' };
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      ...(post.coverImage ? { images: [{ url: post.coverImage }] } : {}),
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [tenant, post] = await Promise.all([getCurrentTenant(), getTenantBlogPost(slug)]);
  if (!post) notFound();

  const meta = [post.category, formatBlogDate(post.publishedAt)].filter(Boolean).join(' · ');

  return (
    <div className="bg-white text-ink">
      <article className="mx-auto w-full max-w-[760px] px-4 pt-8 pb-16 sm:px-6 sm:pt-12 sm:pb-20">
        <div className="mb-6">
          <BackLink href={paths.blog}>Back to blog</BackLink>
        </div>

        <header className="flex flex-col gap-4">
          {meta ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold text-primary">
              <span className="uppercase tracking-[0.04em]">{meta}</span>
              {post.readMinutes ? (
                <span className="text-faint">· {post.readMinutes} min read</span>
              ) : null}
            </span>
          ) : null}
          <h1 className="text-[30px] font-extrabold leading-[1.18] text-ink text-balance sm:text-[38px]">
            {post.title}
          </h1>
        </header>

        {post.coverImage ? (
          <div className="my-8 overflow-hidden rounded-[16px] border border-card-border bg-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.coverImageAlt || post.title}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : (
          <div className="mt-8" />
        )}

        <BlogBody html={post.body} />

        <div className="mt-12 flex flex-col items-start gap-4 rounded-[16px] border border-card-border bg-subtle p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[16px] font-bold text-ink">Ready to hit the road?</p>
            <p className="text-[14px] text-muted">Browse the {tenant.name} fleet and book in minutes.</p>
          </div>
          <Link
            href={paths.fleet}
            className="inline-flex flex-shrink-0 items-center justify-center rounded-full bg-primary px-6 py-3 text-[14px] font-semibold text-white no-underline transition-colors hover:bg-primary-hover"
          >
            View our fleet
          </Link>
        </div>
      </article>
    </div>
  );
}
