// components/listing/PropertyGalleryGrid.tsx
"use client";

import React from "react";
import FullGalleryModal from "./FullGalleryModal";
import { motion } from "framer-motion";

interface Props {
  images: string[];
  media?: Array<{ media_url?: string; media_category?: string }>;
  tourUrl?: string | null;
  className?: string;
  statusLabel?: string;
}

export default function PropertyGalleryGrid({
  images = [],
  media = [],
  tourUrl = null,
  className = "",
  statusLabel = "For Sale",
}: Props) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [startIndex, setStartIndex] = React.useState(0);

  const openAt = (idx: number) => {
    setStartIndex(idx);
    setModalOpen(true);
  };
  const openOnKeyboard =
    (idx: number) => (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openAt(idx);
      }
    };

  const categorized = React.useMemo(() => {
    const bucket = new Map<string, string[]>();
    for (const item of media) {
      const url = item?.media_url;
      if (!url) continue;
      const category = (item.media_category || "Photos").trim();
      if (!bucket.has(category)) bucket.set(category, []);
      bucket.get(category)!.push(url);
    }
    return [...bucket.entries()];
  }, [media]);

  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const effectiveImages = React.useMemo(() => {
    if (!activeCategory) return images;
    const found = categorized.find(([name]) => name === activeCategory);
    return found?.[1]?.length ? found[1] : images;
  }, [activeCategory, categorized, images]);

  if (effectiveImages.length === 0) return null;

  // Single image layout
  if (effectiveImages.length === 1) {
    return (
      <div className="space-y-3">
        {categorized.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {categorized.map(([name]) => (
              <button
                key={name}
                type="button"
                onClick={() => setActiveCategory((prev) => (prev === name ? null : name))}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  activeCategory === name ? "border-ds-primary text-ds-primary" : "border-ds-card-border text-ds-body"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        {tourUrl ? (
          <a
            href={tourUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-sm font-semibold text-ds-primary hover:underline"
          >
            Open virtual tour
          </a>
        ) : null}
        <div
          className={`w-full aspect-[21/9] rounded-xl overflow-hidden cursor-pointer group ${className}`}
          onClick={() => openAt(0)}
          role="button"
          tabIndex={0}
          onKeyDown={openOnKeyboard(0)}
          aria-label="Open photo gallery"
        >
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
            src={effectiveImages[0]}
            alt="Property"
            className="w-full h-full object-cover"
          />
          <FullGalleryModal
            images={effectiveImages}
            startIndex={startIndex}
            open={modalOpen}
            onClose={() => setModalOpen(false)}
          />
        </div>
      </div>
    );
  }

  // Two images layout
  if (effectiveImages.length === 2) {
    return (
      <div className="space-y-3">
        {categorized.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {categorized.map(([name]) => (
              <button
                key={name}
                type="button"
                onClick={() => setActiveCategory((prev) => (prev === name ? null : name))}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  activeCategory === name ? "border-ds-primary text-ds-primary" : "border-ds-card-border text-ds-body"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        <div
          className={`grid grid-cols-2 gap-4 w-full aspect-[21/9] rounded-xl overflow-hidden ${className}`}
        >
          {effectiveImages.map((src, i) => (
            <div
              key={i}
              className="relative overflow-hidden cursor-pointer group"
              onClick={() => openAt(i)}
              role="button"
              tabIndex={0}
              onKeyDown={openOnKeyboard(i)}
              aria-label={`Open photo ${i + 1}`}
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
            images={effectiveImages}
            startIndex={startIndex}
            open={modalOpen}
            onClose={() => setModalOpen(false)}
          />
        </div>
      </div>
    );
  }

  // default grid for 3+ images
  return (
    <>
      {categorized.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {categorized.map(([name]) => (
            <button
              key={name}
              type="button"
              onClick={() => setActiveCategory((prev) => (prev === name ? null : name))}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                activeCategory === name ? "border-ds-primary text-ds-primary" : "border-ds-card-border text-ds-body"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      {tourUrl ? (
        <a
          href={tourUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-3 inline-flex text-sm font-semibold text-ds-primary hover:underline"
        >
          Open virtual tour
        </a>
      ) : null}
      <div
        className={`w-full aspect-[21/9] grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 rounded-xl overflow-hidden ${className}`}
      >
        {/* Main image */}
        <div
          onClick={() => openAt(0)}
          className="md:col-span-2 md:row-span-2 relative overflow-hidden cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={openOnKeyboard(0)}
          aria-label="Open featured photo"
        >
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
            src={effectiveImages[0]}
            alt="Property hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
          <div className="absolute left-4 bottom-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            {statusLabel}
          </div>
        </div>

        {/* Second image */}
        <div
          onClick={() => openAt(1)}
          className="md:col-span-1 md:row-span-1 border-gray-400 relative overflow-hidden cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={openOnKeyboard(1)}
          aria-label="Open photo 2"
        >
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
            src={effectiveImages[1]}
            alt="Property thumb 1"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
        </div>

        {/* Third image */}
        <div
          onClick={() => openAt(2)}
          className="md:col-span-1 md:row-span-1 relative overflow-hidden cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={openOnKeyboard(2)}
          aria-label="Open photo 3"
        >
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6 }}
            src={effectiveImages[2]}
            alt="Property thumb 2"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
        </div>

        {/* Fourth image / See more */}
        <div
          onClick={() => openAt(3)}
          className="md:col-span-2 md:row-span-1 relative overflow-hidden cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={openOnKeyboard(3)}
          aria-label="Open all photos"
        >
          {effectiveImages[3] ? (
            <>
              <motion.img
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6 }}
                src={effectiveImages[3]}
                alt="Property thumb 3"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <span className="text-white font-bold text-lg md:text-xl">
                  +{effectiveImages.length - 3} Photos
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
        images={effectiveImages}
        startIndex={startIndex}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
