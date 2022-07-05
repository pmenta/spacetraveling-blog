import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import Head from 'next/head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import type { PrismicDocument } from '@prismicio/types';
import type { GetStaticProps, NextPage } from 'next';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

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
}

const Home: NextPage<HomeProps> = ({ postsPagination }) => {
  const [posts, setPosts] = useState(postsPagination);

  function formatPost(post: PrismicDocument): Post {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        author: post.data.author,
        subtitle: post.data.subtitle,
      },
    };
  }

  function getNextPage(): void {
    fetch(posts.next_page)
      .then(response => response.json())
      .then(response => {
        const newPosts = response.results.map((result: PrismicDocument) =>
          formatPost(result)
        );
        setPosts({
          next_page: response.next_page,
          results: [...posts.results, ...newPosts],
        });
      });
  }

  return (
    <>
      <Head>
        <title>spacetraveling</title>
      </Head>
      <header className={styles.header}>
        <Image src="/logo.svg" alt="logo" width={238} height={25} />
      </header>
      <main className={styles.posts}>
        <ul>
          {posts.results.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a className={commonStyles.postInfo}>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div>
                  <div>
                    <Image
                      src="/calendar.svg"
                      alt="Calendário"
                      width={20}
                      height={20}
                    />
                    <time>
                      {format(
                        new Date(post.first_publication_date),
                        'dd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </time>
                  </div>
                  <div>
                    <Image
                      src="/user.svg"
                      alt="Usuário"
                      width={20}
                      height={20}
                    />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </ul>
        {posts.next_page && (
          <button type="button" onClick={() => getNextPage()}>
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('post', { pageSize: 2 });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        author: post.data.author,
        subtitle: post.data.subtitle,
      },
    };
  });

  const postsPagination: PostPagination = {
    results: posts,
    next_page: postsResponse.next_page,
  };

  return {
    props: {
      postsPagination,
    },
    revalidate: 60 * 60 * 24,
  };
};

export default Home;
