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

interface BlogCardProps {
  post: BlogPost;
}

const getCategoryColor = (category: string) => {
  const colors = {
    Technology: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Design: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    Business: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  };
  return colors[category as keyof typeof colors] || 'bg-muted text-muted-foreground';
};

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  return (
    <article className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-border">
      <div className="relative overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
            {post.category}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-card-foreground mb-3 group-hover:text-estate-teal-700 transition-colors line-clamp-2">
          {post.title}
        </h3>
        
        <p className="text-muted-foreground mb-4 line-clamp-3 text-sm leading-relaxed">
          {post.excerpt}
        </p>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{post.readTime}</span>
            </div>
          </div>
          <span>{post.date}</span>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
