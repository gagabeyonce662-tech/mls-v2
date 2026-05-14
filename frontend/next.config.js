const path = require("path");
const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
let apiRemotePattern = null;
try {
  if (apiUrl) {
    const parsed = new URL(apiUrl);
    apiRemotePattern = {
      protocol: parsed.protocol.replace(":", ""),
      hostname: parsed.hostname,
      ...(parsed.port ? { port: parsed.port } : {}),
    };
  }
} catch {
  apiRemotePattern = null;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(__dirname, ".."),

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
        protocol: "http",
        hostname: "192.168.1.29",
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
        hostname: "mls-backend-v2.vercel.app",
      },
      {
        protocol: "https",
        hostname: "estate-4u.com",
      },
      {
        protocol: "https",
        hostname: "www.estate-4u.com",
      },
      {
        protocol: "https",
        hostname: "estate4u.ca",
      },
      {
        protocol: "https",
        hostname: "www.estate4u.ca",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      ...(apiRemotePattern ? [apiRemotePattern] : []),
    ],
  },

  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
};

module.exports = withNextIntl(nextConfig);
