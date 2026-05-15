import type { Config } from "tailwindcss";

const config: Config = {
  // darkMode: ['class'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        "3xl": "1800px",
        "4xl": "2200px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        inter: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        // Design System Colors
        "ds-primary": "#1E3A8A",
        "ds-border": "#FFFFFF",
        "ds-card": "#F5F5F5",
        "ds-card-border": "#E5E5E5",
        "ds-icon": "#000000",
        "ds-heading": "#000000",
        "ds-body": "#4B5563",

        // Legacy colors (keeping for backward compatibility)
        "estate-teal": { 700: "#346655", 800: "#2d5a4a" },
        "estate-orange": { 600: "#fd6000", 700: "#e55500" },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontSize: {
        // Fluid headings using clamp() for smooth scaling across viewports & zoom levels
        "ds-h1": [
          "clamp(2rem, 4vw, 3rem)",
          { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        "ds-h1-regular": [
          "clamp(1.75rem, 3vw, 2rem)",
          { lineHeight: "1.3", fontWeight: "400" },
        ],
        "ds-h2": [
          "clamp(1.75rem, 3.5vw, 2.5rem)",
          { lineHeight: "1.2", fontWeight: "600" },
        ],
        "ds-h2-regular": [
          "clamp(1.5rem, 2.5vw, 1.75rem)",
          { lineHeight: "1.4", fontWeight: "400" },
        ],
        "ds-h3": [
          "clamp(1.5rem, 3vw, 2rem)",
          { lineHeight: "1.25", fontWeight: "600" },
        ],
        "ds-h3-regular": [
          "clamp(1.25rem, 2vw, 1.5rem)",
          { lineHeight: "1.5", fontWeight: "400" },
        ],
        "ds-h4": [
          "clamp(1.25rem, 2vw, 1.5rem)",
          { lineHeight: "1.3", fontWeight: "600" },
        ],
        "ds-h4-regular": [
          "clamp(1.125rem, 1.5vw, 1.25rem)",
          { lineHeight: "1.5", fontWeight: "400" },
        ],
        "ds-h5": [
          "clamp(1.125rem, 1.5vw, 1.25rem)",
          { lineHeight: "1.4", fontWeight: "600" },
        ],
        "ds-h5-regular": [
          "clamp(1rem, 1.25vw, 1.125rem)",
          { lineHeight: "1.5", fontWeight: "400" },
        ],
        // Body sizes - using rem for zoom-friendliness
        "ds-text": ["1rem", { lineHeight: "1.6", fontWeight: "600" }],
        "ds-text-regular": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        "ds-body": ["0.875rem", { lineHeight: "1.6", fontWeight: "600" }],
        "ds-body-regular": [
          "0.875rem",
          { lineHeight: "1.6", fontWeight: "400" },
        ],
        "ds-small": ["0.75rem", { lineHeight: "1.5", fontWeight: "600" }],
        "ds-small-regular": [
          "0.75rem",
          { lineHeight: "1.5", fontWeight: "400" },
        ],
        "ds-caption": ["0.625rem", { lineHeight: "1.4", fontWeight: "400" }],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
  ],
};

export default config;
