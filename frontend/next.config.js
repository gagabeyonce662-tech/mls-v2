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
        hostname: "ddfcdn.realtor.ca",
      },
      {
        protocol: "https",
        hostname: "staging.vsell4u.ca",
      },
      {
        protocol: "http",
        hostname: "staging.vsell4u.ca",
      },
      {
        protocol: "https",
        hostname: "estate-4u.com",
      },
    ],
  },

  reactStrictMode: true,
};

module.exports = nextConfig;
