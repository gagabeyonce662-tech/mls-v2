/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Ignores ESLint errors during builds
  },
  images: {
    domains: ['images.unsplash.com', 'i.pravatar.cc'], // Add domains for external images
  },
  reactStrictMode: true, // Optional: Enable React Strict Mode for development
};

module.exports = nextConfig;
