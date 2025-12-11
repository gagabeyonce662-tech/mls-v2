// components/listing/PropertyGalleryGrid.tsx
"use client";

import React from "react";
import FullGalleryModal from "./FullGalleryModal";

interface Props {
  images: string[];
  // optional className to allow small tweaks from parent
  className?: string;
}

export default function PropertyGalleryGrid({ images = [], className = "" }: Props) {
  // Prepare first 4 slots for the grid UI
  const slots = new Array(4).fill(null as string | null);
  for (let i = 0; i < Math.min(images.length, 4); i++) slots[i] = images[i];

  const [modalOpen, setModalOpen] = React.useState(false);
  const [startIndex, setStartIndex] = React.useState(0);

  const openAt = (idx: number) => {
    setStartIndex(idx);
    setModalOpen(true);
  };

  return (
    <>
      <div
        className={`w-full rounded-lg overflow-hidden ${className}`}
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 16,
        }}
      >
        {/* Left hero: occupies both rows */}
        <div
          onClick={() => openAt(0)}
          role="button"
          className="relative rounded-lg overflow-hidden cursor-pointer"
          style={{
            gridColumn: "1 / 2",
            gridRow: "1 / 3",
            minHeight: 320,
            display: "block",
          }}
        >
          {slots[0] ? (
            <img
              src={slots[0]}
              alt="Property main"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                aspectRatio: "16/9",
              }}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500" style={{ minHeight: 320 }}>
              No image
            </div>
          )}

          <div className="absolute left-4 bottom-4 bg-white/90 px-3 py-1 rounded-full text-sm font-semibold shadow">
            For Sale
          </div>
        </div>

        {/* Right top: wide thumbnail */}
        <div
          onClick={() => openAt(1)}
          role="button"
          className="relative rounded-lg overflow-hidden cursor-pointer"
          style={{
            gridColumn: "2 / 3",
            gridRow: "1 / 2",
            minHeight: 160,
            display: "block",
          }}
        >
          {slots[1] ? (
            <img
              src={slots[1]}
              alt="Thumb 1"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                aspectRatio: "4/3",
              }}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500" style={{ minHeight: 160 }}>
              Coming soon
            </div>
          )}

          {slots[1] && (
            <div className="absolute left-2 top-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Virtual Tour</div>
          )}
        </div>

        {/* Right bottom: two thumbnails side-by-side within the right column */}
        <div
          className="relative"
          style={{
            gridColumn: "2 / 3",
            gridRow: "2 / 3",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          {/* Bottom-left thumbnail */}
          <div
            onClick={() => openAt(2)}
            role="button"
            className="relative rounded-lg overflow-hidden cursor-pointer"
            style={{ minHeight: 120, display: "block" }}
          >
            {slots[2] ? (
              <img
                src={slots[2]}
                alt="Thumb 2"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  aspectRatio: "4/3",
                }}
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500" style={{ minHeight: 120 }}>
                Coming soon
              </div>
            )}
          </div>

          {/* Bottom-right thumbnail with "See all" badge */}
          <div
            onClick={() => openAt(3)}
            role="button"
            className="relative rounded-lg overflow-hidden cursor-pointer"
            style={{ minHeight: 120, display: "block" }}
          >
            {slots[3] ? (
              <img
                src={slots[3]}
                alt="Thumb 3"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  aspectRatio: "4/3",
                }}
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500" style={{ minHeight: 120 }}>
                Coming soon
              </div>
            )}

            <div className="absolute right-3 bottom-3">
              <button
                className="bg-teal-400 text-white text-xs px-3 py-1 rounded-full shadow focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  openAt(0);
                }}
              >
                See all {Math.max(images.length, 0)} photos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <FullGalleryModal images={images} startIndex={startIndex} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
