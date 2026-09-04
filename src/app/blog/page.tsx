import type { Metadata } from 'next';

import { getCurrentTenant, TenantNotFoundError } from '@/lib/get-tenant';
import { getTenantBlogs } from '@/lib/get-blogs';
import { BlogCard } from '@/components/sections/blog/blog-card';
import { BlogFeatured } from '@/components/sections/blog/blog-featured';
import { BrandCta } from '@/components/sections/shared/brand-cta';
import { paths } from '@/lib/paths';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const tenant = await getCurrentTenant();
    return {
      title: `Blog — ${tenant.name}`,
      description: `News, guides and travel tips from ${tenant.name}.`,
    };
  } catch (err) {
    if (err instanceof TenantNotFoundError) return { title: 'Blog' };
    throw err;
  }
}

export default async function BlogIndexPage() {
  const [tenant, posts] = await Promise.all([getCurrentTenant(), getTenantBlogs()]);

  const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));
  const [featured, ...rest] = posts;

  return (
    <div className="bg-white text-ink">
      <section className="relative overflow-hidden border-b border-hairline bg-subtle">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(90% 120% at 90% -10%, color-mix(in srgb, var(--color-primary) 12%, transparent) 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto w-full max-w-[1120px] px-4 pt-[52px] pb-[44px] sm:px-6 sm:pt-[68px] sm:pb-[52px]">
          <span className="inline-flex items-center gap-[7px] rounded-full border border-primary-border bg-white px-[13px] py-[6px] text-[11.5px] font-semibold uppercase tracking-[0.06em] text-primary">
            The {tenant.name} Blog
          </span>
          <h1 className="mt-[18px] max-w-[720px] font-manrope text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-ink text-balance sm:text-[46px]">
            Guides, tips &amp; local know-how
          </h1>
          <p className="mt-[14px] max-w-[560px] text-[16px] leading-[1.65] text-muted">
            Practical reads from the {tenant.name} team — what to know before you book and before you drive.
          </p>
          {categories.length > 0 ? (
            <div className="mt-[24px] flex flex-wrap gap-[8px]">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-card-border bg-white px-[14px] py-[7px] text-[12.5px] font-medium text-label"
                >
                  {cat}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1120px] px-4 pt-[40px] pb-[64px] sm:px-6 sm:pt-[52px] sm:pb-[80px]">
        {posts.length === 0 ? (
          <div className="rounded-[20px] border border-card-border bg-subtle py-[80px] text-center text-[15px] text-muted">
            No posts yet — check back soon.
          </div>
        ) : (
          <div className="flex flex-col gap-[40px]">
            {featured ? <BlogFeatured post={featured} /> : null}
            {rest.length > 0 ? (
              <div className="grid grid-cols-1 gap-[26px] sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-[64px]">
          <BrandCta
            eyebrow={`${tenant.name}`}
            title="Ready to hit the road?"
            description={`Browse the ${tenant.name} fleet and book your next trip in minutes.`}
            ctaLabel="View the fleet"
            ctaHref={paths.fleet}
          />
        </div>
      </section>
    </div>
  );
}
