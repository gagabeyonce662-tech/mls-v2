import { API_BASE_URL, fetchAPI } from "./client";
import { VlogPost } from "./types";

// Keep blog content fresh after admin edits while still allowing light caching.
const VLOG_REVALIDATE_SECONDS = 60;
const DEBUG_ENDPOINT = "http://127.0.0.1:7349/ingest/3f08206e-1a73-4004-abc2-35f0c9af591f";

function sendDebugLog(payload: {
  runId: string;
  hypothesisId: string;
  location: string;
  message: string;
  data: Record<string, unknown>;
}) {
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "84631e",
    },
    body: JSON.stringify({
      sessionId: "84631e",
      ...payload,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}

function normalizeVlogPost(post: any): VlogPost {
  // #region agent log
  sendDebugLog({
    runId: "pre-fix",
    hypothesisId: "H1",
    location: "frontend/lib/api/vlogs.ts:normalizeVlogPost",
    message: "Normalizing vlog post tags shape",
    data: {
      id: post?.id ?? null,
      slug: post?.slug ?? null,
      tagsType: Array.isArray(post?.tags) ? "array" : typeof post?.tags,
      tagsPreview:
        Array.isArray(post?.tags) || typeof post?.tags === "string"
          ? String(post?.tags).slice(0, 120)
          : null,
    },
  });
  // #endregion
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
    // #region agent log
    sendDebugLog({
      runId: "pre-fix",
      hypothesisId: "H3",
      location: "frontend/lib/api/vlogs.ts:fetchVlogPostBySlug",
      message: "Fetching vlog post by slug",
      data: { slug, isServer: typeof window === "undefined" },
    });
    // #endregion
    const isServer = typeof window === "undefined";
    const post = await fetchAPI<any>(`${API_BASE_URL}/api/vlog/${slug}/`, {
      ...(isServer
        ? { next: { revalidate: VLOG_REVALIDATE_SECONDS } }
        : { cache: "no-store" }),
    });
    // #region agent log
    sendDebugLog({
      runId: "pre-fix",
      hypothesisId: "H2",
      location: "frontend/lib/api/vlogs.ts:fetchVlogPostBySlug",
      message: "Fetched raw vlog post tags shape",
      data: {
        slug,
        id: post?.id ?? null,
        tagsType: Array.isArray(post?.tags) ? "array" : typeof post?.tags,
        hasTagsLength: Boolean(post?.tags?.length),
      },
    });
    // #endregion
    return normalizeVlogPost(post);
  } catch (error) {
    console.error(`Error fetching vlog post ${slug}:`, error);
    return null;
  }
}
