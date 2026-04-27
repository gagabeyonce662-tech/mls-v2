"use client";
import Image from "next/image";

import { useState, useEffect } from "react";
import { fetchVlogPosts } from "@/lib/api/vlogs";
import { VlogPost } from "@/lib/api/types";
import { env } from "@/lib/env";
import Link from "next/link";

const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80";

function shouldBypassOptimization(src: string): boolean {
  return (
    src.startsWith("http://localhost:") ||
    src.startsWith("https://localhost:") ||
    src.startsWith("http://127.0.0.1:") ||
    src.startsWith("https://127.0.0.1:")
  );
}

function getThumbnailSrc(article: VlogPost): string {
  const resolved = article.thumbnail || article.thumbnail_url;
  if (!resolved) return FALLBACK_THUMBNAIL;
  if (resolved.startsWith("/")) {
    const baseUrl = env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
    return `${baseUrl}${resolved}`;
  }
  return resolved;
}

function getArticleTagLabel(article: VlogPost): string | null {
  const categoryName = article.category?.name?.trim();
  if (categoryName) return categoryName;

  const firstTag = article.tags?.[0]?.trim();
  if (firstTag) return firstTag;

  return null;
}

export default function LatestArticles() {
  const [articles, setArticles] = useState<VlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchVlogPosts();
        setArticles(data.slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="py-16 bg-white w-full flex justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }

  if (articles.length === 0) return null;

  return (
    <div className="py-16 bg-white w-full">
      <div className="w-full px-4 lg:px-6">
        <div className="mb-8">
          <h2 className="text-ds-h2 text-ds-heading font-inter">
            Latest Articles
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-8">
          {articles.map((article) => {
            const thumbnailSrc = failedImageIds.has(article.id)
              ? FALLBACK_THUMBNAIL
              : getThumbnailSrc(article);
            const articleTagLabel = getArticleTagLabel(article);
            return (
            <Link 
              href={`/blog/${article.slug}`} 
              key={article.slug} 
              className="group cursor-pointer"
            >
              <div className="relative h-56 rounded-xl overflow-hidden mb-4">
                <Image
                  src={thumbnailSrc}
                  alt={article.title}
                  width={400}
                  height={224}
                  unoptimized
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={() =>
                    setFailedImageIds((prev) => {
                      const next = new Set(prev);
                      next.add(article.id);
                      return next;
                    })
                  }
                />
                {articleTagLabel && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded text-xs font-bold">
                      {articleTagLabel}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-ds-small-regular text-ds-body font-inter">
                  {article.publish_date ? new Date(article.publish_date).toLocaleDateString() : ""}
                </p>
                <h3 className="text-ds-h5 text-ds-heading group-hover:text-ds-primary transition-colors font-inter line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-ds-body-regular text-ds-body font-inter line-clamp-2">
                  {article.excerpt}
                </p>
                <span className="text-ds-primary font-semibold hover:underline font-inter">
                  Read More
                </span>
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
