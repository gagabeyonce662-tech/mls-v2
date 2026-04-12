"use client";

import { useState, useEffect } from "react";
import BlogCard from "./blog/BlogCard";
import AdCard from "./blog/AdCard";
import FeaturedPost from "./blog/FeaturedPost";
import Newsletter from "./blog/Newsletter";
import { fetchVlogPosts } from "@/lib/api";
import { BlogPost } from "@/types/blogPost";

export default function BlogContent() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const getBlogPosts = async () => {
      const data = await fetchVlogPosts();
      setBlogPosts(data as unknown as BlogPost[]);
    };
    getBlogPosts();
  }, []);

  const featuredPost = blogPosts.find((post) => post.featured);
  const regularPosts = blogPosts.filter((post) => !post.featured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        <main className="lg:col-span-3">
          <div className="space-y-8">
            {featuredPost && <FeaturedPost post={featuredPost} />}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Latest Articles
              </h2>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {regularPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          </div>
        </main>
        <aside className="mt-8 lg:mt-0">
          <div className="space-y-8 lg:sticky lg:top-8">
            <AdCard
              title="Boost Your Development Skills"
              description="Join thousands of developers learning with our premium courses"
              buttonText="Start Learning"
              image="https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=400"
              color="bg-gradient-to-br from-blue-500 to-purple-600"
            />
            <Newsletter />
            <AdCard
              title="Professional Tools"
              description="Get 50% off on premium development tools and resources"
              buttonText="Get Discount"
              color="bg-gradient-to-br from-green-500 to-teal-600"
            />
            <AdCard
              title="Web Hosting"
              description="Fast, reliable hosting for your next project. Free SSL included"
              buttonText="Learn More"
              color="bg-gradient-to-br from-orange-500 to-red-600"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
