import React from 'react';
import { Clock, User } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
}

interface FeaturedPostProps {
  post: BlogPost;
}

const FeaturedPost: React.FC<FeaturedPostProps> = ({ post }) => {
  return (
    <article className="relative bg-white rounded-2xl shadow-lg overflow-hidden group border border-gray-100">
      <div className="lg:flex">
        <div className="relative lg:w-1/2 overflow-hidden">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-64 lg:h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-6 left-6">
            <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
              Featured
            </span>
          </div>
        </div>
        
        <div className="p-8 lg:w-1/2 lg:flex lg:flex-col lg:justify-center">
          <div className="mb-4">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {post.category}
            </span>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
            {post.title}
          </h2>
          
          <p className="text-gray-600 mb-6 text-lg leading-relaxed">
            {post.excerpt}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span className="font-medium">{post.author}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>{post.readTime}</span>
              </div>
            </div>
            <span className="font-medium">{post.date}</span>
          </div>
          
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium w-fit">
            Read Article
          </button>
        </div>
      </div>
    </article>
  );
};

export default FeaturedPost;
