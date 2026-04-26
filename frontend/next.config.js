const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
      },
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
  turbopack: {
    root: path.resolve(__dirname),
  },
};

module.exports = nextConfig;
