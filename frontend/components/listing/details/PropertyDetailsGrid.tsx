"use client";

import React, { useMemo, useState } from "react";
import { ds } from "@/lib/design-system-utils";
import type { Property } from "@/lib/api";
import {
  getFormattedRoomDimensions,
  getPropertyDetailSections,
} from "@/lib/propertyUtils";

interface PropertyDetailsGridProps {
  property: Property;
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
  const [showAllRooms, setShowAllRooms] = useState(false);
  const sections = useMemo(
    () => getPropertyDetailSections(property, { price, type, livingArea }),
    [property, price, type, livingArea],
  );
  const rooms = useMemo(() => (property.rooms || property.Rooms || []) as Array<Record<string, unknown>>, [property]);
  const visibleRooms = (showAllRooms ? rooms : rooms.slice(0, 5)).map((room) => {
    const name = String(room.room_type || room.RoomType || "").trim();
    const dims = getFormattedRoomDimensions(room).trim();
    return { name, dims };
  }).filter((room) => room.name || room.dims);
  const hasMoreRooms = rooms.length > 5;

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
        {rooms.length > 0 && (
          <div className="border border-ds-card-border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-ds-card px-4 py-3 border-b border-ds-card-border">
              <h3 className="text-sm font-bold text-ds-heading">
                Room Details
              </h3>
            </div>
            <div className="p-4 max-h-48 overflow-y-auto space-y-3">
              {visibleRooms.map((room, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-sm"
                  >
                    {room.name && <span className="text-ds-body">{room.name}</span>}
                    {room.dims && (
                      <span className="font-semibold text-ds-heading">
                        {room.dims}
                      </span>
                    )}
                  </div>
                ))}
            </div>
            {hasMoreRooms && (
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={() => setShowAllRooms((prev) => !prev)}
                  className="text-sm font-medium text-ds-primary hover:underline"
                >
                  {showAllRooms ? "Show fewer rooms" : `Show all rooms (${rooms.length})`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
