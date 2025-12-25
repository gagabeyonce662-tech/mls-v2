// components/listing/FullGalleryModal.tsx
"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: string[];
  startIndex?: number;
  open: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  title?: string;
  scheduleUrl?: string; // optional link for "Schedule Viewing" button
}

export default function FullGalleryModal({
  images,
  startIndex = 0,
  open,
  onClose,
  onIndexChange,
  title,
  scheduleUrl,
}: Props) {
  const [index, setIndex] = React.useState<number>(startIndex);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [startIndex, open]);

  // keyboard nav + close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length, onClose]);

  useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  // lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  if (!open) return null;

  // portal target
  const target = typeof document !== "undefined" ? document.body : null;
  if (!target) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-stretch justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
    >
      {/* left spacer so content centers with thumbnail rail on right */}
      <div className="hidden lg:block w-6" />

      {/* main container */}
      <div className="relative flex-1 max-w-[1400px] mx-4 my-6 rounded-lg flex bg-black">
        {/* Top bar (title + schedule button + close) */}
        <div className="absolute top-4 left-6 right-6 z-30 flex items-center justify-between">
          <div className="text-white text-sm font-medium">{title || ""}</div>

          <div className="flex items-center gap-3">
            {scheduleUrl && (
              <a
                href={scheduleUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-block bg-[#12b7b3] hover:bg-[#0fa8a4] text-white px-3 py-2 rounded-full text-sm font-medium shadow"
              >
                Schedule Viewing
              </a>
            )}

            <button
              onClick={onClose}
              aria-label="Close gallery"
              className="p-2 rounded-full bg-black/40 hover:bg-black/50 focus:outline-none"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Left / main image area */}
        <div className="relative flex-1 flex items-center justify-center p-6">
          {/* Prev arrow (always visible for large screens) */}
          <button
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            aria-label="Previous"
            className="absolute left-2 md:left-6 z-20 hidden md:flex items-center justify-center h-12 w-12 rounded-full bg-black/30 hover:bg-black/40 focus:outline-none"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          {/* Image */}
          <div className="max-h-[88vh] max-w-full flex items-center justify-center">
            <img
              src={images[index]}
              alt={`Photo ${index + 1}`}
              className="object-contain max-h-[88vh] max-w-full rounded"
              draggable={false}
            />
          </div>

          {/* Next arrow */}
          <button
            onClick={() => setIndex((i) => Math.min(i + 1, images.length - 1))}
            aria-label="Next"
            className="absolute right-2 md:right-6 z-20 hidden md:flex items-center justify-center h-12 w-12 rounded-full bg-black/30 hover:bg-black/40 focus:outline-none"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* mobile prev/next bottom row (visible only on small screens) */}
          <div className="absolute bottom-6 left-0 right-0 flex items-center justify-between md:hidden px-6 z-20">
            <button
              onClick={() => setIndex((i) => Math.max(i - 1, 0))}
              className="bg-white/10 text-white px-3 py-2 rounded"
            >
              Prev
            </button>
            <div className="text-white/90 text-sm">{index + 1} / {images.length}</div>
            <button
              onClick={() => setIndex((i) => Math.min(i + 1, images.length - 1))}
              className="bg-white/10 text-white px-3 py-2 rounded"
            >
              Next
            </button>
          </div>
        </div>

        {/* Right thumbnail rail */}
        <div className="w-36 bg-transparent border-l border-white/10 flex flex-col items-center py-6 overflow-y-auto">
          <div className="flex flex-col gap-3 px-2 w-full">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-full h-20 rounded-md overflow-hidden flex items-center justify-center focus:outline-none ${i === index ? "ring-2 ring-offset-0 ring-white" : ""}`}
                aria-label={`Thumbnail ${i + 1}`}
                style={{ background: "#0b0b0b" }}
              >
                <img src={src} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        </div>

        {/* bottom-center counter pill */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="pointer-events-auto bg-white px-3 py-1 rounded-full text-sm font-medium">
            {index + 1} / {images.length}
          </div>
        </div>
      </div>

      {/* right spacer */}
      <div className="hidden lg:block w-6" />
    </div>,
    target
  );
}
