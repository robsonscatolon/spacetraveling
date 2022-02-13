import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
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
}

export default function Post({ post }: PostProps): JSX.Element {
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
            <div>
              <FiCalendar />
              <span>{formatData(post.first_publication_date)}</span>
            </div>
            <div>
              <FiUser />
              <span>{post.data.author}</span>
            </div>
            <div>
              <FiClock />
              <span>{getTimeToRead(post.data.content)}</span>
            </div>
          </div>

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
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query('');

  const paths = posts.results.map(result => {
    return { params: { slug: result.uid } };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', context.params.slug);

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
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
    },
    revalidate: 30 * 60, // 30 minutos
  };
};
