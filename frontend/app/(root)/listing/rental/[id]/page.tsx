// app/rental/[id]/page.tsx
import {
  Bed,
  Bath,
  Maximize,
  Calendar,
  HomeIcon,
  MapPin,
  DollarSign,
  Ruler,
  Building,
  Users,
} from "lucide-react";
import Image from "next/image";
import Header from "@/components/Header";

import Footer from "@/components/Footer";
import PropertyGalleryGrid from "@/components/listing/PropertyGalleryGrid";
import OverviewExcerpt from "@/components/listing/OverviewExcerpt";
import { ds } from "@/lib/design-system-utils";
import { fetchPropertyByKey } from "@/lib/api";
import { notFound } from "next/navigation";
import Link from "next/link";

interface RentalPropertyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RentalPropertyPage(
  props: RentalPropertyPageProps,
) {
  const params = await props.params;
  // Fetch rental property data using the PropertyKey from URL
  const property = await fetchPropertyByKey(params.id);

  if (!property) {
    notFound();
  }

  // Extract property images from several possible shapes
  const propertyImages: string[] = (
    property.media && property.media.length > 0
      ? property.media.map((m: any) => String(m.media_url))
      : property.Media && property.Media.length > 0
        ? property.Media.map((m: any) => String(m.MediaURL || m.media_url))
        : property.Photos && property.Photos.length > 0
          ? property.Photos.map((p: any) => String(p.PhotoURL || p))
          : []
  ).filter(Boolean);

  const hasImages = propertyImages.length > 0;

  // Format price for rental properties
  const getPrice = () => {
    const price =
      property.lease_amount || property.list_price || property.ListPrice;
    if (!price && price !== 0) return "Price on request";

    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numericPrice)) return "Price on request";

    if (property.lease_amount) {
      return `$${numericPrice.toFixed(2)}/sq ft`;
    }
    return `$${numericPrice.toLocaleString()}`;
  };

  // Format monthly rent if available
  const getMonthlyRent = () => {
    const rentVal = property.total_actual_rent;
    if (!rentVal) return "Rent not specified";

    const rent = typeof rentVal === "string" ? parseFloat(rentVal) : rentVal;
    return isNaN(rent)
      ? "Rent not specified"
      : `$${rent.toLocaleString()}/month`;
  };

  const getBedCount = () =>
    property.bedrooms_total || property.BedroomsTotal || "N/A";
  const getBathCount = () =>
    property.bathrooms_total_integer || property.BathroomsTotalInteger || "N/A";
  const getCity = () => property.city || property.City || "N/A";
  const getAddress = () =>
    property.unparsed_address ||
    `${property.address || ""} ${property.city || ""}`.trim() ||
    "Address not available";

  const getPropertyType = () => {
    if (property.category_type) return property.category_type;
    if (property.PropertySubType) return property.PropertySubType;
    if (property.PropertyType) return property.PropertyType;
    return "Rental Property";
  };

  const getLivingArea = () => {
    if (property.building_area_total)
      return `${property.building_area_total} sq ft`;
    if (property.LivingArea) return `${property.LivingArea} sq ft`;
    return "N/A";
  };

  const getLeaseTerm = () => {
    // You might want to add lease_term field to your API
    return "Negotiable";
  };

  const getAvailabilityDate = () => {
    // You might want to add availability_date field to your API
    return "Immediately";
  };

  const propertyHistory = [
    {
      date: property.ModificationTimestamp
        ? new Date(property.ModificationTimestamp).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Recent",
      event: property.StandardStatus || property.standard_status || "Available",
      price: getPrice(),
      source: `MLS # ${property.listing_key || property.ListingKey || property.PropertyKey}`,
    },
  ];

  // Rental-specific details
  const rentalFeatures = [
    {
      label: "Lease Term",
      value: getLeaseTerm(),
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      label: "Availability",
      value: getAvailabilityDate(),
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      label: "Property Type",
      value: getPropertyType(),
      icon: <HomeIcon className="w-4 h-4" />,
    },
    {
      label: "Building Area",
      value: getLivingArea(),
      icon: <Ruler className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Home
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="w-3 h-3 text-gray-400 mx-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 6 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 9 4-4-4-4"
                    />
                  </svg>
                  <Link
                    href="/listing/rental"
                    className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
                  >
                    Rental Properties
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg
                    className="w-3 h-3 text-gray-400 mx-1"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 6 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 9 4-4-4-4"
                    />
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    {getCity()}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className={`${ds.h2} mb-2`}>
              {getPropertyType()} for Rent in {getCity()}
            </h1>
            <p className={`${ds.bodyRegular} text-ds-body`}>
              {getAddress()} •{" "}
              {property.StandardStatus ||
                property.standard_status ||
                "Available"}
            </p>
          </div>
          <div className="text-right">
            <p className={`${ds.h2} text-ds-primary`}>{getPrice()}</p>
            {property.total_actual_rent && (
              <p className={`${ds.body} text-green-600 mt-1`}>
                {getMonthlyRent()}
              </p>
            )}
          </div>
        </div>

        {/* Grid gallery (client) */}
        {hasImages ? (
          <div className="mb-6">
            <PropertyGalleryGrid images={propertyImages} />
          </div>
        ) : (
          <div className="w-full h-96 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-8">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">
                No Images Available
              </p>
              <p className="text-sm text-gray-600">
                Images for this rental property are not currently available.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className={`${ds.h3} mb-4`}>Property Overview</h2>
              <OverviewExcerpt
                text={
                  property.public_remarks ||
                  property.PublicRemarks ||
                  property.PrivateRemarks ||
                  property.Description ||
                  `This ${getPropertyType()} is available for rent in ${getCity()}, ${property.StateOrProvince || "Ontario"}. ${
                    property.year_built || property.YearBuilt
                      ? `Built in ${property.year_built || property.YearBuilt}, `
                      : ""
                  }this rental property features ${getBedCount()} bedrooms and ${getBathCount()} bathrooms${
                    getLivingArea() !== "N/A"
                      ? ` with ${getLivingArea()} of living space`
                      : ""
                  }. Available ${getAvailabilityDate().toLowerCase()}.`
                }
                maxChars={400}
              />
            </div>

            {/* Rental-Specific Features */}
            <div>
              <h2 className={`${ds.h3} mb-4`}>Rental Information</h2>
              <div className="bg-ds-card border border-ds-card-border rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-ds-primary" />
                        <span className={ds.bodyRegular}>Lease Rate</span>
                      </div>
                      <span className={`${ds.body} font-semibold`}>
                        {getPrice()}
                      </span>
                    </div>

                    {property.total_actual_rent && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <span className={ds.bodyRegular}>Monthly Rent</span>
                        </div>
                        <span
                          className={`${ds.body} font-semibold text-green-600`}
                        >
                          {getMonthlyRent()}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-ds-body" />
                        <span className={ds.bodyRegular}>Lease Term</span>
                      </div>
                      <span className={ds.body}>{getLeaseTerm()}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-ds-body" />
                        <span className={ds.bodyRegular}>Available From</span>
                      </div>
                      <span className={ds.body}>{getAvailabilityDate()}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bed className="w-5 h-5 text-ds-body" />
                        <span className={ds.bodyRegular}>Bedrooms</span>
                      </div>
                      <span className={ds.body}>{getBedCount()}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bath className="w-5 h-5 text-ds-body" />
                        <span className={ds.bodyRegular}>Bathrooms</span>
                      </div>
                      <span className={ds.body}>{getBathCount()}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Maximize className="w-5 h-5 text-ds-body" />
                        <span className={ds.bodyRegular}>Building Area</span>
                      </div>
                      <span className={ds.body}>{getLivingArea()}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-ds-body" />
                        <span className={ds.bodyRegular}>Property Type</span>
                      </div>
                      <span className={ds.body}>{getPropertyType()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Records */}
            <div>
              <h2 className={`${ds.h3} mb-4`}>Property Details</h2>
              <div className="overflow-hidden rounded-lg border-2 border-gray-400">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <th className="bg-gray-100 p-4 text-left font-semibold border-b-2 border-r-2 border-gray-400">
                        Financial Information
                      </th>
                      <th className="bg-gray-100 p-4 text-left font-semibold border-b-2 border-gray-400">
                        Property Details
                      </th>
                    </tr>

                    <tr className="border-b-2 border-gray-400">
                      <td className="p-4 border-r-2 border-gray-400">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Lease Rate</span>
                          <span className={ds.body}>{getPrice()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>MLS Number</span>
                          <span className={ds.body}>
                            {property.listing_key ||
                              property.ListingKey ||
                              property.PropertyKey}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {property.total_actual_rent && (
                      <tr className="border-b-2 border-gray-400">
                        <td className="p-4 border-r-2 border-gray-400">
                          <div className="flex justify-between">
                            <span className={ds.bodyRegular}>Monthly Rent</span>
                            <span className={ds.body}>{getMonthlyRent()}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-between">
                            <span className={ds.bodyRegular}>Status</span>
                            <span className={ds.body}>
                              {property.standard_status ||
                                property.StandardStatus ||
                                "N/A"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                    <tr className="border-b-2 border-gray-400">
                      <td className="p-4 border-r-2 border-gray-400">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Lease Term</span>
                          <span className={ds.body}>{getLeaseTerm()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Availability</span>
                          <span className={ds.body}>
                            {getAvailabilityDate()}
                          </span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <th
                        colSpan={2}
                        className="bg-gray-100 p-4 text-left font-semibold border-b-2 border-gray-400"
                      >
                        Building Facts
                      </th>
                    </tr>

                    <tr className="border-b-2 border-gray-400">
                      <td className="p-4 border-r-2 border-gray-400">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Property Type</span>
                          <span className={ds.body}>{getPropertyType()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Year Built</span>
                          <span className={ds.body}>
                            {property.year_built || property.YearBuilt || "N/A"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b-2 border-gray-400">
                      <td className="p-4 border-r-2 border-gray-400">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Building Area</span>
                          <span className={ds.body}>{getLivingArea()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>
                            Photos Available
                          </span>
                          <span className={ds.body}>
                            {property.photos_count ||
                              property.Photos?.length ||
                              "N/A"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {property.rooms && property.rooms.length > 0 && (
                      <>
                        <tr>
                          <th
                            colSpan={2}
                            className="bg-gray-100 p-4 text-left font-semibold border-b-2 border-gray-400"
                          >
                            Room Details
                          </th>
                        </tr>
                        {property.rooms
                          .slice(0, 4)
                          .map((room: any, index: number) => (
                            <tr
                              key={index}
                              className="border-b-2 border-gray-400"
                            >
                              <td className="p-4 border-r-2 border-gray-400">
                                <div className="flex justify-between">
                                  <span className={ds.bodyRegular}>
                                    {room.room_type}
                                  </span>
                                  <span className={ds.body}>
                                    {room.room_level}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex justify-between">
                                  <span className={ds.bodyRegular}>
                                    Dimensions
                                  </span>
                                  <span className={ds.body}>
                                    {room.room_dimensions || "N/A"}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Remarks */}
            {(property.public_remarks || property.PublicRemarks) && (
              <div>
                <h2 className={`${ds.h3} mb-4`}>Additional Information</h2>
                <div className="bg-ds-card border border-ds-card-border rounded-xl p-6">
                  <p className={`${ds.bodyRegular} whitespace-pre-line`}>
                    {property.public_remarks || property.PublicRemarks}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Contact/Inquiry Form (Placeholder) */}
            <div className="bg-ds-card border border-ds-card-border rounded-xl p-6">
              <h3 className={`${ds.text} mb-4`}>Schedule a Viewing</h3>
              <p className={`${ds.bodyRegular} text-ds-body mb-4`}>
                Interested in this rental property? Contact us to schedule a
                viewing or request more information.
              </p>
              <button className="w-full bg-ds-primary text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Contact Agent
              </button>
              <div className="mt-4 text-center">
                <p className={`${ds.small} text-ds-body`}>
                  or call <span className="font-semibold">(555) 123-4567</span>
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="bg-ds-card border border-ds-card-border rounded-xl p-4">
              <h3 className={`${ds.text} mb-4`}>Location</h3>
              <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                {property.latitude && property.longitude ? (
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(String(property.longitude)) - 0.01},${parseFloat(String(property.latitude)) - 0.01},${parseFloat(String(property.longitude)) + 0.01},${parseFloat(String(property.latitude)) + 0.01}&layer=mapnik&marker=${property.latitude},${property.longitude}`}
                    style={{ border: "none" }}
                  ></iframe>
                ) : (
                  <div className="h-full bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-ds-body mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {getCity()}, {property.StateOrProvince || "Ontario"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getAddress()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {property.latitude && property.longitude ? (
                  <span>
                    Lat: {property.latitude}, Lng: {property.longitude}
                  </span>
                ) : (
                  <span>
                    {getCity()}, {property.StateOrProvince || "Ontario"}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Facts */}
            <div className="bg-ds-card border border-ds-card-border rounded-xl p-6">
              <h3 className={`${ds.text} mb-4`}>Quick Facts</h3>
              <div className="space-y-3">
                {rentalFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-ds-body">{feature.icon}</div>
                      <span className={ds.bodyRegular}>{feature.label}</span>
                    </div>
                    <span className={ds.body}>{feature.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities (if available) */}
            {(property.InteriorFeatures || property.ExteriorFeatures) && (
              <div className="bg-ds-card border border-ds-card-border rounded-xl p-6">
                <h3 className={`${ds.text} mb-4`}>Features</h3>
                <div className="space-y-2">
                  {property.InteriorFeatures && (
                    <div>
                      <h4 className={`${ds.small} font-semibold mb-1`}>
                        Interior Features
                      </h4>
                      <p className={`${ds.small} text-ds-body`}>
                        {property.InteriorFeatures}
                      </p>
                    </div>
                  )}
                  {property.ExteriorFeatures && (
                    <div>
                      <h4 className={`${ds.small} font-semibold mb-1`}>
                        Exterior Features
                      </h4>
                      <p className={`${ds.small} text-ds-body`}>
                        {property.ExteriorFeatures}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Rental Properties */}
        <div className="mt-16">
          <h2 className={`${ds.h2} mb-8`}>Similar Rental Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder similar rental properties */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48">
                  <Image
                    src={`https://images.unsplash.com/photo-1600577916048-804c9191e36c?w=400&h=300&fit=crop&auto=format&q=80`}
                    alt={`Similar Rental ${i}`}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                      For Rent
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className={`${ds.h4} text-ds-primary mb-2`}>
                    $2,500/month
                  </h3>
                  <p className={`${ds.bodyRegular} text-ds-heading mb-1`}>
                    {i === 1
                      ? "Downtown Condo"
                      : i === 2
                        ? "Suburban House"
                        : "Townhouse"}
                  </p>
                  <p className={`${ds.small} text-ds-body mb-1`}>
                    {getCity()}, {property.StateOrProvince || "Ontario"}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Bed className="w-3 h-3" /> {i + 1}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-3 h-3" /> {i}
                    </span>
                    <span className="flex items-center gap-1">
                      <Maximize className="w-3 h-3" /> {800 + i * 200} sq ft
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
