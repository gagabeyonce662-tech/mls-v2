"use client";

import Image from "next/image";
import Link from "next/link";

import { colors } from "@/config/design-system";
import type { VlogPost } from "@/lib/api";

import { formatBlogDate, resolveBlogImageUrl } from "./blogUtils";

interface BlogPostCardProps {
  post: VlogPost;
  fallbackImage: string;
  failedImageIds: Set<number>;
  onImageError: (postId: number) => void;
}

export function BlogPostCard({
  post,
  fallbackImage,
  failedImageIds,
  onImageError,
}: BlogPostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <article
        className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer"
        style={{ backgroundColor: colors.cards }}
      >
        <div className="relative h-56">
          <Image
            src={resolveBlogImageUrl(post, fallbackImage, failedImageIds)}
            alt={post.title}
            width={600}
            height={400}
            unoptimized
            className="w-full h-full object-cover"
            onError={() => onImageError(post.id)}
          />
          {post.category && (
            <div className="absolute top-4 left-4">
              <span
                className="px-3 py-1.5 rounded-md text-xs font-semibold"
                style={{
                  backgroundColor: colors.icon,
                  color: colors.cards,
                }}
              >
                {post.category.name}
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          <h3
            className="text-lg font-bold mb-3 leading-snug line-clamp-2"
            style={{ color: colors.heading }}
          >
            {post.title}
          </h3>

          <p className="text-sm mb-4 line-clamp-2" style={{ color: colors.body }}>
            {post.excerpt || "Click to read the full article..."}
          </p>

          <div className="flex items-center justify-between mb-4">
            <span className="text-xs" style={{ color: colors.body }}>
              {formatBlogDate(post.publish_date || post.created_at)}
            </span>
            {(post.embed_url || post.video_file) && (
              <span
                className="text-xs px-2 py-1 rounded flex items-center gap-1"
                style={{
                  backgroundColor: colors.boarder,
                  color: colors.body,
                }}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Video
              </span>
            )}
          </div>

          <button
            className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors w-full hover:opacity-90"
            style={{
              backgroundColor: colors.primary,
              color: colors.cards,
            }}
          >
            Read Now
          </button>
        </div>
      </article>
    </Link>
  );
}
