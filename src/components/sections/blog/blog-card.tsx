import Link from 'next/link';

import { paths } from '@/lib/paths';
import { ArrowRight, Clock } from '@/components/ui/icons';
import { formatBlogDate, type BlogSummary } from '@/lib/blog';

export function BlogCard({ post }: { post: BlogSummary }) {
  const date = formatBlogDate(post.publishedAt);
  return (
    <Link
      href={paths.blogPost(post.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-card-border bg-white no-underline transition-all duration-200 hover:-translate-y-[3px] hover:border-primary-border hover:shadow-[var(--shadow-pop)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-subtle to-chip">
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.coverImageAlt || post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-manrope text-[15px] font-bold tracking-[0.02em] text-control">
              {post.category || 'Article'}
            </span>
          </div>
        )}
        {post.category ? (
          <span className="absolute left-[14px] top-[14px] rounded-full bg-white/95 px-[11px] py-[5px] text-[11px] font-semibold uppercase tracking-[0.04em] text-primary shadow-[0_2px_8px_rgba(19,19,20,0.12)] backdrop-blur-sm">
            {post.category}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-[10px] p-[22px]">
        <h3 className="font-manrope text-[19px] font-bold leading-[1.28] text-ink text-balance transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="line-clamp-3 text-[14px] leading-[1.6] text-muted">{post.excerpt}</p>
        ) : null}
        <div className="mt-auto flex items-center gap-[10px] pt-[14px] text-[12.5px] text-faint">
          {date ? <span>{date}</span> : null}
          {date && post.readMinutes ? <span className="h-[3px] w-[3px] rounded-full bg-dash" /> : null}
          {post.readMinutes ? (
            <span className="inline-flex items-center gap-[5px]">
              <Clock size={13} /> {post.readMinutes} min
            </span>
          ) : null}
          <span className="ml-auto inline-flex items-center gap-[5px] font-semibold text-primary">
            Read
            <ArrowRight
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-[3px]"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
