# Backend Features & API Documentation

Based on codebase analysis of `frontend/lib/api.ts` and application logic, here is a summary of the features provided by the backend at `https://staging.vsell4u.ca`.

## 1. Property Management

### Exclusive Properties (`/api/mls/properties/exclusive-properties/`)
- **List & Filter:** Supports fetching exclusive listings with extensive filtering.
- **Filters Supported:**
    - Price Range (`price_min`, `price_max`)
    - Layout (`bedrooms`, `bathrooms`, `building_area`)
    - Location (`city`, `province`, `postal_code`)
    - Status (`standard_status`: Active, Sold, Pending)
    - Pagination (`limit`, `offset`)

### Lease Properties (`/api/mls/properties/lease-properties/`)
- **List & Filter:** Dedicated endpoint for rental/lease listings.
- **Filters:** Similar to exclusive properties (Price, Location, Specs).

### Property Details (`/api/mls/properties/{id}/`)
- **Get Single Property:** Fetches full details for a specific listing key.
- **Data Points:**
    - Basic Info (Price, Address, MLS#)
    - Media (Photos, Virtual Tours)
    - Room Dimensions & Levels
    - Detailed Specs (Heating, Cooling, Zoning, Taxes)

### Pre-Construction (`/api/mls/properties/pre-conn-properties/`)
- **Upload:** Supports bulk upload of pre-construction properties via CSV/Excel file.
- **Auth:** Protected by `Authorization: Bearer {token}` (though no public login endpoint exists).

### Property Comparison (`/api/mls/properties/comapare/`)
- **Compare:** granular comparison of multiple property keys.
- **Returns:** Side-by-side data for selected listings.

## 2. Search & Discovery

### Map Search (`/api/mls/properties/filter/`)
- **Geo-Querying:** Supports bounding box search.
    - `latitude_min`, `latitude_max`
    - `longitude_min`, `longitude_max`
- **Keyword Search:** fuzzy search on address or remarks.

## 3. Content Management

### Vlogs / Blog (`/api/vlog/`)
- **List Posts:** Fetch all blog/vlog entries.
- **Detail View:** Fetch single post by `slug`.
- **Fields:** Title, Content, Video Embed URL, Thumbnail, Categories, Tags.

## 4. Authentication & User Management
> [!WARNING]
> The backend seems to rely on Django Admin for user management. No public REST API endpoints were found for:
- User Registration (`/api/auth/register` - 404)
- User Login (`/api/auth/login` - 404)
- Token Refresh

*Frontend uses a client-side passphrase gate for the custom admin dashboard.*
