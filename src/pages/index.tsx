import { GetStaticProps } from 'next';
import Header from '../components/Header';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import styles from './home.module.scss';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { predicates } from '@prismicio/client';
import PreviewButton from '../components/PreviewButton';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

function formatData(dataUnformat: string): string {
  return format(new Date(dataUnformat), 'dd MMM yyyy', {
    locale: ptBR,
  });
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextPage, setNextPage] = useState<string>('');

  useEffect(() => {
    setPosts(postsPagination.results);
    setNextPage(postsPagination.next_page);
  }, []);

  function callNextPage(): void {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        setNextPage(data.next_page);

        return data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });
      })
      .then(newPosts => setPosts([...posts, ...newPosts]));
  }
  return (
    <>
      <Header></Header>
      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => {
            return (
              <Link href={`/post/${post.uid}`}>
                <a key={post.uid}>
                  <h2>{post.data.title}</h2>
                  <p>{post.data.subtitle}</p>
                  <div className={styles.createdInformation}>
                    <div>
                      <FiCalendar />
                      <span>{formatData(post.first_publication_date)}</span>
                    </div>
                    <div>
                      <FiUser />
                      <span>{post.data.author}</span>
                    </div>
                  </div>
                </a>
              </Link>
            );
          })}

          {nextPage ? (
            <button onClick={callNextPage}>Carregar mais posts</button>
          ) : (
            ''
          )}
        </div>

        {preview && <PreviewButton />}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.get({
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 20,
    ref: previewData?.ref ?? null,
    orderings: { field: 'document.first_publication_date', direction: 'desc' },
  });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });
  return {
    props: {
      postsPagination: { next_page: postsResponse.next_page, results: posts },
      preview,
    },
  };
};
