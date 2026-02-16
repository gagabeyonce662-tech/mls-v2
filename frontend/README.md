# vSell4u — Real Estate Frontend

A premium Canadian real estate listing platform built with **Next.js 13**, **TypeScript**, **Tailwind CSS**, and **Radix UI**. The frontend connects to a Django REST API backend for property data and serves as the public-facing website for **Gunneet Singh**, a Toronto-based realtor.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Architecture](#project-architecture)
3. [Pages & Routes](#pages--routes)
4. [API Integration](#api-integration)
5. [Design System](#design-system)
6. [Key Components](#key-components)
7. [Environment Variables](#environment-variables)
8. [Docker Deployment](#docker-deployment)
9. [Design Decisions & Audit](#design-decisions--audit)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- **Node.js** 18+ (tested with v22)
- **npm** 9+

### Install & Run

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Create environment file (if not present)
cp .env.example .env.local

# 3. Start development server
npm run dev
```

The site will be available at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

---

## Project Architecture

```text
frontend/
├── app/                        # Next.js 13 App Router
│   ├── (root)/                 # Route group (shared layout)
│   │   ├── page.tsx            # Homepage
│   │   ├── listing/            # Property listing pages
│   │   ├── Precon/             # Pre-construction listings
│   │   ├── blog/               # Vlog/blog section
│   │   ├── compare/            # Property comparison tool
│   │   ├── map-search/         # Map-based property search
│   │   └── valuation/          # Home valuation tool
│   ├── layout.tsx              # Root layout (fonts, providers)
│   └── globals.css             # Global styles & design tokens
│
├── components/
│   ├── homepage/               # Homepage-specific components (21 files)
│   ├── listing/                # Property detail components
│   ├── blog/                   # Blog components
│   ├── map/                    # Map search components
│   └── ui/                     # Reusable UI primitives (Radix-based)
│
├── config/
│   └── design-system.ts        # Centralized design tokens (colors, typography, spacing)
│
├── contexts/
│   └── ProvinceContext.tsx     # Province selection state (React Context)
│
├── lib/
│   ├── api.ts                  # All API calls to backend (THE key file)
│   ├── helpers.ts              # Utility helpers
│   ├── utils.ts                # Generic utilities (cn(), etc.)
│   └── design-system-utils.ts  # Design system helper functions
│
├── tailwind.config.ts          # Tailwind configuration (fluid typography, colors)
├── .env.local                  # Environment variables (API URL, map tokens)
└── Dockerfile.dev              # Docker build for production deployment
```

---

## Pages & Routes

| Route | Page | Description |
| :--- | :--- | :--- |
| `/` | Homepage | Hero search, featured collections, property listings (exclusive, newly listed, rental, pre-construction), locations, mortgage calculator, client reviews |
| `/listing` | All Listings | Browse all exclusive properties with filters |
| `/listing/[id]` | Property Detail | Full property page with gallery, details, rooms, map, nearby schools |
| `/listing/rental` | Rental Listings | Browse rental/lease properties |
| `/listing/rental/[id]` | Rental Detail | Individual rental property page |
| `/Precon` | Pre-Construction | Pre-construction property listings |
| `/compare` | Compare Properties | Side-by-side comparison of up to 4 properties |
| `/map-search` | Map Search | Interactive Leaflet map with property pins and drawing tools |
| `/blog` | Blog/Vlog | Video blog posts and articles |
| `/blog/[slug]` | Blog Post | Individual blog/vlog post |
| `/valuation` | Home Valuation | Home value estimation tool |

---

## API Integration

### Connection

All API calls are centralized in **`lib/api.ts`**. The base URL is configured via an environment variable:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://staging.vsell4u.ca';
```

### Backend Endpoints Used

The frontend calls these Django REST API endpoints:

| Frontend Function | Backend Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| `fetchExclusiveProperties()` | `/api/mls/properties/exclusive-properties/` | GET | Featured/exclusive listings with filters |
| `fetchNewlyListedProperties()` | `/api/mls/properties/newly-listed-properties/` | GET | Recently added listings |
| `fetchLeaseProperties()` | `/api/mls/properties/lease-properties/` | GET | Rental properties |
| `fetchPreConnProperties()` | `/api/mls/properties/pre-conn-properties/` | GET | Pre-construction listings |
| `fetchPropertyByKey()` | `/api/mls/properties/{PropertyKey}/` | GET | Single property detail |
| `fetchCompareProperties()` | `/api/mls/properties/comapare/` | GET | Compare multiple properties by listing_key |
| `fetchFilteredProperties()` | `/api/mls/properties/filter/` | GET | MLS filter search (province, status, etc.) |
| `fetchVlogPosts()` | `/api/vlog/` | GET | Blog/vlog posts |
| `fetchVlogPostBySlug()` | `/api/vlog/{slug}/` | GET | Individual blog post |
| `uploadPreConnProperties()` | `/api/mls/properties/pre-conn-properties/` | POST | Upload pre-construction CSV |

### Shared Filter Parameters

Most property endpoints accept these query parameters:

```text
?limit=6                    # Number of results per page
&offset=0                   # Pagination offset
&city=Toronto               # Filter by city
&province=ON                # Filter by province (2-letter code)
&price_min=200000           # Minimum price
&price_max=1000000          # Maximum price
&bedrooms=3                 # Minimum bedrooms
&bathrooms=2                # Minimum bathrooms
&property_sub_type=Detached # Property type filter
&standard_status=Active     # Listing status
```

### Data Mapping

The backend returns snake_case fields. The `mapPropertyFromAPI()` function in `lib/api.ts` normalizes these to a unified `Property` interface that components consume. This handles:

- Address construction from component parts (`street_number`, `street_name`, `street_suffix`, etc.)
- Price parsing from string to number
- Media normalization (handles single object, array, or string formats)
- Room data normalization
- Legacy field mapping for backward compatibility

---

## Design System

### Location

- **Tokens:** `config/design-system.ts` — colors, typography scales, spacing, shadows
- **Tailwind Config:** `tailwind.config.ts` — fluid typography with `clamp()`, custom colors
- **Global Styles:** `app/globals.css` — base styles, utility classes

### Colors

| Token | Value | Usage |
| :--- | :--- | :--- |
| `colors.primary` | `#1a2f5a` (Dark Navy) | Headings, prices, CTAs |
| `colors.boarder` | `#e5e5e5` (Light Gray) | Borders, dividers |
| `colors.cards` | `#ffffff` (White) | Card backgrounds |
| `colors.heading` | `#000000` (Black) | Section headings |

### Typography (Fluid)

All headings use `clamp()` for smooth scaling across screen sizes:

| Class | Range | Usage |
| :--- | :--- | :--- |
| `text-ds-h1` | 32px → 48px | Hero headlines |
| `text-ds-h2` | 28px → 40px | Section titles |
| `text-ds-h3` | 24px → 32px | Sub-section titles |
| `text-ds-h4` | 20px → 24px | Card headers |
| `text-ds-h5` | 18px → 20px | Small headings |
| `text-ds-text` | 16px (1rem) | Body text |
| `text-ds-body` | 14px (0.875rem) | Secondary body text |

### Spacing

| Token | Value | Usage |
| :--- | :--- | :--- |
| `xs` | 4px | Tight spacing within components |
| `sm` | 8px | Element gaps |
| `md` | 16px | Component padding |
| `lg` | 24px | Card padding |
| `xl` | 32px | Section inner spacing |
| `2xl` | 48px | Between related sections |
| `3xl` | 64px | Between major sections |

### Layout Constants

- **Max container width:** `1320px` (real estate industry standard)
- **Section spacing:** `clamp(3rem, 6vw, 6rem)` — 48px mobile → 96px desktop
- **Body line-height:** `1.6` (premium readability)

---

## Key Components

### Homepage (`components/homepage/`)

| Component | Description |
| :--- | :--- |
| `HeroSection.tsx` | Full-width hero with animated search bar, city suggestions, property type tabs |
| `FeaturedCollections.tsx` | 4 curated collection cards (Pre-construction, Newly Listed, etc.) |
| `FeaturedListings.tsx` | Grid of exclusive property cards with image carousel, price, beds/baths |
| `NewlyListedListings.tsx` | Recently added properties (uses newly-listed endpoint) |
| `RentalProperties.tsx` | Lease listings with "/month" pricing |
| `PreConstructionProperties.tsx` | Pre-construction cards with "From $X" pricing and ribbon badges |
| `LocationsSection.tsx` | Scrolling marquee of popular Ontario cities |
| `MortgageSection.tsx` | Interactive mortgage payment calculator |
| `ClientReviews.tsx` | Testimonial cards (currently hardcoded — see notes below) |
| `SearchResults.tsx` | Dynamic search results grid shown after hero search |

### Property Detail (`components/listing/`)

| Component | Description |
| :--- | :--- |
| `PropertyGallery.tsx` | Image gallery with thumbnails |
| `PropertyGalleryGrid.tsx` | Grid layout gallery alternative |
| `FullGalleryModal.tsx` | Fullscreen image viewer modal |
| `OverviewExcerpt.tsx` | Truncated property description with "Read More" |

### Shared (`components/ui/`)

Built on **Radix UI** primitives — buttons, dialogs, dropdowns, sliders, tabs, tooltips, etc.

---

## Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```bash
# Required: Backend API URL
# Use http://localhost:8000 for local development
# Use https://staging.vsell4u.ca for staging
NEXT_PUBLIC_API_URL=https://staging.vsell4u.ca

# Optional: Mapillary street view integration
NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN="your_mapillary_token"
```

### Switching Between Environments

| Environment | `NEXT_PUBLIC_API_URL` | When to Use |
| :--- | :--- | :--- |
| **Staging** | `https://staging.vsell4u.ca` | Default. Uses the deployed backend. |
| **Local Backend** | `http://localhost:8000` | When running `python manage.py runserver` locally. |
| **Docker** | Not needed | Docker Compose + Caddy handles routing automatically. |

> **Important:** After changing `.env.local`, you must restart `npm run dev` for changes to take effect.

---

## Docker Deployment

The full stack (frontend + backend + reverse proxy) can be deployed via Docker Compose from the **root** directory (`mls/`):

```bash
# From s:\mls (the root, NOT frontend/)
docker-compose up --build
```

This starts 3 containers:

1. **`django_backend`** — Django on port 8000 (internal)
2. **`frontend`** — Next.js on port 3000 (internal)
3. **`caddy_reverse_proxy`** — Caddy on ports 80/443 (public-facing)

Caddy automatically handles:

- `/*` → Next.js frontend
- `/api/*` → Django backend
- `/admin/*` → Django admin panel
- SSL certificates (automatic via Let's Encrypt)

### Docker Prerequisites

- Docker Desktop must be **running** (not just installed)
- Ports 80, 443 must be free

---

## Design Decisions & Audit

A comprehensive design audit was performed on the frontend sizing and spacing. The full rationale is documented in:

📄 **[`.gemini/walkthroughs/sizing-overhaul.md`](.gemini/walkthroughs/sizing-overhaul.md)**

### Summary of Changes

| Area | Before | After | Why |
| :--- | :--- | :--- | :--- |
| Container width | 1800px | **1320px** | 1280–1320px is the standard for real estate platforms |
| Section spacing | 12–16px | **48–96px fluid** | Premium feel; spaciousness builds trust for high-value purchases |
| Heading typography | Fixed px | **`clamp()` with rem** | Smooth scaling, zoom-safe (125%+ on Windows) |
| Body line-height | 1.5 | **1.6** | Improved readability for property descriptions |
| Card price size | 20px | **24px** | Price should be the dominant visual element on listing cards |

---

## Troubleshooting

### `npm run dev` crashes with EPERM on Windows

This is a known Next.js 13 issue on Windows. Fix:

```bash
# Kill any orphaned Node processes
taskkill /F /IM node.exe
# Then try again
npm run dev
```

### API returns empty arrays

1. Check `NEXT_PUBLIC_API_URL` in `.env.local`
2. Verify the backend is running: `curl http://localhost:8000/api/mls/properties/`
3. Ensure CORS is configured in Django (`settings.py` → `CORS_ALLOWED_ORIGINS`)

### Styles not applying after changes

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Docker "cannot find file" error

Docker Desktop must be **actively running** (whale icon in system tray). Just having it installed isn't enough.

---

## Tech Stack

| Layer | Technology | Version |
| :--- | :--- | :--- |
| Framework | Next.js | 13.5.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Primitives | Radix UI | Latest |
| State Management | React Context + TanStack Query | 5.x |
| Maps | Leaflet + React Leaflet | 1.9.x |
| Charts | Recharts + Chart.js | Latest |
| Animations | Framer Motion | 12.x |
| Icons | Lucide React | Latest |
| Forms | React Hook Form + Zod | Latest |

---

## Notes for Future Development

1. **Client Reviews** (`ClientReviews.tsx`) — Currently uses hardcoded testimonials. No backend endpoint exists yet. Consider creating a `reviews` Django model and API endpoint to make this dynamic.
2. **Compare URL Typo** — The backend compare endpoint is `/api/mls/properties/comapare/` (note the typo "comapare"). The frontend matches this. If the backend fixes the typo, update `lib/api.ts` accordingly.
3. **Nearest School API** — The backend exposes `/api/mls/nearest-school/` but the frontend integration for this may be incomplete. Check `ListingDetails.tsx` for the current state.
4. **Pre-Construction Upload** — The upload function in `lib/api.ts` supports both GET (URL-encoded CSV) and POST (FormData) modes. The GET mode is the default, which is unusual and may have file size limitations.
