"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchBlogPosts } from "@/lib/utils/api";

export default function BlogPostPage() {
  const { slug } = useParams(); // ✅ directly destructure slug

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: fetchBlogPosts,
  });

  if (isLoading) return <p className="text-center py-8">Loading...</p>;
  if (error) return <p className="text-center py-8 text-red-500">Error: {error.message}</p>;

  // ✅ Find the post by slug
  const post = posts?.find((p: any) => p.slug === slug);

  if (!post) {
    return <p className="text-center py-8 text-gray-400">Post not found</p>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      <p className="text-gray-600 text-sm mb-8">
        Published on {new Date(post.publish_date).toLocaleDateString()}
      </p>

      {/* ✅ Optional video embed */}
      {post.embed_url && (
        <div className="aspect-w-16 aspect-h-9 mb-8">
          <iframe
            src={post.embed_url}
            className="w-full h-full rounded-lg"
            allowFullScreen
          ></iframe>
        </div>
      )}

      {/* ✅ Thumbnail (if no video) */}
      {!post.embed_url && post.thumbnail && (
        <img
          src={post.thumbnail}
          alt={post.title}
          className="w-full h-auto rounded-lg mb-8"
        />
      )}

      {/* ✅ Main content */}
      <div
        className="prose prose-lg prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      ></div>
    </div>
  );
}
