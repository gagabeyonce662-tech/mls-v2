import { Bed, Bath, Maximize, Car, Calendar, Home as HomeIcon, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyGallery from "@/components/listing/PropertyGallery";
import { ds } from "@/lib/design-system-utils";
import { fetchPropertyByKey, type Property } from "@/lib/api";
import { notFound } from "next/navigation";

interface ListingPageProps {
  params: {
    id: string;
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  // Fetch property data using the PropertyKey from URL
  const property = await fetchPropertyByKey(params.id);
  
  if (!property) {
    notFound();
  }
  
  console.log('Property data received:', property);
  
  // Extract property images from new media structure
  const propertyImages = property.media?.length > 0 
    ? property.media.map((media: any) => media.media_url).filter(Boolean)
    : property.Media?.length > 0 
    ? property.Media.map((media: any) => media.MediaURL || media.media_url).filter(Boolean)
    : property.Photos?.length > 0 
    ? property.Photos.map((photo: any) => photo.PhotoURL || photo).filter(Boolean)
    : [];

  const hasImages = propertyImages.length > 0;

  // Extract property history
  const propertyHistory = [
    {
      date: property.ModificationTimestamp 
        ? new Date(property.ModificationTimestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'Recent',
      event: property.StandardStatus || property.standard_status || 'Listed',
      price: property.list_price 
        ? `$${parseFloat(property.list_price).toLocaleString()}`
        : property.ListPrice 
        ? `$${property.ListPrice.toLocaleString()}`
        : 'Price on request',
      source: `MLS # ${property.listing_key || property.ListingKey || property.PropertyKey}`
    },
  ];

  // Helper function to get price
  const getPrice = () => {
    if (property.list_price) {
      return `$${parseFloat(property.list_price).toLocaleString()}`;
    }
    if (property.ListPrice) {
      return `$${property.ListPrice.toLocaleString()}`;
    }
    return 'Price on request';
  };

  // Helper function to get bed count
  const getBedCount = () => {
    return property.bedrooms_total || property.BedroomsTotal || 'N/A';
  };

  // Helper function to get bath count
  const getBathCount = () => {
    return property.bathrooms_total_integer || property.BathroomsTotalInteger || 'N/A';
  };

  // Helper function to get city
  const getCity = () => {
    return property.city || property.City || 'N/A';
  };

  // Helper function to get address
  const getAddress = () => {
    return property.unparsed_address || property.City || 'Address not available';
  };

  // Helper function to get property type
  const getPropertyType = () => {
    if (property.category_type) return property.category_type;
    if (property.PropertySubType) return property.PropertySubType;
    if (property.PropertyType) return property.PropertyType;
    return 'Property';
  };

  // Helper function to get living area
  const getLivingArea = () => {
    if (property.building_area_total) return `${property.building_area_total} sq ft`;
    if (property.LivingArea) return `${property.LivingArea} sq ft`;
    return 'N/A';
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {/* Title and Price */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className={`${ds.h2} mb-2`}>{getPropertyType()} in {getCity()}</h1>
            <p className={`${ds.bodyRegular} text-ds-body`}>
              {getAddress()} • {property.StandardStatus || property.standard_status || 'Active'}
            </p>
          </div>
          <div className="text-right">
            <p className={`${ds.h2} text-ds-primary`}>{getPrice()}</p>
          </div>
        </div>

        {/* Full Width Image Gallery */}
        {hasImages ? (
          <div className="mb-6">
            <PropertyGallery images={propertyImages} />
          </div>
        ) : (
          <div className="w-full h-96 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-8">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">No Images Available</p>
              <p className="text-sm text-gray-600">Images for this property are not currently available.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Overview */}
            <div>
              <h2 className={`${ds.h3} mb-4`}>Overview</h2>
              <p className={`${ds.bodyRegular} text-ds-body leading-relaxed`}>
                {property.public_remarks || property.PublicRemarks || property.PrivateRemarks || property.Description || (
                  `This ${getPropertyType()} is located in ${getCity()}, ${property.StateOrProvince || 'Ontario'}. ` +
                  `Built in ${property.year_built || property.YearBuilt || 'N/A'}, this property features ${getBedCount()} bedrooms and ${getBathCount()} bathrooms` +
                  `${getLivingArea() !== 'N/A' ? ` with ${getLivingArea()} of living space` : ''}.`
                )}
              </p>
            </div>

            {/* Property History */}
            <div>
              <h2 className={`${ds.h3} mb-4`}>Property History</h2>
              <div className="border border-ds-card-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-ds-card">
                    <tr>
                      <th className={`${ds.body} text-left p-4`}>Date</th>
                      <th className={`${ds.body} text-left p-4`}>Event & Source</th>
                      <th className={`${ds.body} text-right p-4`}>Price</th>
                      <th className={`${ds.body} text-right p-4`}>Appreciation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propertyHistory.map((item, index) => (
                      <tr key={index} className="border-t border-ds-card-border">
                        <td className={`${ds.bodyRegular} p-4`}>{item.date}</td>
                        <td className={`${ds.bodyRegular} p-4`}>
                          <div>{item.event}</div>
                          <div className="text-ds-body text-sm">{item.source}</div>
                        </td>
                        <td className={`${ds.body} text-right p-4`}>{item.price}</td>
                        <td className={`${ds.bodyRegular} text-right p-4`}>-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Property Records */}
            <div>
              <h2 className={`${ds.h3} mb-4`}>Property Records</h2>
              <div className="overflow-hidden rounded-lg border-2 border-gray-400">
                <table className="w-full border-collapse">
                  <tbody>
                    {/* Section Headers */}
                    <tr>
                      <th className="bg-gray-100 p-4 text-left font-semibold border-b-2 border-r-2 border-gray-400">
                        Financial Information
                      </th>
                      <th className="bg-gray-100 p-4 text-left font-semibold border-b-2 border-gray-400">
                        Property Details
                      </th>
                    </tr>
                    
                    {/* Row 1 */}
                    <tr className="border-b-2 border-gray-400">
                      <td className="p-4 border-r-2 border-gray-400">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>List Price</span>
                          <span className={ds.body}>{getPrice()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>MLS Number</span>
                          <span className={ds.body}>{property.listing_key || property.ListingKey || property.PropertyKey}</span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Row 2 */}
                    <tr className="border-b-2 border-gray-400">
                      <td className="p-4 border-r-2 border-gray-400">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Category Type</span>
                          <span className={ds.body}>{property.category_type || property.PropertyType || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Status</span>
                          <span className={ds.body}>{property.standard_status || property.StandardStatus || 'N/A'}</span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Row 3 */}
                    <tr className="border-b-2 border-gray-400">
                      <td className="p-4 border-r-2 border-gray-400">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Photos Count</span>
                          <span className={ds.body}>{property.photos_count || property.Photos?.length || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Postal Code</span>
                          <span className={ds.body}>{property.postal_code || property.PostalCode || 'N/A'}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Building Facts Header */}
                    <tr>
                      <th colSpan={2} className="bg-gray-100 p-4 text-left font-semibold border-b-2 border-gray-400">
                        Building Facts
                      </th>
                    </tr>

                    {/* Building Facts Row 1 */}
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
                          <span className={ds.body}>{property.year_built || property.YearBuilt || 'N/A'}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Building Facts Row 2 */}
                    <tr className="border-b-2 border-gray-400">
                      <td className="p-4 border-r-2 border-gray-400">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Building Area</span>
                          <span className={ds.body}>{getLivingArea()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Rooms</span>
                          <span className={ds.body}>{property.rooms?.length || property.Rooms?.length || 'N/A'}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Room Details */}
                    {property.rooms && property.rooms.length > 0 && (
                      <>
                        <tr>
                          <th colSpan={2} className="bg-gray-100 p-4 text-left font-semibold border-b-2 border-gray-400">
                            Room Details
                          </th>
                        </tr>
                        {property.rooms.slice(0, 3).map((room: any, index: number) => (
                          <tr key={index} className="border-b-2 border-gray-400">
                            <td className="p-4 border-r-2 border-gray-400">
                              <div className="flex justify-between">
                                <span className={ds.bodyRegular}>{room.room_type}</span>
                                <span className={ds.body}>{room.room_level}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex justify-between">
                                <span className={ds.bodyRegular}>Dimensions</span>
                                <span className={ds.body}>{room.room_dimensions || 'N/A'}</span>
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
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Location Map with OpenStreetMap */}
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
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(property.longitude) - 0.01},${parseFloat(property.latitude) - 0.01},${parseFloat(property.longitude) + 0.01},${parseFloat(property.latitude) + 0.01}&layer=mapnik&marker=${property.latitude},${property.longitude}`}
                    style={{ border: 'none' }}
                  ></iframe>
                ) : (
                  <div className="h-full bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-ds-body mx-auto mb-2" />
                      <p className="text-sm text-gray-600">{getCity()}, {property.StateOrProvince || 'Ontario'}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {property.latitude && property.longitude ? (
                  <span>Lat: {property.latitude}, Lng: {property.longitude}</span>
                ) : (
                  <span>{getCity()}, {property.StateOrProvince || 'Ontario'}</span>
                )}
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-ds-card border border-ds-card-border rounded-xl p-6">
              <h3 className={`${ds.text} mb-4`}>Property Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Bed className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Bedrooms: <span className={ds.body}>{getBedCount()}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <Bath className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Bathrooms: <span className={ds.body}>{getBathCount()}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <Maximize className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Building Area: <span className={ds.body}>{getLivingArea()}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <HomeIcon className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Property Type: <span className={ds.body}>{getPropertyType()}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Year Built: <span className={ds.body}>{property.year_built || property.YearBuilt || 'N/A'}</span></span>
                </div>
                {property.postal_code && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-ds-body" />
                    <span className={ds.bodyRegular}>Postal Code: <span className={ds.body}>{property.postal_code}</span></span>
                  </div>
                )}
              </div>
            </div>

            {/* Property Features */}
            <div className="bg-ds-card border border-ds-card-border rounded-xl p-6">
              <h3 className={`${ds.text} mb-4`}>Property Features</h3>
              <div className="space-y-3">
                <div>
                  <h4 className={`${ds.body} font-semibold mb-2`}>Listing URL</h4>
                  <a 
                    href={property.listing_url || `https://www.realtor.ca/real-estate/${property.listing_key || property.ListingKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    View on Realtor.ca
                  </a>
                </div>
                {property.photos_count && (
                  <div className="flex justify-between">
                    <span className={ds.bodyRegular}>Total Photos</span>
                    <span className={ds.body}>{property.photos_count}</span>
                  </div>
                )}
                {property.rooms && property.rooms.length > 0 && (
                  <div>
                    <h4 className={`${ds.body} font-semibold mb-2`}>Rooms ({property.rooms.length})</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {property.rooms.map((room: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{room.room_type}</span>
                          <span className="text-gray-600">{room.room_dimensions}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties Section */}
        <div className="mt-16">
          <h2 className={`${ds.h2} mb-8`}>Similar Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: 1,
                image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
                price: "$850,000",
                address: "123 Oak Street",
                city: getCity(),
                province: property.StateOrProvince || 'Ontario',
                beds: 3,
                baths: 2,
                sqft: "2,100",
                type: getPropertyType()
              },
              {
                id: 2,
                image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
                price: "$725,000",
                address: "456 Maple Avenue",
                city: getCity(),
                province: property.StateOrProvince || 'Ontario',
                beds: 4,
                baths: 3,
                sqft: "2,400",
                type: getPropertyType()
              },
              {
                id: 3,
                image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80",
                price: "$950,000",
                address: "789 Pine Boulevard",
                city: getCity(),
                province: property.StateOrProvince || 'Ontario',
                beds: 5,
                baths: 4,
                sqft: "3,200",
                type: getPropertyType()
              }
            ].map((similarProperty) => (
              <div key={similarProperty.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <img
                    src={similarProperty.image}
                    alt={similarProperty.address}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-ds-primary text-white px-2 py-1 rounded text-sm font-semibold">
                    {similarProperty.type}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className={`${ds.h4} text-ds-primary mb-2`}>{similarProperty.price}</h3>
                  <p className={`${ds.bodyRegular} text-ds-heading mb-1`}>{similarProperty.address}</p>
                  <p className={`${ds.small} text-ds-body mb-3`}>{similarProperty.city}, {similarProperty.province}</p>
                  <div className="flex items-center gap-4 text-ds-body text-sm">
                    <div className="flex items-center gap-1">
                      <Bed className="w-4 h-4" />
                      <span>{similarProperty.beds}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="w-4 h-4" />
                      <span>{similarProperty.baths}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Maximize className="w-4 h-4" />
                      <span>{similarProperty.sqft} sq ft</span>
                    </div>
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