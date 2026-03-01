// lib/api/vlogs.ts
import { API_BASE_URL, fetchAPI } from "./client";
import { VlogPost } from "./types";

/**
 * Fetch all vlog posts
 */
export async function fetchVlogPosts(): Promise<VlogPost[]> {
  try {
    const data = await fetchAPI<any[]>(`${API_BASE_URL}/api/vlog/`, {
      next: { revalidate: 3600 },
    });

    return data.map((post) => ({
      ...post,
      tags: post.tags
        ? post.tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : [],
    }));
  } catch (error) {
    console.error("Error fetching vlog posts:", error);
    return [];
  }
}

/**
 * Fetch a single vlog post by its slug
 */
export async function fetchVlogPostBySlug(
  slug: string,
): Promise<VlogPost | null> {
  try {
    const data = await fetchAPI<any>(`${API_BASE_URL}/api/vlog/${slug}/`, {
      next: { revalidate: 3600 },
    });

    return {
      ...data,
      tags: data.tags
        ? data.tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : [],
    };
  } catch (error) {
    console.error("Error fetching vlog post:", error);
    return null;
  }
}
