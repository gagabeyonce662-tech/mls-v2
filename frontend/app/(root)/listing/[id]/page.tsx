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
  
  // Extract property images from API data - no fallback to dummy images
  const propertyImages = property.Media?.length > 0 
    ? property.Media.map((media: any) => media.MediaURL || media.LargePhoto).filter(Boolean)
    : property.Photos?.length > 0 
    ? property.Photos.map((photo: any) => photo.PhotoURL || photo).filter(Boolean)
    : [];

  const hasImages = propertyImages.length > 0;

  // Extract property history from API data
  const propertyHistory = [
    {
      date: property.ListingContractDate || property.OnMarketDate || new Date(property.ModificationTimestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      event: property.StandardStatus || 'Listed',
      price: property.ListPrice ? `$${property.ListPrice.toLocaleString()}` : 'Price on request',
      source: `MLS # ${property.ListingKey || property.PropertyKey}`
    },
  ];



  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {/* Title and Price */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className={`${ds.h2} mb-2`}>{property.PropertySubType} Property in {property.City}</h1>
            <p className={`${ds.bodyRegular} text-ds-body`}>
              {property.City}, {property.StateOrProvince} • {property.StandardStatus}
            </p>
          </div>
          <div className="text-right">
            <p className={`${ds.h2} text-ds-primary`}>${property.ListPrice?.toLocaleString() || 'Price on request'}</p>
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
                {property.PublicRemarks || property.PrivateRemarks || property.Description || (
                  `This ${property.PropertySubType || 'property'} is located in ${property.City}, ${property.StateOrProvince}. ` +
                  `Built in ${property.YearBuilt || 'N/A'}, this property features ${property.BedroomsTotal || 'multiple'} bedrooms and ${property.BathroomsTotalInteger || 'multiple'} bathrooms` +
                  `${property.LivingArea ? ` with ${property.LivingArea} square feet of living space` : ''}.` +
                  `${property.LotSizeArea ? ` The lot size is ${property.LotSizeArea} square feet.` : ''}` +
                  `${property.GarageSpaces ? ` Parking includes ${property.GarageSpaces} garage spaces.` : ''}`
                )}
                {property.DirectionsToProperty && (
                  <><br /><br /><strong>Directions:</strong> {property.DirectionsToProperty}</>
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
                          <span className={ds.body}>${property.ListPrice?.toLocaleString() || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>MLS Number</span>
                          <span className={ds.body}>{property.ListingKey || property.PropertyKey}</span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Row 2 */}
                    <tr className="border-b-2 border-gray-400">
                      <td className="p-4 border-r-2 border-gray-400">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Original Price</span>
                          <span className={ds.body}>${property.OriginalListPrice?.toLocaleString() || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Status</span>
                          <span className={ds.body}>{property.StandardStatus || 'N/A'}</span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Row 3 */}
                    <tr className="border-b-2 border-gray-400">
                      <td className="p-4 border-r-2 border-gray-400">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Price per Sq Ft</span>
                          <span className={ds.body}>{property.ListPrice && property.LivingArea ? `$${(property.ListPrice / property.LivingArea).toFixed(2)}` : 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Days on Market</span>
                          <span className={ds.body}>{property.DaysOnMarket || property.CumulativeDaysOnMarket || 'N/A'}</span>
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
                          <span className={ds.body}>{property.PropertyType || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Zoning</span>
                          <span className={ds.body}>{property.Zoning || 'N/A'}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Building Facts Row 2 */}
                    <tr className="border-b-2 border-gray-400">
                      <td className="p-4 border-r-2 border-gray-400">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Property Sub Type</span>
                          <span className={ds.body}>{property.PropertySubType || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Lot Size</span>
                          <span className={ds.body}>{property.LotSizeArea ? `${property.LotSizeArea} sq ft` : property.LotSizeDimensions || 'N/A'}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Building Facts Row 3 */}
                    <tr>
                      <td className="p-4 border-r-2 border-gray-400">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Living Area</span>
                          <span className={ds.body}>{property.LivingArea ? `${property.LivingArea} sq ft` : 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-between">
                          <span className={ds.bodyRegular}>Construction</span>
                          <span className={ds.body}>{property.ConstructionMaterials || property.Architectural_Style || 'N/A'}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* School Information - Show only if available */}
            {(property.ElementarySchool || property.MiddleSchool || property.HighSchool || property.School) && (
              <div>
                <h2 className={`${ds.h3} mb-4`}>School Information</h2>
                <div className="border border-ds-card-border rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {property.ElementarySchool && (
                      <div>
                        <h4 className={`${ds.body} font-semibold mb-2`}>Elementary School</h4>
                        <p className={ds.bodyRegular}>{property.ElementarySchool}</p>
                      </div>
                    )}
                    {property.MiddleSchool && (
                      <div>
                        <h4 className={`${ds.body} font-semibold mb-2`}>Middle School</h4>
                        <p className={ds.bodyRegular}>{property.MiddleSchool}</p>
                      </div>
                    )}
                    {property.HighSchool && (
                      <div>
                        <h4 className={`${ds.body} font-semibold mb-2`}>High School</h4>
                        <p className={ds.bodyRegular}>{property.HighSchool}</p>
                      </div>
                    )}
                    {property.School && (
                      <div>
                        <h4 className={`${ds.body} font-semibold mb-2`}>School District</h4>
                        <p className={ds.bodyRegular}>{property.School}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Location Map with OpenStreetMap */}
            <div className="bg-ds-card border border-ds-card-border rounded-xl p-4">
              <h3 className={`${ds.text} mb-4`}>Location</h3>
              <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                {property.Latitude && property.Longitude ? (
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.Longitude - 0.01},${property.Latitude - 0.01},${property.Longitude + 0.01},${property.Latitude + 0.01}&layer=mapnik&marker=${property.Latitude},${property.Longitude}`}
                    style={{ border: 'none' }}
                  ></iframe>
                ) : (
                  <div className="h-full bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-ds-body mx-auto mb-2" />
                      <p className="text-sm text-gray-600">{property.City}, {property.StateOrProvince}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {property.Latitude && property.Longitude ? (
                  <span>Lat: {property.Latitude}, Lng: {property.Longitude}</span>
                ) : (
                  <span>{property.City}, {property.StateOrProvince}</span>
                )}
                {property.MapCoordinateSource && (
                  <span className="ml-2">• Source: {property.MapCoordinateSource}</span>
                )}
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-ds-card border border-ds-card-border rounded-xl p-6">
              <h3 className={`${ds.text} mb-4`}>Property Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Bed className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Bedrooms: <span className={ds.body}>{property.BedroomsTotal || 'N/A'}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <Bath className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Bathrooms: <span className={ds.body}>{property.BathroomsTotalInteger || property.BathroomsTotal || 'N/A'}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <Maximize className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Living Area: <span className={ds.body}>{property.LivingArea ? `${property.LivingArea} sq ft` : 'N/A'}</span></span>
                </div>
                {(property.LotSizeArea || property.LotSizeDimensions) && (
                  <div className="flex items-center gap-3">
                    <Maximize className="w-5 h-5 text-ds-body" />
                    <span className={ds.bodyRegular}>Lot Size: <span className={ds.body}>{property.LotSizeArea ? `${property.LotSizeArea} sq ft` : property.LotSizeDimensions || 'N/A'}</span></span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Parking: <span className={ds.body}>{property.GarageSpaces ? `${property.GarageSpaces} spaces` : property.ParkingTotal || 'N/A'}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <HomeIcon className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Property Type: <span className={ds.body}>{property.PropertySubType || property.PropertyType || 'N/A'}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Year Built: <span className={ds.body}>{property.YearBuilt || 'N/A'}</span></span>
                </div>
                {property.StoriesTotal && (
                  <div className="flex items-center gap-3">
                    <HomeIcon className="w-5 h-5 text-ds-body" />
                    <span className={ds.bodyRegular}>Stories: <span className={ds.body}>{property.StoriesTotal}</span></span>
                  </div>
                )}
              </div>
            </div>

            {/* Property Utility */}
            <div className="bg-ds-card border border-ds-card-border rounded-xl p-6">
              <h3 className={`${ds.text} mb-4`}>Property Utility & Features</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>Heating</span>
                  <span className={ds.body}>{property.Heating || property.HeatingType || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>Cooling</span>
                  <span className={ds.body}>{property.Cooling || property.CoolingType || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>Utilities</span>
                  <span className={ds.body}>{property.Utilities || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>Water Source</span>
                  <span className={ds.body}>{property.WaterSource || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>Sewer</span>
                  <span className={ds.body}>{property.Sewer || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>Foundation</span>
                  <span className={ds.body}>{property.Foundation || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>Roof</span>
                  <span className={ds.body}>{property.Roof || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Property Information */}
        <div className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Property Features */}
            {(property.InteriorFeatures || property.ExteriorFeatures || property.Appliances) && (
              <div className="bg-ds-card border border-ds-card-border rounded-xl p-6">
                <h3 className={`${ds.h4} mb-4`}>Features & Amenities</h3>
                <div className="space-y-4">
                  {property.InteriorFeatures && (
                    <div>
                      <h4 className={`${ds.body} font-semibold mb-2`}>Interior Features</h4>
                      <p className={`${ds.bodyRegular} text-ds-body`}>{property.InteriorFeatures}</p>
                    </div>
                  )}
                  {property.ExteriorFeatures && (
                    <div>
                      <h4 className={`${ds.body} font-semibold mb-2`}>Exterior Features</h4>
                      <p className={`${ds.bodyRegular} text-ds-body`}>{property.ExteriorFeatures}</p>
                    </div>
                  )}
                  {property.Appliances && (
                    <div>
                      <h4 className={`${ds.body} font-semibold mb-2`}>Appliances</h4>
                      <p className={`${ds.bodyRegular} text-ds-body`}>{property.Appliances}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Location & Neighborhood */}
            <div className="bg-ds-card border border-ds-card-border rounded-xl p-6">
              <h3 className={`${ds.h4} mb-4`}>Location Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>Address</span>
                  <span className={ds.body}>{property.UnparsedAddress || `${property.City}, ${property.StateOrProvince}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>Postal Code</span>
                  <span className={ds.body}>{property.PostalCode || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>County</span>
                  <span className={ds.body}>{property.CountyOrParish || 'N/A'}</span>
                </div>
                {property.Directions && (
                  <div>
                    <span className={ds.bodyRegular}>Directions</span>
                    <p className={`${ds.body} mt-1`}>{property.Directions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        <div className="mt-16">
          <h2 className={`${ds.h2} mb-8`}>Similar Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: 1,
                image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
                price: "$850,000",
                address: "123 Oak Street",
                city: property.City,
                province: property.StateOrProvince,
                beds: 3,
                baths: 2,
                sqft: "2,100",
                type: property.PropertySubType || "House"
              },
              {
                id: 2,
                image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
                price: "$725,000",
                address: "456 Maple Avenue",
                city: property.City,
                province: property.StateOrProvince,
                beds: 4,
                baths: 3,
                sqft: "2,400",
                type: property.PropertySubType || "House"
              },
              {
                id: 3,
                image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80",
                price: "$950,000",
                address: "789 Pine Boulevard",
                city: property.City,
                province: property.StateOrProvince,
                beds: 5,
                baths: 4,
                sqft: "3,200",
                type: property.PropertySubType || "House"
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

        {/* Similar Properties */}
        <div className="mt-16">
          <h2 className={`${ds.h2} mb-8`}>Similar Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: 1,
                image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
                price: "$850,000",
                address: "123 Oak Street",
                city: property.City,
                province: property.StateOrProvince,
                beds: 3,
                baths: 2,
                sqft: "2,100",
                type: property.PropertySubType || "House"
              },
              {
                id: 2,
                image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
                price: "$725,000",
                address: "456 Maple Avenue",
                city: property.City,
                province: property.StateOrProvince,
                beds: 4,
                baths: 3,
                sqft: "2,400",
                type: property.PropertySubType || "House"
              },
              {
                id: 3,
                image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80",
                price: "$950,000",
                address: "789 Pine Boulevard",
                city: property.City,
                province: property.StateOrProvince,
                beds: 5,
                baths: 4,
                sqft: "3,200",
                type: property.PropertySubType || "House"
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

