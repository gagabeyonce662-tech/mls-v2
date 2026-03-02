"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogClient from "@/components/blog/BlogClient";
import { colors } from "@/config/design-system";
import { fetchVlogPosts, VlogPost } from "@/lib/api";

export default function BlogPage() {
  const [vlogPosts, setVlogPosts] = useState<VlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch blog posts from API on component mount
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      const posts = await fetchVlogPosts();
      setVlogPosts(posts);
      setLoading(false);
    };

    loadPosts();
  }, []);

  // Extract unique categories from posts
  const categories = Array.from(
    new Set(
      vlogPosts
        .map((post) => post.category?.name)
        .filter((name): name is string => !!name),
    ),
  );

  // Fallback image for posts without thumbnails
  const fallbackImage =
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80";

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div
            className="animate-spin h-12 w-12 border-b-2 rounded-full"
            style={{ borderColor: colors.primary }}
          ></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section with Background Image */}
      <div
        className="relative h-[500px] md:h-[550px] bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="text-white text-sm">Our Blogs</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Discover Your Perfect Property In Your City
            </h1>
            <p className="text-white/90 text-base md:text-lg">
              Egou picturesque river views, modern amenities, and a serene
              lifestyle perfect for families and professionals alike.
            </p>
          </div>
        </div>
      </div>

      {/* Blog Content with Client-side filtering */}
      <BlogClient
        posts={vlogPosts}
        categories={categories}
        fallbackImage={fallbackImage}
      />

      <Footer />
    </div>
  );
}
