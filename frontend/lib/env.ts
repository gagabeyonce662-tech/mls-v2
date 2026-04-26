import { z } from "zod";

/**
 * Define your server and client-side environment variables here.
 * Zod will strictly validate that they are present and properly formatted
 * before your app is allowed to build or start.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Client-side accessible variables must start with NEXT_PUBLIC_
  NEXT_PUBLIC_API_URL: z
    .string()
    .url("Must be a valid URL (e.g., https://api.yoursite.com)"),
  NEXT_PUBLIC_ADMIN_PASSPHRASE: z
    .string()
    .min(1, "Admin passphrase cannot be empty"),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_API_TOKEN: z.string().optional(),
});

// Next.js client-side requires explicit destructuring of process.env keys at build time.
// We provide safe fallbacks for development to prevent locking out local developers,
// but in production, missing these will throw loud errors.
const isDev = process.env.NODE_ENV !== "production";

const _env = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL:
    process.env.NEXT_PUBLIC_API_URL ||
    (isDev ? "https://staging.vsell4u.ca" : undefined),
  NEXT_PUBLIC_ADMIN_PASSPHRASE:
    process.env.NEXT_PUBLIC_ADMIN_PASSPHRASE ||
    (isDev ? "dev-admin-passphrase" : undefined),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (isDev ? "dev-maps-key" : undefined),
  NEXT_PUBLIC_API_TOKEN: process.env.NEXT_PUBLIC_API_TOKEN,
});

if (!_env.success) {
  // We format the Zod errors to be highly readable in the console
  console.error("❌ Invalid environment variables:");
  const formattedErrors = _env.error.format();

  Object.keys(formattedErrors).forEach((key) => {
    if (key !== "_errors") {
      // @ts-ignore
      console.error(`  - ${key}: ${formattedErrors[key]._errors.join(", ")}`);
    }
  });

  throw new Error("Invalid environment variables");
}

export const env = _env.data;
