# API Wiring Reference

This document maps every frontend API call to its backend endpoint. Use this to verify the integration is complete.

---

## Base Configuration

```
File:     lib/api.ts
Variable: NEXT_PUBLIC_API_URL
Default:  https://staging.vsell4u.ca
```

---

## Endpoint Map

### Property Listings

| # | Frontend Function | Backend URL | HTTP | Used By |
|---|-------------------|-------------|------|---------|
| 1 | `fetchExclusiveProperties(filters)` | `/api/mls/properties/exclusive-properties/` | GET | `FeaturedListings.tsx`, `PropertyFilter.tsx` |
| 2 | `fetchNewlyListedProperties(filters)` | `/api/mls/properties/newly-listed-properties/` | GET | `NewlyListedListings.tsx` |
| 3 | `fetchLeaseProperties(filters)` | `/api/mls/properties/lease-properties/` | GET | `RentalProperties.tsx` |
| 4 | `fetchPreConnProperties(filters)` | `/api/mls/properties/pre-conn-properties/` | GET | `PreConstructionProperties.tsx` |
| 5 | `fetchPropertyByKey(key)` | `/api/mls/properties/{PropertyKey}/` | GET | `listing/[id]/page.tsx` |
| 6 | `fetchFilteredProperties(filters)` | `/api/mls/properties/filter/` | GET | `PropertyFilter.tsx`, Map Search |
| 7 | `fetchCompareProperties(keys[])` | `/api/mls/properties/comapare/` | GET | `compare/page.tsx` |
| 8 | `uploadPreConnProperties(file)` | `/api/mls/properties/pre-conn-properties/` | POST | Admin upload tool |

### Blog / Vlog

| # | Frontend Function | Backend URL | HTTP | Used By |
|---|-------------------|-------------|------|---------|
| 9 | `fetchVlogPosts()` | `/api/vlog/` | GET | `blog/page.tsx` |
| 10 | `fetchVlogPostBySlug(slug)` | `/api/vlog/{slug}/` | GET | `blog/[slug]/page.tsx` |

### Utility

| # | Frontend Function | Backend URL | HTTP | Used By |
|---|-------------------|-------------|------|---------|
| 11 | `NearestSchoolAPIView` | `/api/mls/nearest-school/` | GET | `ListingDetails.tsx` (partial) |

---

## Common Query Parameters

All property list endpoints accept:

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `limit` | int | `6` | Results per page (default: 6) |
| `offset` | int | `0` | Pagination offset |
| `city` | string | `Toronto` | Filter by city name |
| `province` | string | `ON` | 2-letter province code |
| `price_min` | number | `200000` | Minimum listing price |
| `price_max` | number | `1000000` | Maximum listing price |
| `bedrooms` | int | `3` | Minimum bedrooms |
| `bathrooms` | int | `2` | Minimum bathrooms |
| `property_sub_type` | string | `Detached` | Property type |
| `standard_status` | string | `Active` | Listing status |

---

## Response Format

All list endpoints return paginated responses:

```json
{
  "results": [ ... ],    // Array of property objects
  "count": 150,           // Total matching properties
  "next": 6,              // Next page offset (null if last page)
  "previous": null        // Previous page offset (null if first page)
}
```

## Property Object (key fields)

```json
{
  "listing_key": "28726400",
  "list_price": "749900.00",
  "city": "Toronto",
  "state_or_province": "ON",
  "bedrooms_total": 3,
  "bathrooms_total_integer": 2,
  "standard_status": "Active",
  "unparsed_address": "123 Main St",
  "postal_code": "M5V 2K1",
  "latitude": "43.6532",
  "longitude": "-79.3832",
  "public_remarks": "Beautiful 3-bedroom home...",
  "category_type": "Detached",
  "building_area_total": "1500",
  "year_built": "2015",
  "media": {
    "media_url": "https://...",
    "media_category": "Property Photo",
    "is_preferred": true
  }
}
```

> **Note:** The `media` field can be a single object, an array, or a string URL. The `mapPropertyFromAPI()` function in `lib/api.ts` normalizes all three formats.

---

## Data Flow Diagram

```
User visits homepage
        │
        ▼
   page.tsx loads
        │
        ├── FeaturedListings    → fetchExclusiveProperties()     → /api/mls/properties/exclusive-properties/
        ├── NewlyListedListings → fetchNewlyListedProperties()   → /api/mls/properties/newly-listed-properties/
        ├── RentalProperties    → fetchLeaseProperties()         → /api/mls/properties/lease-properties/
        └── PreConstruction     → fetchPreConnProperties()       → /api/mls/properties/pre-conn-properties/
                                                                          │
                                                                          ▼
                                                                   Django Backend
                                                                          │
                                                                          ▼
                                                                   PostgreSQL (Neon)
```

---

## Known Issues

1. **Compare endpoint typo**: The backend URL is `/comapare/` (not `/compare/`). The frontend matches this typo. If the backend ever fixes the spelling, update line 622 of `lib/api.ts`.

2. **Newly Listed endpoint**: The query parameters are built but not actually appended to the URL in `fetchNewlyListedProperties()` (line 986 of `lib/api.ts`). The function constructs `queryParams` but the final URL ignores them. This should be fixed for filters to work on that page.

3. **Province mapping**: The frontend converts full province names to 2-letter codes (e.g., "Ontario" → "ON") before sending to the API. This mapping is in `fetchProperties()` around line 389 of `lib/api.ts`.
