import Link from 'next/link';

import { paths } from '@/lib/paths';
import { formatBlogDate, type BlogSummary } from '@/lib/blog';

export function BlogCard({ post }: { post: BlogSummary }) {
  const meta = [post.category, formatBlogDate(post.publishedAt)].filter(Boolean).join(' · ');
  return (
    <Link
      href={paths.blogPost(post.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-card-border bg-white no-underline transition-shadow hover:shadow-[0_8px_28px_rgba(19,19,20,0.08)]"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-subtle">
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.coverImageAlt || post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-[10px] p-5">
        {meta ? (
          <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-primary">
            {meta}
          </span>
        ) : null}
        <h3 className="text-[18px] font-bold leading-[1.3] text-ink text-balance">{post.title}</h3>
        {post.excerpt ? (
          <p className="line-clamp-3 text-[14px] leading-[1.6] text-muted">{post.excerpt}</p>
        ) : null}
        <span className="mt-auto flex items-center gap-2 pt-1 text-[13px] text-faint">
          {post.readMinutes ? <span>{post.readMinutes} min read</span> : null}
          <span className="font-semibold text-primary group-hover:underline">Read more →</span>
        </span>
      </div>
    </Link>
  );
}
