// pages/blog/[slug].js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useParams } from 'next/navigation';
import { fetchBlogPosts } from '@/utils/api';


export default function BlogPostPage() {
  const router = useRouter();
  const { slug } = useParams()
  const [post, setPost] = useState(null);

  useEffect(() => {
    if (slug) {
      const getPost = async () => {
        const data = await fetchBlogPosts(slug);
        setPost(data);
      };
      getPost();
    }
  }, [slug]);

  if (!post) return <p>Loading...</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold">{post.title}</h1>
      <p className="text-lg">{post.content}</p>
    </div>
  );
}
