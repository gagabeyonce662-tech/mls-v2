import React from "react";
import { ds } from "@/lib/design-system-utils";

interface PropertyDetailsGridProps {
  property: any;
  price: string;
  type: string;
  livingArea: string;
}

export default function PropertyDetailsGrid({
  property,
  price,
  type,
  livingArea,
}: PropertyDetailsGridProps) {
  const sections = [
    {
      title: "Financial Information",
      items: [
        { label: "List Price", value: price },
        {
          label: "Status",
          value: property.standard_status || property.StandardStatus || "N/A",
        },
        {
          label: "MLS Number",
          value:
            property.listing_key ||
            property.ListingKey ||
            property.PropertyKey ||
            "N/A",
        },
      ],
    },
    {
      title: "Building Facts",
      items: [
        { label: "Property Type", value: type },
        {
          label: "Year Built",
          value: property.year_built || property.YearBuilt || "N/A",
        },
        { label: "Building Area", value: livingArea },
      ],
    },
    {
      title: "Listing Details",
      items: [
        {
          label: "Postal Code",
          value: property.postal_code || property.PostalCode || "N/A",
        },
        {
          label: "Photos Count",
          value: property.photos_count || property.Photos?.length || "N/A",
        },
        {
          label: "Rooms Total",
          value: property.rooms?.length || property.Rooms?.length || "N/A",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className={`${ds.h3}`}>Property Records</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="border border-ds-card-border rounded-xl overflow-hidden shadow-sm"
          >
            <div className="bg-ds-card px-4 py-3 border-b border-ds-card-border">
              <h3 className="text-sm font-bold text-ds-heading">
                {section.title}
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {section.items.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-ds-body">{item.label}</span>
                  <span className="font-semibold text-ds-heading">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Room Details if available */}
        {(property.rooms?.length > 0 || property.Rooms?.length > 0) && (
          <div className="border border-ds-card-border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-ds-card px-4 py-3 border-b border-ds-card-border">
              <h3 className="text-sm font-bold text-ds-heading">
                Room Details
              </h3>
            </div>
            <div className="p-4 max-h-48 overflow-y-auto space-y-3">
              {(property.rooms || property.Rooms)
                .slice(0, 5)
                .map((room: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-ds-body">
                      {room.room_type || room.RoomType}
                    </span>
                    <span className="font-semibold text-ds-heading">
                      {room.room_dimensions || room.RoomDimensions || "N/A"}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
