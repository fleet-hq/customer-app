import Link from 'next/link';

import type { Tenant } from '@/lib/tenant';
import type { BlogPost, BlogSummary } from '@/lib/blog';
import { formatBlogDate } from '@/lib/blog';
import { paths } from '@/lib/paths';
import { Clock } from '@/components/ui/icons';
import { Dyn } from '@/components/i18n/Dyn';
import { PostBodyT2 } from './post-body-t2';
import styles from '@/styles/template-2.module.css';

interface BlogPostT2Props {
  tenant: Tenant;
  post: BlogPost;
  more: BlogSummary[];
}

/** Template-2 sibling of the /blog/[slug] post page. Reads the exact
 *  same `getTenantBlogPost()`/`getTenantBlogs()` data as template 1. */
export function BlogPostT2({ tenant, post, more }: BlogPostT2Props) {
  const date = formatBlogDate(post.publishedAt);

  return (
    <div className={styles.container}>
      <div className={styles.postHead}>
        <Link href={paths.blog} className={styles.linkMore}>
          <Dyn>All articles</Dyn>
        </Link>
        <div className={styles.postMeta}>
          {post.category ? <span>{post.category}</span> : null}
          {date ? <span>{date}</span> : null}
          {post.readMinutes ? (
            <span>
              <Clock size={13} /> {post.readMinutes} min read
            </span>
          ) : null}
        </div>
        <h1>{post.title}</h1>
      </div>

      {post.coverImage ? (
        <div className={styles.postCover}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt={post.coverImageAlt || post.title} />
        </div>
      ) : null}

      <PostBodyT2 html={post.body} />

      <div className={`${styles.cta} ${styles.section}`}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>
            <Dyn>{tenant.name}</Dyn>
          </p>
          <h2>
            <Dyn>Ready to hit the road?</Dyn>
          </h2>
          <p>
            <Dyn>{`Every trip starts with the right vehicle. Browse the ${tenant.name} fleet.`}</Dyn>
          </p>
          <div className={styles.ctaActions}>
            <Link href={paths.fleet} className={`${styles.btn} ${styles.btnBrass}`}>
              <Dyn>View our fleet</Dyn>
            </Link>
          </div>
        </div>
      </div>

      {more.length > 0 ? (
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>
              <Dyn>Keep reading</Dyn>
            </h2>
          </div>
          <div className={styles.blogGrid}>
            {more.map((p) => (
              <Link key={p.id} href={paths.blogPost(p.slug)} className={styles.blogCard}>
                <div className={styles.blogCardMedia}>
                  {p.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverImage} alt={p.coverImageAlt || p.title} />
                  ) : null}
                </div>
                <div className={styles.blogCardBody}>
                  <div className={styles.blogCardMeta}>
                    {p.category ? <span>{p.category}</span> : null}
                  </div>
                  <h3>{p.title}</h3>
                  {p.excerpt ? <p className={styles.blogCardExcerpt}>{p.excerpt}</p> : null}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
