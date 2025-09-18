// utils/api.ts
import { BlogPost } from "../types/blogPost";

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vlog/`, {
    });

    if (!res.ok) {
      throw new Error("Failed to fetch blog posts");
    }

    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}
