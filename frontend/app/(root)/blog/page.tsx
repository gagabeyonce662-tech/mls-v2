import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ds } from "@/lib/design-system-utils";

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: "Mastering negotiations tips for buyers and sellers",
      excerpt: "Euth-tenant architecture supporting unlimited clients and 10,000+ concurrent",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80",
      category: "Industry Trends",
    },
    {
      id: 2,
      title: "How location impacts property value insights buyer needs",
      excerpt: "Euth-tenant architecture supporting unlimited clients and 10,000+ concurrent",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
      category: "Real Estate Strategies",
    },
    {
      id: 3,
      title: "The Power of Natural Light in Architectural Design",
      excerpt: "Euth-tenant architecture supporting unlimited clients and 10,000+ concurrent",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
      category: "Finance",
    },
    {
      id: 4,
      title: "Mastering negotiations tips for buyers and sellers",
      excerpt: "Euth-tenant architecture supporting unlimited clients and 10,000+ concurrent",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80",
      category: "Industry Trends",
    },
    {
      id: 5,
      title: "How location impacts property value insights buyer needs",
      excerpt: "Euth-tenant architecture supporting unlimited clients and 10,000+ concurrent",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
      category: "Real Estate Strategies",
    },
    {
      id: 6,
      title: "The Power of Natural Light in Architectural Design",
      excerpt: "Euth-tenant architecture supporting unlimited clients and 10,000+ concurrent",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
      category: "Finance",
    },
  ];

  const topCategories = [
    "Industry Trends",
    "Real Estate Strategies",
    "Finance",
    "Property Value",
    "Market Tips",
    "Investments",
    "Tips"
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section with Background Image */}
      <div className="relative h-[500px] md:h-[550px] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80')" }}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-white text-sm">Our Blogs</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              Discover Your Perfect Property In Your City
            </h1>
            <p className="text-white/90 text-base md:text-lg">
              Egou picturesque river views, modern amenities, and a serene lifestyle perfect for families and professionals alike.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center gap-3">
            {topCategories.map((category) => (
              <button
                key={category}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {category}
              </button>
            ))}
            <div className="ml-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <svg 
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Blogs Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section Header */}
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Blogs</h2>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {blogPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              {/* Image */}
              <div className="relative h-56">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-cyan-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold">
                    {post.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                  {post.excerpt}
                </p>
                
                <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors w-full">
                  Read Now
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article key={`second-${post.id}`} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              {/* Image */}
              <div className="relative h-56">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-cyan-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold">
                    {post.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                  {post.excerpt}
                </p>
                
                <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors w-full">
                  Read Now
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}