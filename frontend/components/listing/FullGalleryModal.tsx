// components/listing/FullGalleryModal.tsx
"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Props {
  images: string[];
  startIndex?: number;
  open: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  title?: string;
  scheduleUrl?: string;
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
  const [prevOpen, setPrevOpen] = React.useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setIndex(startIndex);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight")
        setIndex((i) => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length, onClose]);

  useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  if (!open) return null;

  const target = typeof document !== "undefined" ? document.body : null;
  if (!target) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-stretch justify-center bg-black/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="hidden lg:block w-12" />

      <div className="relative flex-1 max-w-[1400px] mx-4 my-6 rounded-2xl flex bg-black/40 overflow-hidden shadow-2xl border border-white/10">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-40 p-6 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          <div className="text-white text-lg font-semibold tracking-tight">
            {title || "Property Gallery"}
          </div>

          <div className="flex items-center gap-4">
            {scheduleUrl && (
              <a
                href={scheduleUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-block bg-ds-primary hover:bg-ds-primary/90 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                Schedule Viewing
              </a>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main image area */}
        <div className="relative flex-1 flex items-center justify-center p-4 md:p-12">
          {/* Navigation */}
          <button
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            className="absolute left-4 md:left-8 z-30 hidden md:flex items-center justify-center h-14 w-14 rounded-full bg-white/5 hover:bg-white/15 text-white transition-all backdrop-blur-md border border-white/10"
            disabled={index === 0}
          >
            <ChevronLeft
              className={`w-8 h-8 ${index === 0 ? "opacity-20" : ""}`}
            />
          </button>

          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={index}
                src={images[index]}
                alt={`Photo ${index + 1}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="max-h-full max-w-full object-contain drop-shadow-2xl rounded-lg"
                draggable={false}
              />
            </AnimatePresence>
          </div>

          <button
            onClick={() => setIndex((i) => Math.min(i + 1, images.length - 1))}
            className="absolute right-4 md:right-8 z-30 hidden md:flex items-center justify-center h-14 w-14 rounded-full bg-white/5 hover:bg-white/15 text-white transition-all backdrop-blur-md border border-white/10"
            disabled={index === images.length - 1}
          >
            <ChevronRight
              className={`w-8 h-8 ${index === images.length - 1 ? "opacity-20" : ""}`}
            />
          </button>

          {/* Mobile nav */}
          <div className="absolute bottom-10 left-0 right-0 flex items-center justify-between md:hidden px-8 z-30">
            <button
              onClick={() => setIndex((i) => Math.max(i - 1, 0))}
              className="p-3 rounded-full bg-white/10 text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold">
              {index + 1} / {images.length}
            </div>
            <button
              onClick={() =>
                setIndex((i) => Math.min(i + 1, images.length - 1))
              }
              className="p-3 rounded-full bg-white/10 text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Thumbnail rail */}
        <div className="w-40 bg-white/5 backdrop-blur-xl border-l border-white/10 flex flex-col py-8 overflow-y-auto scrollbar-hide">
          <div className="flex flex-col gap-4 px-4 w-full">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`relative aspect-[4/3] rounded-xl overflow-hidden transition-all duration-300 ring-2 ring-offset-2 ring-offset-black ${
                  i === index
                    ? "ring-white opacity-100 scale-105"
                    : "ring-transparent opacity-40 hover:opacity-100"
                }`}
              >
                <Image
                  src={src}
                  alt="thumbnail"
                  width={200}
                  height={150}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        </div>

        {/* Counter Pill */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 hidden md:block">
          <div className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-full text-black text-sm font-bold shadow-2xl">
            {index + 1} / {images.length}
          </div>
        </div>
      </div>

      <div className="hidden lg:block w-12" />
    </motion.div>,
    target,
  );
}
