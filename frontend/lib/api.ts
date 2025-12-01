// API Base URL - Update this to your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface VlogCategory {
  id: number;
  name: string;
  slug: string;
}

export interface VlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  category: VlogCategory | null;
  author: string;
  publish_date: string;
  created_at: string;
  updated_at: string;
}

export async function fetchVlogPosts(): Promise<VlogPost[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/vlog/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Disable caching for fresh data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch blog posts: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching vlog posts:', error);
    return [];
  }
}

export async function fetchVlogPostBySlug(slug: string): Promise<VlogPost | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/vlog/${slug}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch blog post: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching vlog post:', error);
    return null;
  }
}
