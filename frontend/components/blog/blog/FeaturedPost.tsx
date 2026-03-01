"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Clock, User } from "lucide-react";

const FeaturedPost = ({ post }: any) => {
  const [posts, setPosts] = useState(post || {});

  useEffect(() => {
    setPosts(post);
  }, [post]);

  return (
    <article className="relative bg-white rounded-2xl shadow-lg overflow-hidden group border border-gray-200">
      <div className="lg:flex">
        {/* Image and featured tag */}
        <div className="relative lg:w-1/2 overflow-hidden">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            {posts.title}
          </p>
          <p className="text-gray-600 mb-4">{posts.excerpt}</p>
          <Image
            src={posts.image}
            alt={posts.title}
            width={600}
            height={400}
            className="w-full h-64 lg:h-full object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
          <div className="absolute top-6 left-6 z-10">
            <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md">
              Featured
            </span>
          </div>
        </div>

        {/* Post Details */}
        <div className="p-8 lg:w-1/2 lg:flex lg:flex-col lg:justify-center bg-gradient-to-r from-blue-50 via-blue-100 to-blue-200">
          {/* Category */}
          <div className="mb-4">
            <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
              {posts?.category?.name}
            </span>
          </div>

          {/* Post Title */}
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
            {posts.title}
          </h2>

          {/* Post Excerpt */}
          <p className="text-gray-700 mb-6 text-lg leading-relaxed">
            {posts.excerpt}
          </p>

          {/* Meta Information */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                {/* <span className="font-medium">{posts.author}</span> */}
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-600" />
                {/* <span>{posts.readTime}</span> */}
              </div>
            </div>
            {/* <span className="font-medium">{posts.date}</span> */}
          </div>

          {/* Read Button */}
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium w-fit">
            Read Article
          </button>
        </div>
      </div>
    </article>
  );
};

export default FeaturedPost;
