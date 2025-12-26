export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  embed_url?: string;
  video_file?: string;
  thumbnail: string;
  author: number | string; // could later be an object if you expose author details
  category: {
    id: number;
    name: string;
    slug: string;
  };
  tags: string;
  status: string;
  publish_date: string;
  views?: number;
  created_at: string;
  updated_at: string;
  allow_comments: boolean;
  featured?: boolean; // you can mark this manually if needed
}
