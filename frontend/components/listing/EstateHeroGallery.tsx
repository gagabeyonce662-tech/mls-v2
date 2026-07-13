"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Image as ImageIcon,
  Map,
  Navigation,
  PlayCircle,
} from "lucide-react";
import FullGalleryModal from "@/components/listing/FullGalleryModal";
import { cn } from "@/lib/utils";

interface EstateHeroGalleryProps {
  images: string[];
  statusLabel?: string;
  tourUrl?: string | null;
  videoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  listingKey?: string;
  className?: string;
}

export default function EstateHeroGallery({
  images,
  statusLabel,
  tourUrl,
  videoUrl,
  latitude,
  longitude,
  listingKey,
  className,
}: EstateHeroGalleryProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const normalizedImages = useMemo(
    () =>
      Array.from(
        new Set(
          images.map((image) => String(image || "").trim()).filter(Boolean),
        ),
      ),
    [images],
  );

  const hasCoordinates =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude);

  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : null;
  const streetViewUrl = hasCoordinates
    ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`
    : null;
  const mapSearchUrl = hasCoordinates
    ? `/map-search?lat=${latitude}&lng=${longitude}&zoom=15${
        listingKey ? `&id=${encodeURIComponent(listingKey)}` : ""
      }`
    : null;

  const openGallery = (index = 0) => {
    setStartIndex(index);
    setModalOpen(true);
  };

  if (normalizedImages.length === 0) {
    return (
      <section
        className={cn(
          "flex h-[360px] items-center justify-center overflow-hidden rounded-[28px] border border-dashed border-slate-300 bg-slate-100",
          className,
        )}
      >
        <div className="text-center text-slate-500">
          <ImageIcon className="mx-auto h-10 w-10" />
          <p className="mt-3 text-sm font-semibold">No images available</p>
        </div>
      </section>
    );
  }

  const imageCount = normalizedImages.length;
  const showMosaic = imageCount >= 3;

  return (
    <>
      <section
        className={cn(
          "group relative overflow-hidden rounded-[28px] bg-slate-900 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.55)]",
          className,
        )}
      >
        <div
          className={cn(
            "grid h-[380px] gap-1.5 sm:h-[470px] lg:h-[560px]",
            showMosaic
              ? "lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:grid-rows-2"
              : imageCount === 2
                ? "lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"
                : "grid-cols-1",
          )}
        >
          <button
            type="button"
            onClick={() => openGallery(0)}
            className={cn(
              "relative h-full min-h-0 overflow-hidden text-left",
              showMosaic && "lg:row-span-2",
            )}
            aria-label="Open property gallery"
          >
            <img
              src={normalizedImages[0]}
              alt="Property exterior"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.015]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
          </button>

          {imageCount >= 2 ? (
            <button
              type="button"
              onClick={() => openGallery(1)}
              className="relative hidden min-h-0 overflow-hidden lg:block"
              aria-label="Open image 2"
            >
              <img
                src={normalizedImages[1]}
                alt="Property image 2"
                className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-black/5" />
            </button>
          ) : null}

          {imageCount >= 3 ? (
            <button
              type="button"
              onClick={() => openGallery(2)}
              className="relative hidden min-h-0 overflow-hidden lg:block"
              aria-label="Open image 3"
            >
              <img
                src={normalizedImages[2]}
                alt="Property image 3"
                className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
            </button>
          ) : null}
        </div>

        <div className="absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
          <div>
            {statusLabel ? (
              <span className="inline-flex rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm backdrop-blur">
                {statusLabel}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {videoUrl ? (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/65 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-slate-950/80"
              >
                <PlayCircle className="h-4 w-4" />
                Video
              </a>
            ) : null}
            {tourUrl ? (
              <a
                href={tourUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/65 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-slate-950/80"
              >
                <ExternalLink className="h-4 w-4" />
                Virtual tour
              </a>
            ) : null}
            {mapSearchUrl ? (
              <Link
                href={mapSearchUrl}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/65 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-slate-950/80"
              >
                <Map className="h-4 w-4" />
                Map
              </Link>
            ) : null}
            {streetViewUrl ? (
              <a
                href={streetViewUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-2 rounded-full border border-white/20 bg-slate-950/65 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-slate-950/80 sm:inline-flex"
              >
                <Navigation className="h-4 w-4" />
                Street view
              </a>
            ) : null}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
          {googleMapsUrl ? (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden text-xs font-medium text-white/85 underline-offset-4 hover:text-white hover:underline sm:inline"
            >
              Open in Google Maps
            </a>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={() => openGallery(0)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            <ImageIcon className="h-4 w-4" />
            View all {imageCount} {imageCount === 1 ? "photo" : "photos"}
          </button>
        </div>
      </section>

      <FullGalleryModal
        images={normalizedImages}
        startIndex={startIndex}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
