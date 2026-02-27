/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['images.unsplash.com', 'i.pravatar.cc', 'estate-4u.com'], // Add domains for external images
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
