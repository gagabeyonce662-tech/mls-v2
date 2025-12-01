"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, MapPin, Home, Building2, DollarSign, Bed, Bath, Maximize, Filter } from "lucide-react";
import { ds } from "@/lib/design-system-utils";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MapSearchPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const properties = [
    {
      id: 1,
      title: "Modern Downtown Condo",
      price: "$2,750,000",
      beds: 3,
      baths: 2,
      sqft: "2,400 sq.ft",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
      lat: 45.4215,
      lng: -75.6972,
      address: "123 Main Street, Ottawa, ON"
    },
    {
      id: 2,
      title: "Luxury Waterfront Villa",
      price: "$4,200,000",
      beds: 5,
      baths: 4,
      sqft: "4,800 sq.ft",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
      lat: 45.4235,
      lng: -75.6950,
      address: "456 River Road, Ottawa, ON"
    },
    {
      id: 3,
      title: "Contemporary Family Home",
      price: "$1,850,000",
      beds: 4,
      baths: 3,
      sqft: "3,200 sq.ft",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80",
      lat: 45.4195,
      lng: -75.6990,
      address: "789 Oak Avenue, Ottawa, ON"
    },
  ];

  useEffect(() => {
    setMounted(true);
    
    if (!mapContainer.current || map.current) return;

    // Initialize MapLibre GL map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json', // Free MapLibre style
      center: [-75.6972, 45.4215], // Ottawa coordinates
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add markers for properties
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers (in production, you'd want to track and remove them properly)
    properties.forEach((property) => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundImage = 'url(https://docs.maplibre.org/maplibre-gl-js/docs/assets/custom_marker.png)';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.backgroundSize = 'cover';
      el.style.cursor = 'pointer';

      el.addEventListener('click', () => {
        setSelectedProperty(property);
      });

      new maplibregl.Marker(el)
        .setLngLat([property.lng, property.lat])
        .addTo(map.current!);
    });
  }, [properties]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-16">
        {/* Search Bar */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter city, neighborhood, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <Search className="w-5 h-5" />
                Search
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div ref={mapContainer} className="relative h-[500px] w-full bg-gray-100" />

        {/* Selected Property Info Card */}
        {selectedProperty && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl p-4 w-[350px] z-50">
              <div className="flex gap-4">
                <img
                  src={selectedProperty.image}
                  alt={selectedProperty.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1 text-sm">{selectedProperty.title}</h3>
                  <p className="text-lg font-bold text-blue-600 mb-2">{selectedProperty.price}</p>
                  <div className="flex items-center gap-3 text-gray-600 text-xs">
                    <div className="flex items-center gap-1">
                      <Bed className="w-3 h-3" />
                      <span>{selectedProperty.beds}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="w-3 h-3" />
                      <span>{selectedProperty.baths}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Maximize className="w-3 h-3" />
                      <span>{selectedProperty.sqft}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button className="w-full mt-3 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">
                View Details
              </button>
            </div>
          )}

        {/* Properties Grid Section */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Premium Lifestyle
              </h2>
              <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                View all →
              </button>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...properties, ...properties, ...properties].map((property, index) => (
                <div
                  key={`${property.id}-${index}`}
                  onClick={() => setSelectedProperty(property)}
                  className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer ${
                    selectedProperty?.id === property.id ? 'ring-2 ring-blue-600' : ''
                  }`}
                >
                  <div className="relative h-56">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        For Sale
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-gray-500 mb-1">{property.address}</p>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{property.title}</h3>
                    <p className="text-2xl font-bold text-blue-600 mb-4">{property.price}</p>
                    <div className="flex items-center gap-4 text-gray-600 text-sm border-t border-gray-200 pt-3">
                      <div className="flex items-center gap-1">
                        <Bed className="w-4 h-4" />
                        <span>{property.beds}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="w-4 h-4" />
                        <span>{property.baths}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Maximize className="w-4 h-4" />
                        <span>{property.sqft}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
