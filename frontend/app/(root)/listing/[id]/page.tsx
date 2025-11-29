import { Bed, Bath, Maximize, Car, Calendar, Home as HomeIcon, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyGallery from "@/components/listing/PropertyGallery";
import { ds } from "@/lib/design-system-utils";

export function generateStaticParams() {
  // Generate params for all property IDs (1-6 for now)
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' },
  ];
}

export default function ListingPage() {
  const propertyImages = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  ];

  const propertyHistory = [
    { date: "Apr 25, 2025", event: "For Lease", price: "$2,000,000", source: "MLS # 45776389" },
    { date: "Apr 25, 2025", event: "For Lease", price: "$2,000,000", source: "MLS # 45776389" },
    { date: "Apr 25, 2025", event: "For Lease", price: "$2,000,000", source: "MLS # 45776389" },
  ];

  const similarHomes = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
      title: "Del Air Villa",
      price: "$12,750,000",
      beds: 4,
      baths: 2,
      sqft: "3,600 sq.ft",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
      title: "Del Air Villa",
      price: "$12,750,000",
      beds: 4,
      baths: 2,
      sqft: "3,600 sq.ft",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80",
      title: "Del Air Villa",
      price: "$12,750,000",
      beds: 4,
      baths: 2,
      sqft: "3,600 sq.ft",
    },
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % propertyImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + propertyImages.length) % propertyImages.length);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {/* Title and Price */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className={`${ds.h2} mb-2`}>Seaside Escape Villa</h1>
            <p className={`${ds.bodyRegular} text-ds-body`}>
              Escape to this beautiful villa overlooking the sea, with breathtaking views for serenity and uninterrupted getaways.
            </p>
          </div>
          <div className="text-right">
            <p className={`${ds.h2} text-ds-primary`}>$2,750,000</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <PropertyGallery images={propertyImages} />

            {/* Overview */}
            <div>
              <h2 className={`${ds.h3} mb-4`}>Overview</h2>
              <p className={`${ds.bodyRegular} text-ds-body leading-relaxed`}>
                Lorem ipsum dolor sit amet consectetur. Dictum mattis pellentesque vivamus convallis ullamcorper molestie in et amet. Vitae non sit sapien tempor eget viverra in dolor risus. Viverra tortor ullamcorper faucibus ipsum dolor fringilla quis feugiat semper. Accumsan lacus morbi lectus suscipit quam velit turpis. Dui pellentesque nec non sit rhoncus venenatis. Nascetur eget sit congue pellentesque nunc. Id faucibus at aliquam laoreet suspendisse pretium. Viverra lobortis massa lobortis aliquam porta maecenas pharetra turpis.
                <br /><br />
                Vivamus etiam viverra cursus aliquam mattis quam aliquet. Eget tellus integer porta elementum dui sit mauris. Vel maecenas purus nunc cursus justo velit convallis vitae egestas. In nam sodales nam euismod suspendisse lectus ultrices. Nibh congue sit adipiscing habitant.
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
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className={`${ds.text} mb-3`}>Taxable Value</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={ds.bodyRegular}>Total</span>
                      <span className={ds.body}>$916,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={ds.bodyRegular}>Additions</span>
                      <span className={ds.body}>$897,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={ds.bodyRegular}>Total</span>
                      <span className={ds.body}>$1,813,000</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className={`${ds.text} mb-3`}>Tax Percent</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={ds.bodyRegular}>Year</span>
                      <span className={ds.body}>-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={ds.bodyRegular}>Taxes</span>
                      <span className={ds.body}>-</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className={`${ds.text} mb-3`}>Home Facts</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={ds.bodyRegular}>Type</span>
                      <span className={ds.body}>-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={ds.bodyRegular}>Time on Property24 (days)</span>
                      <span className={ds.body}>4,016 sq ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={ds.bodyRegular}>Views</span>
                      <span className={ds.body}>7,500 sq ft</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between pt-7">
                    <span className={ds.bodyRegular}>Zoning</span>
                    <span className={ds.body}>-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={ds.bodyRegular}>Lot Size</span>
                    <span className={ds.body}>-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={ds.bodyRegular}>Single-Family Residence</span>
                    <span className={ds.body}>-</span>
                  </div>
                </div>
              </div>
            </div>

            {/* School */}
            <div>
              <h2 className={`${ds.h3} mb-4`}>School</h2>
              <div className="border border-ds-card-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-ds-card">
                    <tr>
                      <th className={`${ds.body} text-left p-4`}>School</th>
                      <th className={`${ds.body} text-left p-4`}>Type</th>
                      <th className={`${ds.body} text-left p-4`}>Grades</th>
                      <th className={`${ds.body} text-right p-4`}>Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-ds-card-border">
                      <td className={`${ds.bodyRegular} p-4`}>Lower East Middle School</td>
                      <td className={`${ds.bodyRegular} p-4`}>$1,400,000.00</td>
                      <td className={`${ds.bodyRegular} p-4`}>5 to K</td>
                      <td className={`${ds.bodyRegular} text-right p-4`}>0.5 mi</td>
                    </tr>
                    <tr className="border-t border-ds-card-border">
                      <td className={`${ds.bodyRegular} p-4`}>Lower East Middle School</td>
                      <td className={`${ds.bodyRegular} p-4`}>$1,400,000.00</td>
                      <td className={`${ds.bodyRegular} p-4`}>5 to K</td>
                      <td className={`${ds.bodyRegular} text-right p-4`}>0.5 mi</td>
                    </tr>
                    <tr className="border-t border-ds-card-border">
                      <td className={`${ds.bodyRegular} p-4`}>Lower East Middle School</td>
                      <td className={`${ds.bodyRegular} p-4`}>$1,400,000.00</td>
                      <td className={`${ds.bodyRegular} p-4`}>5 to K</td>
                      <td className={`${ds.bodyRegular} text-right p-4`}>0.5 mi</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Location Map */}
            <div className="bg-ds-card border border-ds-card-border rounded-xl p-4">
              <h3 className={`${ds.text} mb-4`}>Locations</h3>
              <div className="h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <MapPin className="w-8 h-8 text-ds-body" />
              </div>
            </div>

            {/* Contact Sellers */}
            <div className="bg-ds-card border border-ds-card-border rounded-xl p-6">
              <h3 className={`${ds.text} mb-4`}>Contact Sellers</h3>
              
              {/* Agent Info */}
              <div className="flex items-center gap-3 mb-6">
                <img
                  src="https://i.pravatar.cc/150?img=12"
                  alt="Agent"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className={`${ds.body} text-ds-heading`}>Del Air VIlla - New York, NY 10475, USA</p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="space-y-4">
                <div>
                  <label className={`${ds.small} text-ds-body block mb-2`}>Natalie Moore</label>
                  <input
                    type="text"
                    defaultValue="+1234567890"
                    className={ds.input}
                  />
                </div>
                <div>
                  <label className={`${ds.small} text-ds-body block mb-2`}>Whatsapp</label>
                  <input
                    type="text"
                    defaultValue="+1234567890"
                    className={ds.input}
                  />
                </div>
                <div>
                  <label className={`${ds.small} text-ds-body block mb-2`}>Email</label>
                  <input
                    type="email"
                    defaultValue="nataliemoore@gmail.com"
                    className={ds.input}
                  />
                </div>

                <button className={ds.btnPrimary + " w-full"}>
                  Contact us
                </button>
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-ds-card border border-ds-card-border rounded-xl p-6">
              <h3 className={`${ds.text} mb-4`}>Property Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Bed className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Beds: <span className={ds.body}>4</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <Bath className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Bathrooms: <span className={ds.body}>2/2</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <Maximize className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Sqft: <span className={ds.body}>200 sq ft</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Parking: <span className={ds.body}>2/2</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <HomeIcon className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Type: <span className={ds.body}>Villa</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-ds-body" />
                  <span className={ds.bodyRegular}>Year Build: <span className={ds.body}>2023</span></span>
                </div>
              </div>
            </div>

            {/* Property Utility */}
            <div className="bg-ds-card border border-ds-card-border rounded-xl p-6">
              <h3 className={`${ds.text} mb-4`}>Property Utility</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>Heating</span>
                  <span className={ds.body}>Natural Gas</span>
                </div>
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>Cooling</span>
                  <span className={ds.body}>Yes</span>
                </div>
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>Air Condition</span>
                  <span className={ds.body}>Wall Furnace (s)</span>
                </div>
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>Electricity</span>
                  <span className={ds.body}>Yes</span>
                </div>
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>Water</span>
                  <span className={ds.body}>Public</span>
                </div>
                <div className="flex justify-between">
                  <span className={ds.bodyRegular}>Sewer</span>
                  <span className={ds.body}>Public</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Homes */}
        <div className="mt-16">
          <h2 className={`${ds.h2} mb-8`}>Similar Homes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarHomes.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-56">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className={`${ds.h5} text-ds-heading mb-2`}>{property.title}</h3>
                  <p className={`${ds.h4} text-ds-primary mb-4`}>{property.price}</p>
                  <div className="flex items-center gap-4 text-ds-body text-sm">
                    <span>🛏️ {property.beds}</span>
                    <span>🛁 {property.baths}</span>
                    <span>📏 {property.sqft}</span>
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

