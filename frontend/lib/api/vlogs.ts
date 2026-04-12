import { API_BASE_URL, fetchAPI } from "./client";
import { VlogPost } from "./types";

/**
 * Fetch all vlog posts from internal Django API
 */
export async function fetchVlogPosts(): Promise<VlogPost[]> {
  try {
    const data = await fetchAPI<any[]>(`${API_BASE_URL}/api/vlog/`, {
      next: { revalidate: 3600 },
    });
    return data;
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
    return await fetchAPI<VlogPost>(`${API_BASE_URL}/api/vlog/${slug}/`, {
      next: { revalidate: 3600 },
    });
  } catch (error) {
    console.error(`Error fetching vlog post ${slug}:`, error);
    return null;
  }
}
