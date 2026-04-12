// lib/api/wordpress.ts
import postsData from "@/data/wp-posts.json";
import { VlogPost, VlogCategory } from "./types";

/**
 * Maps WordPress post data to the internal VlogPost format.
 */
function mapWordPressToVlogPost(wpPost: any): VlogPost {
  // Extract thumbnail from verschiedene possible sources
  const thumbnail =
    wpPost.jetpack_featured_media_url ||
    wpPost.yoast_head_json?.og_image?.[0]?.url ||
    "";

  // Clean HTML from excerpt
  const excerpt = wpPost.excerpt.rendered.replace(/<[^>]*>?/gm, "").trim();

  return {
    id: wpPost.id,
    title: wpPost.title.rendered,
    slug: wpPost.slug,
    excerpt: excerpt,
    content: wpPost.content.rendered,
    thumbnail: thumbnail,
    category: {
      id: wpPost.categories?.[0] || 0,
      name: "Real Estate", // Default category if not found
      slug: "real-estate",
    } as VlogCategory,
    tags: wpPost.tags || [],
    status: wpPost.status === "publish" ? "published" : "draft",
    publish_date: wpPost.date,
    created_at: wpPost.date,
    updated_at: wpPost.modified,
    allow_comments: wpPost.comment_status === "open",
  };
}

/**
 * Fetch all WordPress blog posts from the local JSON file
 */
export async function fetchWordPressPosts(): Promise<VlogPost[]> {
  try {
    return (postsData as any[]).map(mapWordPressToVlogPost);
  } catch (error) {
    console.error("Error loading WordPress posts:", error);
    return [];
  }
}

/**
 * Fetch a single WordPress post by slug
 */
export async function fetchWordPressPostBySlug(
  slug: string,
): Promise<VlogPost | null> {
  try {
    const post = (postsData as any[]).find((p) => p.slug === slug);
    return post ? mapWordPressToVlogPost(post) : null;
  } catch (error) {
    console.error(`Error loading WordPress post with slug ${slug}:`, error);
    return null;
  }
}
