import Link from 'next/link';

import type { Tenant } from '@/lib/tenant';
import type { BlogSummary } from '@/lib/blog';
import { formatBlogDate } from '@/lib/blog';
import { paths } from '@/lib/paths';
import { Clock } from '@/components/ui/icons';
import { Dyn } from '@/components/i18n/Dyn';
import styles from '@/styles/template-2.module.css';

interface BlogIndexT2Props {
  tenant: Tenant;
  posts: BlogSummary[];
}

/** Template-2 sibling of the /blog index. Reads the exact same
 *  `getTenantBlogs()` data as template 1 — no fallback copy. */
export function BlogIndexT2({ tenant, posts }: BlogIndexT2Props) {
  const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));
  const [featured, ...rest] = posts;
  const bi = tenant.sections.blog_index;

  return (
    <div className={styles.container}>
      <div className={styles.blogHead}>
        <p className={styles.eyebrow}>
          <Dyn>{bi?.eyebrow || `The ${tenant.name} Blog`}</Dyn>
        </p>
        <h1>
          <Dyn>{bi?.heading || 'Guides, tips & local know-how'}</Dyn>
        </h1>
        <p className={styles.blogIntro}>
          <Dyn>
            {bi?.intro || `Practical reads from the ${tenant.name} team — what to know before you book and before you drive.`}
          </Dyn>
        </p>
        {categories.length > 0 ? (
          <div className={styles.blogCats}>
            {categories.map((cat) => (
              <span key={cat} className={styles.blogCat}>
                {cat}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.section}>
        {posts.length === 0 ? (
          <div className={styles.emptyState}>
            <Dyn>No posts yet — check back soon.</Dyn>
          </div>
        ) : (
          <>
            {featured ? <BlogFeaturedT2 post={featured} /> : null}
            {rest.length > 0 ? (
              <div className={styles.blogGrid}>
                {rest.map((post) => (
                  <BlogCardT2 key={post.id} post={post} />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className={`${styles.cta} ${styles.section}`}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>
            <Dyn>{tenant.name}</Dyn>
          </p>
          <h2>
            <Dyn>Ready to hit the road?</Dyn>
          </h2>
          <p>
            <Dyn>{`Browse the ${tenant.name} fleet and book your next trip in minutes.`}</Dyn>
          </p>
          <div className={styles.ctaActions}>
            <Link href={paths.fleet} className={`${styles.btn} ${styles.btnBrass}`}>
              <Dyn>View the fleet</Dyn>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlogFeaturedT2({ post }: { post: BlogSummary }) {
  const date = formatBlogDate(post.publishedAt);
  return (
    <Link href={paths.blogPost(post.slug)} className={styles.blogFeatured}>
      <div className={styles.blogFeaturedMedia}>
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt={post.coverImageAlt || post.title} />
        ) : null}
      </div>
      <div className={styles.blogFeaturedBody}>
        <p className={styles.eyebrow}>
          <Dyn>{post.category || 'Latest'}</Dyn>
        </p>
        <h2>{post.title}</h2>
        {post.excerpt ? <p>{post.excerpt}</p> : null}
        <div className={styles.postMeta}>
          {date ? <span>{date}</span> : null}
          {post.readMinutes ? (
            <span>
              <Clock size={13} /> {post.readMinutes} min read
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function BlogCardT2({ post }: { post: BlogSummary }) {
  const date = formatBlogDate(post.publishedAt);
  return (
    <Link href={paths.blogPost(post.slug)} className={styles.blogCard}>
      <div className={styles.blogCardMedia}>
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt={post.coverImageAlt || post.title} />
        ) : null}
      </div>
      <div className={styles.blogCardBody}>
        <div className={styles.blogCardMeta}>
          {post.category ? <span>{post.category}</span> : null}
          {date ? <span>{date}</span> : null}
        </div>
        <h3>{post.title}</h3>
        {post.excerpt ? <p className={styles.blogCardExcerpt}>{post.excerpt}</p> : null}
      </div>
    </Link>
  );
}
