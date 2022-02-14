import { Predicates } from '@prismicio/client';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/esm';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Comments from '../../components/Comments';
import Header from '../../components/Header';
import PreviewButton from '../../components/PreviewButton';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface NeighborhoodPost {
  title: string;
  uid: string;
}

interface Post {
  uid?: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    subtitle: string;
    title: string;
    timeRead: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  nextPost: NeighborhoodPost;
  previousPost: NeighborhoodPost;
  preview: boolean;
}

export default function Post({
  post,
  nextPost,
  previousPost,
  preview,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  function formatData(dataUnformat: string): string {
    return format(new Date(dataUnformat), 'dd MMM yyyy', {
      locale: ptBR,
    });
  }

  function getTimeToRead(contents): string {
    const amountWordsOfBody: number = RichText.asText(
      post.data.content.reduce((acc, data) => [...acc, ...data.body], [])
    ).split(' ').length;

    const amountWordsOfHeading: number = post.data.content.reduce(
      (acc, data) => {
        if (data.heading) {
          return [...acc, ...data.heading.split(' ')];
        }

        return [...acc];
      },
      []
    ).length;

    const readingTime: string =
      Math.ceil((amountWordsOfBody + amountWordsOfHeading) / 200) + ' min';

    return readingTime;
  }

  return (
    <>
      <Header />
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="Banner" />
      </div>
      <main className={styles.container}>
        <article>
          <h1>{post.data.title}</h1>
          <div className={styles.postInformation}>
            <span>
              <FiCalendar />
              {formatData(post.first_publication_date)}
            </span>

            <span>
              <FiUser />
              {post.data.author}
            </span>

            <span>
              <FiClock />
              {getTimeToRead(post.data.content)}
            </span>
          </div>
          {post.last_publication_date && (
            <span>
              {format(
                new Date(post.last_publication_date),
                "'*editado em' dd MMM yyyy', às' HH:mm",
                {
                  locale: ptBR,
                }
              )}
            </span>
          )}
          {post.data.content.map(({ heading, body }) => {
            return (
              <div key={heading} className={styles.contentText}>
                {heading && <h2>{heading}</h2>}
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(body),
                  }}
                />
              </div>
            );
          })}
        </article>

        <aside className={styles.footer}>
          <div>
            {previousPost && (
              <>
                <p>{previousPost.title}</p>
                <Link href={`/post/${previousPost.uid}`}>
                  <a>Post anterior</a>
                </Link>
              </>
            )}
          </div>

          <div>
            {nextPost && (
              <>
                <p>{nextPost.title}</p>
                <Link href={`/post/${nextPost.uid}`}>
                  <a>Próximo post</a>
                </Link>
              </>
            )}
          </div>
        </aside>

        <Comments />
        {preview && <PreviewButton />}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.get();

  const paths = posts.results.map(result => {
    return { params: { slug: result.uid } };
  });

  return {
    paths,
    fallback: true,
  };
};

function verifyNeighborhoodPost(post, slug): NeighborhoodPost | null {
  return post.results.length == 0 || slug === post.results[0].uid
    ? null
    : {
        title: post.results[0]?.data?.title,
        uid: post.results[0]?.uid,
      };
}

export const getStaticProps: GetStaticProps = async ({
  params,
  previewData,
  preview = false,
}) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const responsePreviousPost = await prismic.get({
    fetch: ['posts.title', 'posts.uid'],
    pageSize: 1,
    after: response.id as string,
    orderings: { field: 'document.first_publication_date', direction: 'asc' },
  });

  const responseNextPost = await prismic.get({
    fetch: ['posts.title', 'posts.uid'],
    pageSize: 1,
    after: response.id as string,
    orderings: [
      { field: 'document.first_publication_date', direction: 'desc' },
    ],
  });

  const nextPost = verifyNeighborhoodPost(responseNextPost, slug);

  const previousPost = verifyNeighborhoodPost(responsePreviousPost, slug);

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      subtitle: response.data.subtitle,
      title: response.data.title,
      banner: response.data.banner,
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
      preview,
      nextPost,
      previousPost,
    },
    revalidate: 30 * 60, // 30 minutos
  };
};
