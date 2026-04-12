import React, { useState, useMemo } from "react";
import Image from "next/image";
import { X, Search, AlertCircle } from "lucide-react";
import { Property } from "@/lib/api/types";

interface AddPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  isLoadingAvailable: boolean;
  isErrorAvailable: boolean;
  availablePropertiesDataArray: Property[];
  handleAddProperty: (property: any) => void;
  handleRemoveProperty: (id: string) => void;
  router: any;
}

export function AddPropertiesModal({
  isOpen,
  onClose,
  selectedIds,
  isLoadingAvailable,
  isErrorAvailable,
  availablePropertiesDataArray,
  handleAddProperty,
  handleRemoveProperty,
  router,
}: AddPropertiesModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAvailableProperties = useMemo(() => {
    return availablePropertiesDataArray.filter((property: Property) => {
      const propertyId = property.listing_key || "";
      if (selectedIds.includes(propertyId)) {
        return false;
      }

      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      const address = property.unparsed_address || "";
      const city = property.city || "";
      const propertyType = property.property_sub_type || "";
      const listingKey = property.listing_key || "";

      return (
        address.toLowerCase().includes(searchLower) ||
        city.toLowerCase().includes(searchLower) ||
        propertyType.toLowerCase().includes(searchLower) ||
        listingKey.toLowerCase().includes(searchLower)
      );
    });
  }, [availablePropertiesDataArray, selectedIds, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Add Properties to Compare
              </h2>
              <p className="text-gray-600 mt-1">
                Select up to {5 - selectedIds.length} more propert
                {5 - selectedIds.length === 1 ? "y" : "ies"} to compare
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by address, city, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {isLoadingAvailable ? (
            <div className="flex flex-col items-center justify-center h-64 p-6">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <span className="text-gray-600">
                Loading available properties...
              </span>
            </div>
          ) : isErrorAvailable ? (
            <div className="flex flex-col items-center justify-center h-64 p-6">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium mb-2">
                Failed to load properties
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto h-full">
              {filteredAvailableProperties.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 p-6 text-gray-500">
                  No properties found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {filteredAvailableProperties.map((property: Property) => {
                    const propertyId = property.listing_key || "";
                    const isSelected = selectedIds.includes(propertyId);
                    const isMaxReached = selectedIds.length >= 5;

                    const getImageUrl = () => {
                      if (
                        Array.isArray(property.media) &&
                        property.media.length > 0
                      ) {
                        return property.media[0].media_url;
                      }
                      const mediaObj = property.media as any;
                      if (
                        mediaObj &&
                        typeof mediaObj === "object" &&
                        mediaObj.media_url
                      ) {
                        return mediaObj.media_url;
                      }
                      return "";
                    };

                    const getAddress = () =>
                      property.unparsed_address || "Address not available";
                    const getCity = () => property.city || "N/A";
                    const getPropertyType = () =>
                      property.property_sub_type || "Property";
                    const getPrice = () => {
                      if (property.list_price) {
                        const numPrice = Number(property.list_price);
                        if (!isNaN(numPrice) && numPrice > 0) {
                          return `$${numPrice.toLocaleString("en-US")}`;
                        }
                      }
                      return "Price on request";
                    };

                    const bedrooms = property.bedrooms_total || 0;
                    const bathrooms = property.bathrooms_total_integer || 0;

                    return (
                      <div
                        key={propertyId}
                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : isMaxReached && !isSelected
                              ? "opacity-50 cursor-not-allowed"
                              : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => {
                          if (isMaxReached && !isSelected) return;
                          if (isSelected) handleRemoveProperty(propertyId);
                          else handleAddProperty(property);
                        }}
                      >
                        <div className="flex gap-4">
                          {getImageUrl() ? (
                            <div className="w-24 h-24 flex-shrink-0">
                              <Image
                                src={getImageUrl() || ""}
                                alt={getAddress() || ""}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                              <span className="text-gray-500 text-sm">
                                No Image
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {getAddress()}
                            </h3>
                            <p className="text-gray-600 text-sm truncate">
                              {getCity()}, {property.state_or_province || "ON"}
                            </p>
                            <p className="text-gray-600 text-sm truncate">
                              {getPropertyType()}
                            </p>
                            <p className="text-blue-600 font-semibold mt-1 truncate">
                              {getPrice()}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <div className="text-xs text-gray-500 truncate">
                                {bedrooms} bed • {bathrooms} bath
                              </div>
                              <span
                                className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                  isSelected
                                    ? "bg-red-100 text-red-700"
                                    : isMaxReached && !isSelected
                                      ? "bg-gray-100 text-gray-500"
                                      : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {isSelected
                                  ? "Selected"
                                  : isMaxReached
                                    ? "Max Reached"
                                    : "Select"}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1 truncate">
                              ID: {propertyId || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{selectedIds.length}</span> of 5
                properties selected
              </p>
              {filteredAvailableProperties.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Showing {filteredAvailableProperties.length} of{" "}
                  {availablePropertiesDataArray.length} properties
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClose();
                  if (selectedIds.length === 0) {
                    router.push("/exclusive-properties");
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selectedIds.length === 0 ? "Browse Properties" : "Done"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
