import {
  Calendar,
  User,
  ArrowLeft,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";

import { colors } from "@/config/design-system";
import { fetchVlogPostBySlug, fetchVlogPosts } from "@/lib/api";
import { env } from "@/lib/env";

export async function generateStaticParams() {
  try {
    // Fetch all blog posts and generate params for their slugs
    const posts = await fetchVlogPosts();
    return posts.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPostPage(props: BlogPostPageProps) {
  const params = await props.params;
  const post = await fetchVlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  // Fetch related posts for sidebar
  const allPosts = await fetchVlogPosts();
  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id && p.category?.name === post.category?.name)
    .slice(0, 3);

  const fallbackImage =
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80";

  const getImageUrl = (imageUrl: string | undefined) => {
    if (!imageUrl) return fallbackImage;
    if (imageUrl.startsWith("/")) {
      return `${env.NEXT_PUBLIC_API_URL}${imageUrl}`;
    }
    return imageUrl;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getEmbedUrl = (url: string) => {
    // Convert YouTube URLs to embed format
    if (url.includes("youtube.com/watch")) {
      const videoId = new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1].split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Convert Vimeo URLs to embed format
    if (url.includes("vimeo.com/")) {
      const videoId = url.split("vimeo.com/")[1].split("?")[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    // Return as-is if already an embed URL or other format
    return url;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Blogs</span>
          </Link>
        </div>
      </div>

      {/* Hero Image */}
      <div
        className="relative h-[400px] bg-cover bg-center"
        style={{ backgroundImage: `url('${getImageUrl(post.thumbnail)}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-12">
          <div className="max-w-4xl">
            {post.category && (
              <span
                className="inline-block px-3 py-1.5 rounded-md text-sm font-semibold mb-4"
                style={{ backgroundColor: colors.icon, color: colors.cards }}
              >
                {post.category.name}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-6 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author || "Editorial Team"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.publish_date || post.created_at)}</span>
              </div>
              {post.status && (
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    post.status === "published"
                      ? "bg-green-500 text-white"
                      : "bg-yellow-500 text-black"
                  }`}
                >
                  {post.status.toUpperCase()}
                </span>
              )}
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
                <span className="text-sm font-medium text-gray-700">
                  Share:
                </span>
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

            {/* Video Section - Handle both embed_url and video_file */}
            {(post.embed_url || post.video_file) && (
              <div className="mt-8">
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: colors.heading }}
                >
                  Watch Video
                </h3>

                {/* Embedded Video (YouTube/Vimeo) */}
                {post.embed_url && (
                  <div
                    className="relative w-full"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    <iframe
                      src={getEmbedUrl(post.embed_url)}
                      title={post.title}
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      allowFullScreen
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                )}

                {/* Uploaded Video File */}
                {!post.embed_url && post.video_file && (
                  <div className="relative w-full">
                    <video
                      controls
                      className="w-full h-auto rounded-lg"
                      poster={getImageUrl(post.thumbnail)}
                    >
                      <source
                        src={
                          post.video_file.startsWith("/")
                            ? `${env.NEXT_PUBLIC_API_URL}${post.video_file}`
                            : post.video_file
                        }
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
              </div>
            )}

            {/* Tags Section */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Article Metadata */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Article Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Published:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {post.publish_date
                      ? formatDate(post.publish_date)
                      : "Not published"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {formatDate(post.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {formatDate(post.updated_at)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Comments:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {post.allow_comments ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            {/* Author Box */}
            <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: colors.primary }}
                >
                  A
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    About the Author
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {post.author || "Not Mentioned"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Related Posts */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Related Articles
              </h3>
              <div className="space-y-6">
                {relatedPosts.length > 0 ? (
                  relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.id}
                      href={`/blog/${relatedPost.slug}`}
                      className="block group"
                    >
                      <div className="flex gap-4">
                        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={getImageUrl(relatedPost.thumbnail)}
                            alt={relatedPost.title}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1">
                          {relatedPost.category && (
                            <span
                              className="inline-block text-xs font-semibold mb-1"
                              style={{ color: colors.icon }}
                            >
                              {relatedPost.category.name}
                            </span>
                          )}
                          <h4
                            className="text-sm font-semibold line-clamp-2 group-hover:opacity-80 transition-colors"
                            style={{ color: colors.heading }}
                          >
                            {relatedPost.title}
                          </h4>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm" style={{ color: colors.body }}>
                    No related articles found.
                  </p>
                )}
              </div>

              {/* Newsletter */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Subscribe to Newsletter
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get the latest real estate insights delivered to your inbox.
                </p>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <button
                  className="w-full py-2.5 rounded-lg font-semibold transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.cards,
                  }}
                >
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
