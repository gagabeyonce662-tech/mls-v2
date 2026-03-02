/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "estate-4u.com",
      },
      {
        protocol: "https",
        hostname: "ddfcdn.realtor.ca",
      },
      {
        protocol: "https",
        hostname: "staging.vsell4u.ca",
      },
    ],
  },

  reactStrictMode: true,
};

module.exports = nextConfig;
