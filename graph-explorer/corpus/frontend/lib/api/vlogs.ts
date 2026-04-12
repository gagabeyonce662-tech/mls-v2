// lib/api/vlogs.ts
import { fetchWordPressPosts, fetchWordPressPostBySlug } from "./wordpress";
import { VlogPost } from "./types";

/**
 * Fetch all vlog posts (now sourced from WordPress JSON)
 */
export async function fetchVlogPosts(): Promise<VlogPost[]> {
  return fetchWordPressPosts();
}

/**
 * Fetch a single vlog post by its slug (now sourced from WordPress JSON)
 */
export async function fetchVlogPostBySlug(
  slug: string,
): Promise<VlogPost | null> {
  return fetchWordPressPostBySlug(slug);
}
