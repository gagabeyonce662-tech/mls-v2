export const HIDDEN_FIELDS = new Set(["id"]);

export const CORE_FIELD_ORDER = [
  "listing_key",
  "property_title",
  "property_slug",
  "property_description",
  "description_sections_json",
  "custom_detail_blocks_json",
  "detail_blocks_layout_json",
  "listing_buttons_json",
  "listing_url",
  "publish_status",
  "is_featured",
  "custom_tags",
  "expires_at",
  "list_price",
  "second_price",
  "enable_price_placeholder",
  "price_placeholder",
  "price_prefix",
  "after_price",
  "building_area_total",
  "size_postfix",
  "land_area",
  "land_area_size_postfix",
  "bedrooms_total",
  "rooms",
  "bathrooms_total_integer",
  "garages",
  "garage_size",
  "year_built",
  "property_id_code",
  "max_bedrooms",
  "developer",
  "occupancy_year",
  "signing_amount",
  "lot_size",
  "kitchens",
  "listing_id",
  "tax_annual_amount",
  "tax_year",
  "basement",
  "exterior_features",
  "unparsed_address",
  "city",
  "state_or_province",
  "postal_code",
  "country",
  "latitude",
  "longitude",
  "featured_image_url",
  "wp_meta_json",
  "wp_post_json",
  "wp_terms_json",
] as const;

export const TAXONOMY_KEYS = [
  "type",
  "status",
  "features",
  "labels",
  "city",
  "state",
  "country",
] as const;

export const TAXONOMY_OPTIONS: Record<(typeof TAXONOMY_KEYS)[number], string[]> = {
  type: [
    "Detached Homes",
    "Townhomes",
    "Bungalows",
    "Condo Apartment",
    "Pre Construction",
    "Semi-Detached",
  ],
  status: [
    "Assignments",
    "Coming Soon",
    "For Sale",
    "Leased",
    "Resale",
    "Sold Out",
  ],
  features: [
    "Appliances Included",
    "Air-conditioning Unit",
    "Finished Basement",
    "Free Assignment",
    "Free Maintenance Fees",
    "Price Discount",
  ],
  labels: [
    "$10K on Signing",
    "$20K on Signing",
    "$25K on Signing",
    "$30K on Signing",
  ],
  city: ["Brampton", "Oakville", "Ajax", "Barrie", "Milton"],
  state: ["Ontario", "California", "Florida", "Illinois", "New York"],
  country: ["Canada", "USA"],
};

export const DEFAULT_DESCRIPTION_SECTION_TITLE = "Overview";
export const MAX_LOCAL_MEDIA_FILES = 30;
export const CLOUDINARY_PICK_PAGE_SIZE = 30;

export const DEFAULT_DETAIL_BLOCK_TITLES: Record<string, string> = {
  financial_information: "Financial Information",
  building_facts: "Building Facts",
  location_access: "Location & access",
  lot_land: "Lot & Land",
  construction_systems: "Construction & Systems",
  utilities_services: "Utilities & Services",
  parking_structure: "Parking & Structure",
  listing_details: "Listing Details",
};

export const ADMIN_FIELD_LABELS: Record<string, string> = {
  lot_size: "property_size",
};
