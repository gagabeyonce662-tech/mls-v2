import { z } from "zod";

// Base media schema
export const PropertyMediaSchema = z.object({
  media_url: z.string().optional().default(""),
  media_category: z.string().optional().default("Property Photo"),
  is_preferred: z.boolean().optional().default(true),
  order: z.number().optional().default(0),
});

// Base room schema
export const PropertyRoomSchema = z.object({
  room_type: z.string().optional().default(""),
  room_level: z.string().optional().default(""),
  room_length: z.string().nullable().optional(),
  room_width: z.string().nullable().optional(),
  room_dimensions: z.string().optional().default(""),
});

// A preprocessor to extract the arrays from various forms
const mediaPreprocessor = (val: any) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "object" && val && val.media_url) {
    return [
      {
        media_url: val.media_url,
        media_category: val.media_category || "Property Photo",
        is_preferred: val.is_preferred !== undefined ? val.is_preferred : true,
        order: 0,
      },
    ];
  }
  if (typeof val === "string") {
    return [
      {
        media_url: val,
        media_category: "Property Photo",
        is_preferred: true,
        order: 0,
      },
    ];
  }
  return [];
};

// Main Zod Schema for API Response
export const PropertyResponseSchema = z
  .object({
    listing_key: z.string().optional(),
    listingKey: z.string().optional(),
    ListingKey: z.string().optional(),
    PropertyKey: z.string().optional(),
    id: z.string().optional(),

    list_price: z.union([z.number(), z.string()]).optional(),
    ListPrice: z.union([z.number(), z.string()]).optional(),

    city: z.string().optional(),
    City: z.string().optional(),

    state_or_province: z.string().optional(),
    StateOrProvince: z.string().optional(),

    category_type: z.string().optional(),
    property_sub_type: z.string().optional(),
    PropertySubType: z.string().optional(),
    PropertyType: z.string().optional(),

    bedrooms_total: z.union([z.number(), z.string()]).optional(),
    BedroomsTotal: z.union([z.number(), z.string()]).optional(),

    bathrooms_total_integer: z.union([z.number(), z.string()]).optional(),
    BathroomsTotalInteger: z.union([z.number(), z.string()]).optional(),

    standard_status: z.string().optional(),
    StandardStatus: z.string().optional(),

    ModificationTimestamp: z.string().optional(),

    unparsed_address: z.string().optional(),
    address: z.string().optional(),
    unit_number: z.string().optional(),
    street_number: z.string().optional(),
    street_dir_prefix: z.string().optional(),
    street_name: z.string().optional(),
    street_suffix: z.string().optional(),
    street_dir_suffix: z.string().optional(),

    postal_code: z.string().optional(),
    PostalCode: z.string().optional(),

    latitude: z.union([z.string(), z.number()]).optional(),
    longitude: z.union([z.string(), z.number()]).optional(),

    public_remarks: z.string().optional(),
    PublicRemarks: z.string().optional(),

    photos_count: z.number().optional(),
    listing_url: z.string().optional(),

    building_area_total: z
      .union([z.string(), z.number()])
      .nullable()
      .optional(),
    year_built: z.union([z.string(), z.number()]).nullable().optional(),

    cooling: z
      .union([z.string(), z.array(z.string())])
      .nullable()
      .optional(),
    Cooling: z
      .union([z.string(), z.array(z.string())])
      .nullable()
      .optional(),

    basement: z
      .union([z.string(), z.array(z.string())])
      .nullable()
      .optional(),
    Basement: z
      .union([z.string(), z.array(z.string())])
      .nullable()
      .optional(),

    zoning: z.string().nullable().optional(),
    Zoning: z.string().nullable().optional(),

    parking_total: z.number().nullable().optional(),
    ParkingTotal: z.number().nullable().optional(),

    parking_features: z
      .union([z.string(), z.array(z.string())])
      .nullable()
      .optional(),
    ParkingFeatures: z
      .union([z.string(), z.array(z.string())])
      .nullable()
      .optional(),

    total_actual_rent: z.string().optional(),

    media: z.preprocess(mediaPreprocessor, z.array(z.any())).optional(),
    Media: z.preprocess(mediaPreprocessor, z.array(z.any())).optional(),
    Photos: z.array(z.any()).optional(),

    rooms: z.array(z.any()).optional(),
    Rooms: z.array(z.any()).optional(),
  })
  .passthrough() // Keep any unstructured fields
  .transform((prop) => {
    // 1. Build Address
    const addressParts = [];
    if (prop.unit_number) addressParts.push(`${prop.unit_number}-`);
    if (prop.street_number) addressParts.push(prop.street_number);
    if (prop.street_dir_prefix) addressParts.push(prop.street_dir_prefix);
    if (prop.street_name) addressParts.push(prop.street_name);
    if (prop.street_suffix) addressParts.push(prop.street_suffix);
    if (prop.street_dir_suffix) addressParts.push(prop.street_dir_suffix);
    const builtAddress = addressParts.join(" ").trim();

    // 2. Identify Keys
    const bestKey =
      prop.listing_key ||
      prop.listingKey ||
      prop.ListingKey ||
      prop.PropertyKey ||
      prop.id ||
      "";

    // 3. Resolve Fallbacks
    const resolvedMedia = prop.media || prop.Media || [];
    if (prop.Photos && resolvedMedia.length === 0) {
      prop.Photos.forEach((p: any) => {
        resolvedMedia.push({
          media_url: p.PhotoURL || p,
          media_category: "Property Photo",
          is_preferred: true,
          order: 0,
        });
      });
    }

    const priceRaw = prop.list_price ?? prop.ListPrice;
    const resolvedPrice =
      typeof priceRaw === "string" ? parseFloat(priceRaw) : priceRaw || 0;

    const resolvedCity = prop.city || prop.City || "";
    const resolvedProvince =
      prop.state_or_province || prop.StateOrProvince || "ON";
    const resolvedSubType =
      prop.category_type ||
      prop.property_sub_type ||
      prop.PropertySubType ||
      prop.PropertyType ||
      "Exclusive";
    const resolvedBedrooms = parseInt(
      String(prop.bedrooms_total || prop.BedroomsTotal || 0),
    );
    const resolvedBathrooms = parseInt(
      String(prop.bathrooms_total_integer || prop.BathroomsTotalInteger || 0),
    );
    const resolvedStatus =
      prop.standard_status || prop.StandardStatus || "Active";
    const resolvedAddress =
      prop.unparsed_address || builtAddress || prop.address || "";
    const resolvedPostal = prop.postal_code || prop.PostalCode || "";

    // 4. Create Standardized Object
    return {
      PropertyKey: bestKey,
      ListingKey: bestKey,
      list_price: prop.list_price,
      listing_key: bestKey,
      ListPrice: resolvedPrice,
      City: resolvedCity,
      city: prop.city,
      StateOrProvince: resolvedProvince,
      PropertySubType: resolvedSubType,
      BedroomsTotal: resolvedBedrooms,
      bedrooms_total: prop.bedrooms_total,
      BathroomsTotalInteger: resolvedBathrooms,
      bathrooms_total_integer: prop.bathrooms_total_integer,
      StandardStatus: resolvedStatus,
      standard_status: prop.standard_status,
      ModificationTimestamp:
        prop.ModificationTimestamp || new Date().toISOString(),
      unparsed_address: prop.unparsed_address,
      postal_code: prop.postal_code,
      latitude: prop.latitude,
      longitude: prop.longitude,
      public_remarks: prop.public_remarks || prop.PublicRemarks,
      media: resolvedMedia,
      rooms: prop.rooms || prop.Rooms || [],
      category_type: prop.category_type,
      photos_count: prop.photos_count,
      listing_url: prop.listing_url,
      building_area_total: prop.building_area_total,
      year_built: prop.year_built,

      // UI Support Fields
      address: resolvedAddress,
      location: resolvedCity,
      province: resolvedProvince,
      postalCode: resolvedPostal,
      cooling: (() => {
        const v = prop.cooling || prop.Cooling;
        return Array.isArray(v) ? v.join(", ") : v || "";
      })(),
      basement: (() => {
        const v = prop.basement || prop.Basement;
        return Array.isArray(v) ? v.join(", ") : v || "";
      })(),
      zoning: prop.zoning || prop.Zoning || "",
      parking_total: prop.parking_total || prop.ParkingTotal || 0,
      parking_features: (() => {
        const v = prop.parking_features || prop.ParkingFeatures;
        return Array.isArray(v) ? v.join(", ") : v || "";
      })(),
      total_actual_rent: prop.total_actual_rent,

      // Legacy Support
      Photos: resolvedMedia.map((m: any) => ({ PhotoURL: m.media_url })),
      Media: resolvedMedia,
      Rooms: prop.rooms || prop.Rooms || [],
      LivingArea: prop.building_area_total
        ? parseFloat(String(prop.building_area_total))
        : null,
      YearBuilt: prop.year_built ? parseInt(String(prop.year_built)) : null,
      PublicRemarks: prop.public_remarks || prop.PublicRemarks,
      PostalCode: resolvedPostal,
      Latitude: prop.latitude,
      Longitude: prop.longitude,
      Description: prop.public_remarks || prop.PublicRemarks,
      PropertyType: resolvedSubType,

      ...prop, // Retain any leftover fields
    };
  });
