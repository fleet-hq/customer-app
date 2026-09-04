import Link from 'next/link';

import { paths } from '@/lib/paths';
import { ArrowRight, Clock } from '@/components/ui/icons';
import { formatBlogDate, type BlogSummary } from '@/lib/blog';

export function BlogFeatured({ post }: { post: BlogSummary }) {
  const date = formatBlogDate(post.publishedAt);
  return (
    <Link
      href={paths.blogPost(post.slug)}
      className="group grid grid-cols-1 overflow-hidden rounded-[22px] border border-card-border bg-white no-underline transition-all duration-200 hover:border-primary-border hover:shadow-[var(--shadow-pop)] lg:grid-cols-[1.15fr_1fr]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-subtle to-chip lg:aspect-auto lg:min-h-[340px]">
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.coverImageAlt || post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full min-h-[220px] w-full items-center justify-center">
            <span className="font-manrope text-[17px] font-bold tracking-[0.02em] text-control">
              {post.category || 'Featured'}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center gap-[16px] p-[30px] sm:p-[40px]">
        <div className="flex items-center gap-[10px] text-[12px] font-semibold uppercase tracking-[0.05em] text-primary">
          <span className="rounded-full bg-primary-soft px-[11px] py-[5px]">Latest</span>
          {post.category ? <span className="text-faint normal-case tracking-normal">{post.category}</span> : null}
        </div>
        <h2 className="font-manrope text-[26px] font-bold leading-[1.2] text-ink text-balance sm:text-[30px]">
          {post.title}
        </h2>
        {post.excerpt ? (
          <p className="line-clamp-3 text-[15px] leading-[1.7] text-muted">{post.excerpt}</p>
        ) : null}
        <div className="flex items-center gap-[10px] text-[13px] text-faint">
          {date ? <span>{date}</span> : null}
          {date && post.readMinutes ? <span className="h-[3px] w-[3px] rounded-full bg-dash" /> : null}
          {post.readMinutes ? (
            <span className="inline-flex items-center gap-[5px]">
              <Clock size={14} /> {post.readMinutes} min read
            </span>
          ) : null}
        </div>
        <span className="mt-[4px] inline-flex w-fit items-center gap-[8px] rounded-full bg-primary px-[24px] py-[12px] text-[14px] font-semibold text-white transition-transform group-hover:-translate-y-[1px]">
          Read article
          <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-[3px]" />
        </span>
      </div>
    </Link>
  );
}
