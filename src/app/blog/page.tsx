import type { Metadata } from 'next';

import { getCurrentTenant, TenantNotFoundError } from '@/lib/get-tenant';
import { getTenantBlogs } from '@/lib/get-blogs';
import { BlogCard } from '@/components/sections/blog/blog-card';

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

  return (
    <div className="bg-white text-ink">
      <section className="mx-auto w-full max-w-[1120px] px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-20">
        <header className="mb-8 flex flex-col gap-3 sm:mb-12">
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-primary">
            The {tenant.name} Blog
          </span>
          <h1 className="text-[30px] font-extrabold leading-[1.15] text-ink text-balance sm:text-[40px]">
            Guides, tips &amp; local know-how
          </h1>
        </header>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-card-border bg-subtle py-20 text-center text-sm text-muted">
            No posts yet — check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
