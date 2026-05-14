"use client";

import React, { useMemo, useState } from "react";
import { ds } from "@/lib/design-system-utils";
import type { Property } from "@/lib/api";
import {
  getFormattedRoomDimensions,
  getPropertyDetailSections,
} from "@/lib/propertyUtils";
import { getListingIsPrivileged } from "@/lib/listingDisplay";

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
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const isPrivileged = getListingIsPrivileged();
  const sections = useMemo(
    () =>
      getPropertyDetailSections(
        property,
        { price, type, livingArea },
        { isPrivileged },
      ),
    [property, price, type, livingArea, isPrivileged],
  );
  const rooms = useMemo(
    () =>
      (property.rooms || property.Rooms || []) as unknown as Array<
        Record<string, unknown>
      >,
    [property],
  );
  const visibleRooms = (showAllRooms ? rooms : rooms.slice(0, 5)).map((room) => {
    const name = String(room.room_type || room.RoomType || "").trim();
    const dims = getFormattedRoomDimensions(room).trim();
    return { name, dims };
  }).filter((room) => room.name || room.dims);
  const hasMoreRooms = rooms.length > 5;

  const normalizeLabel = (label: string) => {
    const map: Record<string, string> = {
      "List Price": "Asking Price",
      "Rooms Total": "Total Rooms",
      "SqFt": "Living Area",
      "MLS#": "MLS Number",
    };
    return map[label] ?? label;
  };

  const getSectionItems = (index: number, items: Array<{ label: string; value: string }>) => {
    const isExpanded = expandedSections[index] ?? false;
    if (items.length <= 6 || isExpanded) return items;
    return items.slice(0, 6);
  };

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const totalCards = sections.length + (rooms.length > 0 ? 1 : 0);
  const hasOrphan = totalCards % 2 !== 0;

  return (
    <div className="space-y-6">
      <h2 className={`${ds.h3}`}>Property Records</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => {
          const isLastCard = idx === sections.length - 1;
          const isOrphanedSection = isLastCard && hasOrphan && rooms.length === 0;
          return (
          <div
            key={idx}
            className={`border border-ds-card-border rounded-xl overflow-hidden shadow-sm${isOrphanedSection ? " md:col-span-2" : ""}`}
          >
            <div className="bg-ds-card px-4 py-3 border-b border-ds-card-border">
              <h3 className="text-sm font-bold text-ds-heading">
                {section.title}
              </h3>
            </div>
            <div className="p-4 sm:p-5 space-y-3.5">
              {getSectionItems(idx, section.items).map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-start gap-4 text-sm"
                >
                  <span className="text-ds-body leading-relaxed">{normalizeLabel(item.label)}</span>
                  <span className="font-semibold text-ds-heading text-right leading-relaxed">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            {section.items.length > 6 && (
              <div className="px-4 sm:px-5 pb-4">
                <button
                  type="button"
                  onClick={() => toggleSection(idx)}
                  className="text-sm font-medium text-ds-primary hover:underline"
                >
                  {expandedSections[idx]
                    ? "Show fewer details"
                    : `Show more details (${section.items.length})`}
                </button>
              </div>
            )}
          </div>
          );
        })}

        {/* Room Details if available */}
        {rooms.length > 0 && (
          <div className={`border border-ds-card-border rounded-xl overflow-hidden shadow-sm${hasOrphan ? " md:col-span-2" : ""}`}>
            <div className="bg-ds-card px-4 py-3 border-b border-ds-card-border">
              <h3 className="text-sm font-bold text-ds-heading">
                Room Details
              </h3>
            </div>
            <div className="p-4 sm:p-5 max-h-64 overflow-y-auto space-y-3.5">
              {visibleRooms.map((room, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-start gap-4 text-sm"
                  >
                    {room.name && <span className="text-ds-body leading-relaxed">{room.name}</span>}
                    {room.dims && (
                      <span className="font-semibold text-ds-heading text-right leading-relaxed">
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
