/* eslint-disable react/no-danger */
import Image from 'next/image';
import * as RichText from '@prismicio/helpers';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import type { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import type { ParsedUrlQuery } from 'querystring';

import { useRouter } from 'next/router';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  read_time: string;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: [];
    }[];
  };
}

interface PostProps {
  post: Post;
}

interface IParams extends ParsedUrlQuery {
  slug: string;
}

const Post: NextPage<PostProps> = ({ post }) => {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Header />
      <img src={post.data.banner.url} alt="Banner" className={styles.banner} />
      <article className={styles.post}>
        <header className={commonStyles.postInfo}>
          <h1>{post.data.title}</h1>
          <div>
            <div>
              <Image
                src="/calendar.svg"
                alt="Calendário"
                width={20}
                height={20}
              />
              <time>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
            </div>
            <div>
              <Image src="/user.svg" alt="Usuário" width={20} height={20} />
              <span>{post.data.author}</span>
            </div>
            <div>
              <Image src="/clock.svg" alt="Relógio" width={20} height={20} />
              <span>{post.read_time}4 min</span>
            </div>
          </div>
        </header>
        <div className={styles.postContent}>
          {post.data.content.map(content => (
            <div key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHTML(content.body),
                }}
              />
            </div>
          ))}
        </div>
      </article>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getAllByType('post');

  return {
    paths: postsResponse.map(post => ({
      params: {
        slug: post.uid,
      },
    })),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params as IParams;
  const prismic = getPrismicClient({});
  const postResponse = await prismic.getByUID('post', slug);

  let contentInText = '';
  postResponse.data.content.map(content => {
    contentInText += content.heading + RichText.asText(content.body);
    return contentInText;
  });

  const readTime = Math.round(
    ((contentInText.length * 60) / 1183 / 60) * 2
  ).toString();

  const post = {
    uid: postResponse.uid,
    first_publication_date: postResponse.first_publication_date,
    read_time: readTime,
    data: {
      title: postResponse.data.title,
      banner: {
        url: postResponse.data.banner.url,
      },
      author: postResponse.data.author,
      subtitle: postResponse.data.subtitle,
      content: postResponse.data.content,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24,
  };
};
export default Post;
