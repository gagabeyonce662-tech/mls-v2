import { API_BASE_URL, fetchAPI } from "./client";
import { VlogPost } from "./types";

// Keep blog content fresh after admin edits while still allowing light caching.
const VLOG_REVALIDATE_SECONDS = 60;

function normalizeVlogPost(post: any): VlogPost {
  return {
    ...post,
    thumbnail: post?.thumbnail || post?.thumbnail_url || undefined,
    video_file: post?.video_file || post?.video_url || undefined,
  };
}

/**
 * Fetch all vlog posts from internal Django API
 */
export async function fetchVlogPosts(): Promise<VlogPost[]> {
  try {
    const isServer = typeof window === "undefined";
    const data = await fetchAPI<any>(`${API_BASE_URL}/api/vlog/`, {
      ...(isServer
        ? { next: { revalidate: VLOG_REVALIDATE_SECONDS } }
        : { cache: "no-store" }),
    });
    // Handle both direct list and paginated object
    const posts = Array.isArray(data) ? data : (data.results || []);
    return posts.map(normalizeVlogPost);
  } catch (error) {
    console.error("Error fetching vlog posts:", error);
    return [];
  }
}

/**
 * Fetch a single vlog post by its slug from internal Django API
 */
export async function fetchVlogPostBySlug(
  slug: string,
): Promise<VlogPost | null> {
  try {
    const isServer = typeof window === "undefined";
    const post = await fetchAPI<any>(`${API_BASE_URL}/api/vlog/${slug}/`, {
      ...(isServer
        ? { next: { revalidate: VLOG_REVALIDATE_SECONDS } }
        : { cache: "no-store" }),
    });
    return normalizeVlogPost(post);
  } catch (error) {
    console.error(`Error fetching vlog post ${slug}:`, error);
    return null;
  }
}
