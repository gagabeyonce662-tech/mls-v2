"use client";
import { useState, useEffect, use } from "react";
import { useParams } from "next/navigation";
import { fetchBlogPosts } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";

export default function BlogPostPage() {
  const params = useParams();
  const slug = use(Promise.resolve(params)).slug;

  const { data, isLoading, error } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: fetchBlogPosts,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold">{data.title}</h1>
      <p className="text-lg">{data.content}</p>
    </div>
  );
}
