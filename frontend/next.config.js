/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Optional: Static export (only needed if you're exporting the project)
  eslint: {
    ignoreDuringBuilds: true, // Ignores ESLint errors during builds
  },
  images: {
    unoptimized: true, // Optional: Disable image optimization (useful for static exports)
  },
  reactStrictMode: true, // Optional: Enable React Strict Mode for development
};

module.exports = nextConfig;
