"use client";

import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import BlogCard from "../../../components/blog/blog/BlogCard";
import AdCard from "../../../components/blog/blog/AdCard";
import FeaturedPost from "../../../components/blog/blog/FeaturedPost";
import Newsletter from "../../../components/blog/blog/Newsletter";
import { fetchBlogPosts } from "../../../utils/api";
import { BlogPost } from "../../../types/blogPost";
import {
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export default function BlogPage() {
  const queryClient = useQueryClient();
  const { data: blogPosts, isLoading: loading } = useQuery({
    queryKey: ["blogPost"],
    queryFn: fetchBlogPosts,
  });

  if (loading) {
    return <div className="p-8 text-center">Loading blog posts...</div>;
  }

  if (!blogPosts.length) {
    return <div className="p-8 text-center">No blog posts found</div>;
  }

  const featuredPost = blogPosts[0]; // for now take the first as featured
  const regularPosts = blogPosts.slice(1);

  return (
    <QueryClientProvider client={queryClient}>
      <div
        className="min-h-screen"
        style={{ backgroundColor: "rgb(202, 192, 219, 31%)" }}
      >
        <Header />
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
      </div>
    </QueryClientProvider>
  );
}
