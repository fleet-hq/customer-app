import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getCurrentTenant } from '@/lib/get-tenant';
import { getTenantBlogPost, getTenantBlogs } from '@/lib/get-blogs';
import { formatBlogDate } from '@/lib/blog';
import { paths } from '@/lib/paths';
import { BackLink } from '@/components/ui/back-link';
import { Clock } from '@/components/ui/icons';
import { BlogBody } from '@/components/sections/blog/blog-body';
import { BlogCard } from '@/components/sections/blog/blog-card';
import { BrandCta } from '@/components/sections/shared/brand-cta';

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
  const [tenant, post, all] = await Promise.all([
    getCurrentTenant(),
    getTenantBlogPost(slug),
    getTenantBlogs(),
  ]);
  if (!post) notFound();

  const date = formatBlogDate(post.publishedAt);
  const more = all.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="bg-white text-ink">
      <section className="relative overflow-hidden border-b border-hairline bg-subtle">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(90% 120% at 85% -10%, color-mix(in srgb, var(--color-primary) 12%, transparent) 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto w-full max-w-[760px] px-4 pt-[28px] pb-[36px] sm:px-6 sm:pt-[34px] sm:pb-[44px]">
          <BackLink href={paths.blog}>All articles</BackLink>
          <div className="mt-[22px] flex flex-wrap items-center gap-[10px] text-[13px]">
            {post.category ? (
              <span className="rounded-full bg-primary-soft px-[12px] py-[5px] text-[12px] font-semibold uppercase tracking-[0.04em] text-primary">
                {post.category}
              </span>
            ) : null}
            {date ? <span className="text-faint">{date}</span> : null}
            {post.readMinutes ? (
              <span className="inline-flex items-center gap-[5px] text-faint">
                <Clock size={14} /> {post.readMinutes} min read
              </span>
            ) : null}
          </div>
          <h1 className="mt-[16px] font-manrope text-[30px] font-bold leading-[1.16] tracking-[-0.02em] text-ink text-balance sm:text-[40px]">
            {post.title}
          </h1>
        </div>
      </section>

      <article className="mx-auto w-full max-w-[760px] px-4 pb-[16px] sm:px-6">
        {post.coverImage ? (
          <div className="-mt-[8px] mb-[36px] overflow-hidden rounded-[18px] border border-card-border bg-subtle shadow-[var(--shadow-card)] sm:-mt-[4px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.coverImageAlt || post.title}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : (
          <div className="pt-[40px]" />
        )}

        <BlogBody html={post.body} />
      </article>

      <section className="mx-auto w-full max-w-[760px] px-4 pt-[44px] pb-[24px] sm:px-6">
        <BrandCta
          eyebrow={tenant.name}
          title="Ready to hit the road?"
          description={`Every trip starts with the right vehicle. Browse the ${tenant.name} fleet.`}
          ctaLabel="View our fleet"
          ctaHref={paths.fleet}
        />
      </section>

      {more.length > 0 ? (
        <section className="mx-auto w-full max-w-[1120px] px-4 pt-[36px] pb-[72px] sm:px-6">
          <h2 className="mb-[22px] font-manrope text-[22px] font-bold tracking-[-0.01em] text-ink">
            Keep reading
          </h2>
          <div className="grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3">
            {more.map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      ) : (
        <div className="pb-[48px]" />
      )}
    </div>
  );
}
