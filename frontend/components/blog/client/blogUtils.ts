import type { VlogPost } from "@/lib/api";
import { env } from "@/lib/env";

export function formatBlogDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function resolveBlogImageUrl(
  post: VlogPost,
  fallbackImage: string,
  failedImageIds: Set<number>,
) {
  const resolvedThumbnail = post.thumbnail || post.thumbnail_url;

  if (failedImageIds.has(post.id)) {
    return fallbackImage;
  }

  if (!resolvedThumbnail) {
    return fallbackImage;
  }

  if (resolvedThumbnail.startsWith("/")) {
    const baseUrl = env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
    return `${baseUrl}${resolvedThumbnail}`;
  }

  return resolvedThumbnail;
}
