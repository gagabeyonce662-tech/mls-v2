import React, { useRef, useState, MouseEvent } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { ComparisonProperty } from "./types";

interface ComparisonTableProps {
  properties: ComparisonProperty[];
  onRemove: (id: string) => void;
  onAddClick: () => void;
}

export function ComparisonTable({
  properties,
  onRemove,
  onAddClick,
}: ComparisonTableProps) {
  const fields = [
    { label: "Price", key: "price", format: (value: any) => value },
    { label: "Address", key: "address", format: (value: any) => value },
    { label: "City", key: "municipality", format: (value: any) => value },
    { label: "Province", key: "province", format: (value: any) => value },
    { label: "Postal Code", key: "postalCode", format: (value: any) => value },
    {
      label: "Property Type",
      key: "propertyType",
      format: (value: any) => value,
    },
    {
      label: "Bedrooms",
      key: "bedrooms",
      format: (value: any) => ((value as number) > 0 ? value : "—"),
    },
    {
      label: "Bathrooms",
      key: "bathrooms",
      format: (value: any) => ((value as number) > 0 ? value : "—"),
    },
    {
      label: "Total Rooms",
      key: "totalRooms",
      format: (value: any) => ((value as number) > 0 ? value : "—"),
    },
    {
      label: "Year Built",
      key: "yearBuilt",
      format: (value: any) => value || "—",
    },
    { label: "Garage/Parking", key: "garage", format: (value: any) => value },
    {
      label: "Air Conditioning",
      key: "airConditioning",
      format: (value: any) => value,
    },
    { label: "Basement", key: "basement", format: (value: any) => value },
    { label: "Zoning", key: "zoning", format: (value: any) => value },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setStartY(e.pageY - scrollRef.current.offsetTop);
    setScrollLeft(scrollRef.current.scrollLeft);
    setScrollTop(scrollRef.current.scrollTop);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const y = e.pageY - scrollRef.current.offsetTop;
    const walkX = (x - startX) * 2; // Scroll-fast multiplier
    const walkY = (y - startY) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walkX;
    scrollRef.current.scrollTop = scrollTop - walkY;
  };

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      className={`max-h-[80vh] overflow-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 select-none ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-200">
          <tr>
            <th
              scope="col"
              className="px-6 py-4 w-48 bg-white z-40 sticky left-0 top-0 align-bottom border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"
            >
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-900">Compare</h3>
                <p className="text-sm text-gray-500 font-normal mt-1">
                  Side-by-side analysis
                </p>
              </div>
            </th>
            {properties.map((property) => (
              <th
                key={property.id}
                scope="col"
                className="px-6 py-4 min-w-[320px] max-w-[320px] align-top bg-white font-normal z-30 sticky top-0"
              >
                <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-white">
                  <button
                    onClick={() => onRemove(property.id)}
                    className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-full z-10 transition-colors shadow-sm"
                    title="Remove property"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {property.error ? (
                    <div className="h-48 bg-red-50 flex items-center justify-center flex-col p-4 text-center border-b border-gray-100">
                      <span className="text-red-500 font-medium mb-2">
                        Unavailable
                      </span>
                      <span className="text-red-400 text-xs">
                        Could not load this property.
                      </span>
                    </div>
                  ) : property.image ? (
                    <div className="h-48 bg-gray-100 border-b border-gray-100">
                      <Image
                        src={property.image}
                        alt={property.address}
                        width={320}
                        height={192}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-50 flex items-center justify-center border-b border-gray-100">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}

                  <div className="p-4 text-left">
                    <h4 className="font-semibold text-gray-900 truncate text-base">
                      {property.error
                        ? "Error Loading Data"
                        : property.propertyType}
                    </h4>
                    {!property.error && (
                      <p className="text-gray-600 text-sm truncate mt-1">
                        {property.municipality}, {property.province}
                      </p>
                    )}
                  </div>
                </div>
              </th>
            ))}

            {/* Empty Slot for "Add Property" if less than 5 */}
            {properties.length < 5 && (
              <th
                scope="col"
                className="px-6 py-4 min-w-[320px] max-w-[320px] align-top bg-white font-normal z-30 sticky top-0"
              >
                <button
                  onClick={onAddClick}
                  className="w-full h-full min-h-[260px] border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition-colors flex flex-col items-center justify-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100/50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                    <Plus className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-gray-700 font-medium">Add Property</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Click to add more properties
                  </p>
                </button>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {fields.map(({ label, key, format }, index) => (
            <tr
              key={key}
              className={index % 2 === 0 ? "bg-gray-50/50" : "bg-white"}
            >
              <td className="px-6 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap w-48 sticky left-0 z-10 bg-inherit border-r border-gray-50">
                {label}
              </td>
              {properties.map((property) => (
                <td
                  key={`${property.id}-${key}`}
                  className="px-6 py-4 text-left text-sm text-gray-700 whitespace-nowrap min-w-[320px] max-w-[320px] truncate"
                >
                  {property.error ? (
                    <span className="text-gray-300">—</span>
                  ) : (
                    <span
                      className={
                        key === "price"
                          ? "font-semibold text-gray-900 text-base"
                          : ""
                      }
                    >
                      {format(property[key as keyof ComparisonProperty])}
                    </span>
                  )}
                </td>
              ))}
              {/* Fill empty cells structurally for the "Add Property" column */}
              {properties.length < 5 && (
                <td className="px-6 py-4 min-w-[320px] max-w-[320px]"></td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
