import React from 'react';
import { Search, Menu, User } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-estate-teal-800 font-montserrat">TechBlog</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-muted-foreground hover:text-estate-teal-700 px-3 py-2 text-sm font-medium transition-colors">Home</a>
            <a href="#" className="text-muted-foreground hover:text-estate-teal-700 px-3 py-2 text-sm font-medium transition-colors">Technology</a>
            <a href="#" className="text-muted-foreground hover:text-estate-teal-700 px-3 py-2 text-sm font-medium transition-colors">Design</a>
            <a href="#" className="text-muted-foreground hover:text-estate-teal-700 px-3 py-2 text-sm font-medium transition-colors">Business</a>
            <a href="#" className="text-muted-foreground hover:text-estate-teal-700 px-3 py-2 text-sm font-medium transition-colors">About</a>
          </nav>

          {/* Search and Actions */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search articles..."
                className="w-64 pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            </div>
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <User className="h-6 w-6" />
            </button>
            <button className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
