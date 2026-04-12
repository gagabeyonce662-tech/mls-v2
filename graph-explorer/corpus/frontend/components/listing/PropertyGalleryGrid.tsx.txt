// components/listing/PropertyGalleryGrid.tsx
"use client";

import React from "react";
import FullGalleryModal from "./FullGalleryModal";
import { motion } from "framer-motion";

interface Props {
  images: string[];
  className?: string;
}

export default function PropertyGalleryGrid({
  images = [],
  className = "",
}: Props) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [startIndex, setStartIndex] = React.useState(0);

  const openAt = (idx: number) => {
    setStartIndex(idx);
    setModalOpen(true);
  };

  if (images.length === 0) return null;

  // Single image layout
  if (images.length === 1) {
    return (
      <div
        className={`w-full aspect-[21/9] rounded-xl overflow-hidden cursor-pointer group ${className}`}
        onClick={() => openAt(0)}
      >
        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6 }}
          src={images[0]}
          alt="Property"
          className="w-full h-full object-cover"
        />
        <FullGalleryModal
          images={images}
          startIndex={startIndex}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </div>
    );
  }

  // Two images layout
  if (images.length === 2) {
    return (
      <div
        className={`grid grid-cols-2 gap-4 w-full aspect-[21/9] rounded-xl overflow-hidden ${className}`}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="relative overflow-hidden cursor-pointer group"
            onClick={() => openAt(i)}
          >
            <motion.img
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6 }}
              src={src}
              alt={`Property ${i}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        <FullGalleryModal
          images={images}
          startIndex={startIndex}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </div>
    );
  }

  // default grid for 3+ images
  return (
    <>
      <div
        className={`w-full aspect-[21/9] grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 rounded-xl overflow-hidden ${className}`}
      >
        {/* Main image */}
        <div
          onClick={() => openAt(0)}
          className="md:col-span-2 md:row-span-2 relative overflow-hidden cursor-pointer group"
        >
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
            src={images[0]}
            alt="Property hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
          <div className="absolute left-4 bottom-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            For Sale
          </div>
        </div>

        {/* Second image */}
        <div
          onClick={() => openAt(1)}
          className="md:col-span-1 md:row-span-1 border-gray-400 relative overflow-hidden cursor-pointer group"
        >
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
            src={images[1]}
            alt="Property thumb 1"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
        </div>

        {/* Third image */}
        <div
          onClick={() => openAt(2)}
          className="md:col-span-1 md:row-span-1 relative overflow-hidden cursor-pointer group"
        >
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
            src={images[2]}
            alt="Property thumb 2"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
        </div>

        {/* Fourth image / See more */}
        <div
          onClick={() => openAt(3)}
          className="md:col-span-2 md:row-span-1 relative overflow-hidden cursor-pointer group"
        >
          {images[3] ? (
            <>
              <motion.img
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6 }}
                src={images[3]}
                alt="Property thumb 3"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <span className="text-white font-bold text-lg md:text-xl">
                  +{images.length - 3} Photos
                </span>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
              Coming soon
            </div>
          )}
        </div>
      </div>

      <FullGalleryModal
        images={images}
        startIndex={startIndex}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
