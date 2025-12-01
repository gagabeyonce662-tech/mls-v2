import { Calendar, User, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ds } from "@/lib/design-system-utils";
import { colors } from "@/config/design-system";

export function generateStaticParams() {
  // Generate params for blog slugs (1-6 for now)
  return [
    { slug: '1' },
    { slug: '2' },
    { slug: '3' },
    { slug: '4' },
    { slug: '5' },
    { slug: '6' },
  ];
}

export default function BlogPostPage() {
  // Mock data - replace with actual data fetching
  const post = {
    id: 1,
    title: "Mastering negotiations tips for buyers and sellers",
    slug: "mastering-negotiations-tips",
    excerpt: "Euth-tenant architecture supporting unlimited clients and 10,000+ concurrent connections. Learn the essential skills needed to negotiate successfully in today's real estate market.",
    content: `
      <p>Real estate negotiations can be one of the most challenging aspects of buying or selling a property. Whether you're a first-time buyer or an experienced investor, mastering the art of negotiation is crucial for getting the best deal possible.</p>

      <h2>Understanding the Market</h2>
      <p>Before entering any negotiation, it's essential to understand the current market conditions. Are we in a buyer's market or a seller's market? What are comparable properties selling for in the area? This knowledge gives you leverage and confidence during negotiations.</p>

      <h2>Key Negotiation Strategies</h2>
      <p>Successful negotiations require preparation, patience, and strategy. Here are some proven tactics:</p>
      
      <ul>
        <li><strong>Do Your Research:</strong> Know the property's history, comparable sales, and any issues that might affect value.</li>
        <li><strong>Set Your Limits:</strong> Determine your maximum price or minimum acceptable offer before negotiations begin.</li>
        <li><strong>Stay Emotionally Detached:</strong> Don't let emotions drive your decisions. Treat it as a business transaction.</li>
        <li><strong>Listen Actively:</strong> Understanding the other party's motivations can help you craft better offers.</li>
        <li><strong>Be Willing to Walk Away:</strong> Sometimes the best negotiation tactic is being prepared to decline.</li>
      </ul>

      <h2>Common Mistakes to Avoid</h2>
      <p>Many buyers and sellers make critical errors during negotiations that cost them money or opportunities:</p>
      
      <ul>
        <li>Making the first offer without proper research</li>
        <li>Revealing your maximum budget or minimum price</li>
        <li>Ignoring contingencies and inspection results</li>
        <li>Being too aggressive or too passive</li>
        <li>Not having proper representation</li>
      </ul>

      <h2>Working with Real Estate Professionals</h2>
      <p>A skilled real estate agent can be invaluable during negotiations. They bring market knowledge, experience, and objectivity to the table. They can also handle difficult conversations and help you avoid common pitfalls.</p>

      <h2>Conclusion</h2>
      <p>Mastering real estate negotiations takes time and practice, but the rewards are worth it. By understanding market conditions, preparing thoroughly, and employing smart strategies, you can achieve better outcomes whether buying or selling property.</p>
    `,
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80",
    category: "Industry Trends",
    author: "Sarah Johnson",
    publishDate: "November 28, 2025",
    readTime: "8 min read"
  };

  const relatedPosts = [
    {
      id: 2,
      title: "How location impacts property value insights buyer needs",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80",
      category: "Real Estate Strategies",
    },
    {
      id: 3,
      title: "The Power of Natural Light in Architectural Design",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
      category: "Finance",
    },
    {
      id: 4,
      title: "Market Analysis for Smart Investments",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80",
      category: "Property Value",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/blog" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Blogs</span>
          </Link>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-[400px] bg-cover bg-center" style={{ backgroundImage: `url('${post.image}')` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-12">
          <div className="max-w-4xl">
            <span className="inline-block px-3 py-1.5 rounded-md text-sm font-semibold mb-4" style={{ backgroundColor: colors.icon, color: colors.cards }}>
              {post.category}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-6 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{post.publishDate}</span>
              </div>
              <span>{post.readTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Article Content */}
          <div className="lg:col-span-2">
            {/* Share Buttons */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Share:</span>
                <button className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <Facebook className="w-4 h-4 text-white" />
                </button>
                <button className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center hover:bg-sky-600 transition-colors">
                  <Twitter className="w-4 h-4 text-white" />
                </button>
                <button className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center hover:bg-blue-800 transition-colors">
                  <Linkedin className="w-4 h-4 text-white" />
                </button>
                <button className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                  <Share2 className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Article Body */}
            <div 
              className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:text-gray-700 prose-li:text-gray-700"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Author Box */}
            <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                  {post.author.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">About {post.author}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {post.author} is a real estate expert with over 10 years of experience in property negotiations and market analysis. She has helped hundreds of clients successfully buy and sell properties across the country.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Related Posts */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Related Articles</h3>
              <div className="space-y-6">
                {relatedPosts.map((relatedPost) => (
                  <Link 
                    key={relatedPost.id} 
                    href={`/blog/${relatedPost.id}`}
                    className="block group"
                  >
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <img
                          src={relatedPost.image}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="inline-block text-xs font-semibold mb-1" style={{ color: colors.icon }}>
                          {relatedPost.category}
                        </span>
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {relatedPost.title}
                        </h4>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Newsletter */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Subscribe to Newsletter</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get the latest real estate insights delivered to your inbox.
                </p>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
