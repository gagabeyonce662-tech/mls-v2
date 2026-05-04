import { ComparisonProperty } from "./types";

export function createErrorProperty(
  id: string,
  errorMessage: string,
): ComparisonProperty {
  return {
    id,
    image: "",
    price: "Error",
    address: errorMessage,
    municipality: "Error",
    province: "Error",
    postalCode: "Error",
    propertyType: "Error",
    bedrooms: 0,
    bathrooms: 0,
    totalRooms: 0,
    yearBuilt: null,
    garage: "Error",
    airConditioning: "Error",
    basement: "Error",
    zoning: "Error",
    error: errorMessage,
  };
}

export function transformPropertyData(
  id: string,
  compareData: any,
): ComparisonProperty {
  const property = compareData.results.find((p: any) => {
    const possibleKeys = [
      p.listing_key,
      p.ListingKey,
      p.PropertyKey,
      p.id?.toString(),
      p.ListingId?.toString(),
      String(p.list_price),
      String(p.property_id),
    ].filter(Boolean);
    return possibleKeys.some((key) => String(key) === String(id));
  });

  if (!property)
    return createErrorProperty(id, `Property ${id} not found in API response`);

  const getStringValue = (value: any, defaultValue: string = "N/A") =>
    value === null || value === undefined || value === ""
      ? defaultValue
      : String(value).trim() || defaultValue;
  const getNumberValue = (value: any, defaultValue: number = 0) => {
    if (value === null || value === undefined || value === "")
      return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  const getImageUrl = () => {
    if (property.media) {
      if (typeof property.media === "object" && property.media.media_url)
        return property.media.media_url;
      if (Array.isArray(property.media)) {
        const preferredImage = property.media.find(
          (m: any) => m.is_preferred === true,
        );
        if (preferredImage?.media_url) return preferredImage.media_url;
        if (property.media[0]?.media_url) return property.media[0].media_url;
      }
    }
    if (Array.isArray(property.Photos) && property.Photos[0]?.PhotoURL)
      return property.Photos[0].PhotoURL;
    if (Array.isArray(property.Media) && property.Media[0]?.MediaURL)
      return property.Media[0].MediaURL;
    return (
      property.photo_url || property.image_url || property.thumbnail_url || ""
    );
  };

  const formatPrice = () => {
    const priceFields = [
      property.total_actual_rent,
      property.ListPrice,
      property.list_price,
      property.lease_amount,
      property.Price,
      property.price,
      property.asking_price,
      property.sale_price,
    ];
    for (const priceField of priceFields) {
      if (
        priceField !== null &&
        priceField !== undefined &&
        priceField !== ""
      ) {
        const numPrice = Number(priceField);
        if (!isNaN(numPrice) && numPrice > 0) {
          const isLease =
            property.total_actual_rent ||
            property.lease_amount ||
            property.StandardStatus?.toLowerCase().includes("lease") ||
            property.category_type?.toLowerCase().includes("lease");
          return isLease
            ? `$${numPrice.toLocaleString("en-US")}/month`
            : `$${numPrice.toLocaleString("en-US")}`;
        }
      }
    }
    return "Price on request";
  };

  return {
    id:
      property.listing_key || property.ListingKey || property.PropertyKey || id,
    image: getImageUrl(),
    price: formatPrice(),
    address: getStringValue(
      property.unparsed_address ||
        property.address ||
        property.FullAddress ||
        property.StreetAddress ||
        property.Address ||
        property.street_address,
      "Address not available",
    ),
    municipality: getStringValue(
      property.city || property.City || property.Municipality || property.town,
      "N/A",
    ),
    province: getStringValue(
      property.state_or_province ||
        property.StateOrProvince ||
        property.State ||
        property.Province ||
        "ON",
    ),
    postalCode: getStringValue(
      property.postal_code ||
        property.postalCode ||
        property.PostalCode ||
        property.zip_code,
      "N/A",
    ),
    propertyType: getStringValue(
      property.property_sub_type ||
        property.PropertySubType ||
        property.PropertyType ||
        property.property_type ||
        property.type ||
        "Property",
    ),
    bedrooms: getNumberValue(
      property.bedrooms_total || property.BedroomsTotal || property.bedrooms,
    ),
    bathrooms: getNumberValue(
      property.bathrooms_total_integer ||
        property.BathroomsTotalInteger ||
        property.bathrooms,
    ),
    totalRooms: getNumberValue(
      property.total_rooms ||
        (Array.isArray(property.rooms)
          ? property.rooms.length
          : Array.isArray(property.Rooms)
            ? property.Rooms.length
            : 0),
    ),
    yearBuilt: (() => {
      for (const field of [
        property.year_built,
        property.YearBuilt,
        property.ConstructionYear,
        property.year_constructed,
      ]) {
        if (field) {
          const year = Number(field);
          if (
            !isNaN(year) &&
            year > 1800 &&
            year <= new Date().getFullYear() + 1
          )
            return year;
        }
      }
      return null;
    })(),
    garage: (() => {
      const parkingTotal = getNumberValue(
        property.parking_total || property.ParkingTotal,
      );
      if (parkingTotal > 0)
        return `${parkingTotal} space${parkingTotal > 1 ? "s" : ""}`;
      const parkingFeatures = getStringValue(
        property.parking_features || property.ParkingFeatures,
      );
      if (parkingFeatures && !parkingFeatures.toLowerCase().includes("no"))
        return parkingFeatures;
      const garageSpaces = getNumberValue(
        property.GarageSpaces || property.garage_spaces,
      );
      if (garageSpaces > 0) return `${garageSpaces} car garage`;
      return "None";
    })(),
    airConditioning: (() => {
      const cooling = getStringValue(property.cooling || property.Cooling);
      return cooling === "" || cooling.toLowerCase() === "none"
        ? "None"
        : cooling;
    })(),
    basement: (() => {
      const basement = getStringValue(property.basement || property.Basement);
      return basement === "" || basement.toLowerCase() === "none"
        ? "None"
        : basement;
    })(),
    zoning: getStringValue(property.zoning || property.Zoning, "Residential"),
    rawData: property,
  };
}
