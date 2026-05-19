"use client";

import React from "react";
import Link from "next/link";
import {
  Home as HomeIcon,
  Image as ImageIcon,
  Map as MapIcon,
  Navigation,
  ExternalLink,
  PlayCircle,
} from "lucide-react";
import FullGalleryModal from "@/components/listing/FullGalleryModal";
import { cn } from "@/lib/utils";

type MediaView = "image" | "video" | "map" | "street";

interface PropertyMediaShowcaseProps {
  images: string[];
  media?: Array<{ media_url?: string; media_category?: string }>;
  className?: string;
  statusLabel?: string;
  tourUrl?: string | null;
  videoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
  stateOrProvince?: string;
  listingKey?: string;
}

const VIEW_OPTIONS: Array<{
  key: MediaView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "image", label: "Image", icon: ImageIcon },
  { key: "video", label: "Video", icon: PlayCircle },
  { key: "map", label: "Map", icon: MapIcon },
  { key: "street", label: "Street", icon: Navigation },
];
const IMAGE_ROTATION_MS = 5000;
const VIDEO_ROTATION_MS = 12000;

function getEmbeddableVideoUrl(url: string, options?: { autoplay?: boolean }): string {
  try {
    const parsed = new URL(url);
    const youtubeVideoId = getYouTubeVideoId(parsed);
    if (youtubeVideoId) {
      const params = new URLSearchParams({
        rel: "0",
        modestbranding: "1",
        playsinline: "1",
        iv_load_policy: "3",
      });
      if (options?.autoplay) {
        params.set("autoplay", "1");
        params.set("mute", "1");
      }
      return `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?${params.toString()}`;
    }
  } catch {
    return url;
  }
  return url;
}

function getYouTubeVideoId(url: URL): string {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtube.com" || host === "m.youtube.com") {
    return url.searchParams.get("v") || "";
  }
  if (host === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] || "";
  }
  return "";
}

function getVideoThumbnailUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const youtubeVideoId = getYouTubeVideoId(parsed);
    return youtubeVideoId
      ? `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`
      : "";
  } catch {
    return "";
  }
}

export default function PropertyMediaShowcase({
  images,
  media = [],
  className,
  statusLabel = "For Sale",
  tourUrl = null,
  videoUrl = null,
  latitude = null,
  longitude = null,
  city,
  stateOrProvince,
  listingKey,
}: PropertyMediaShowcaseProps) {
  const [activeView, setActiveView] = React.useState<MediaView>("image");
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const [progressKey, setProgressKey] = React.useState(0);
  const [hasInteractedWithCarousel, setHasInteractedWithCarousel] =
    React.useState(false);

  const normalizedImages = React.useMemo(
    () => images.map((src) => String(src || "").trim()).filter(Boolean),
    [images],
  );

  const categorized = React.useMemo(() => {
    const bucket = new Map<string, string[]>();
    for (const item of media) {
      const url = String(item?.media_url || "").trim();
      if (!url) continue;
      const category = String(item?.media_category || "Photos").trim() || "Photos";
      if (!bucket.has(category)) bucket.set(category, []);
      bucket.get(category)!.push(url);
    }
    return Array.from(bucket.entries());
  }, [media]);

  const effectiveImages = React.useMemo(() => {
    if (!activeCategory) return normalizedImages;
    const categoryImages = categorized.find(([name]) => name === activeCategory)?.[1] || [];
    return categoryImages.length > 0 ? categoryImages : normalizedImages;
  }, [activeCategory, categorized, normalizedImages]);

  React.useEffect(() => {
    if (selectedImageIndex < effectiveImages.length) return;
    setSelectedImageIndex(Math.max(0, effectiveImages.length - 1));
  }, [effectiveImages.length, selectedImageIndex]);

  const hasCoordinates =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180;

  const mapEmbedUrl = React.useMemo(() => {
    if (!hasCoordinates) return null;
    const lat = Number(latitude);
    const lng = Number(longitude);
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005},${lat - 0.005},${lng + 0.005},${lat + 0.005}&layer=mapnik&marker=${lat},${lng}`;
  }, [hasCoordinates, latitude, longitude]);

  const streetEmbedUrl = React.useMemo(() => {
    if (!hasCoordinates) return null;
    return `https://maps.google.com/maps?q=&layer=c&cbll=${latitude},${longitude}&cbp=12,0,0,0,0&output=svembed`;
  }, [hasCoordinates, latitude, longitude]);

  const googleMapsUrl = React.useMemo(() => {
    if (!hasCoordinates) return null;
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }, [hasCoordinates, latitude, longitude]);

  const streetViewUrl = React.useMemo(() => {
    if (!hasCoordinates) return null;
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;
  }, [hasCoordinates, latitude, longitude]);

  const mapSearchUrl = React.useMemo(() => {
    if (!hasCoordinates) return null;
    const idParam = listingKey ? `&id=${encodeURIComponent(listingKey)}` : "";
    return `/map-search?lat=${latitude}&lng=${longitude}&zoom=15${idParam}`;
  }, [hasCoordinates, latitude, longitude, listingKey]);

  const selectedImage = effectiveImages[selectedImageIndex] || effectiveImages[0] || "";
  const locationFallback = [city, stateOrProvince].filter(Boolean).join(", ");
  const normalizedVideoUrl = String(videoUrl || "").trim();
  const isVideoActive = activeView === "video";
  const embeddableVideoUrl = normalizedVideoUrl
    ? getEmbeddableVideoUrl(normalizedVideoUrl, { autoplay: isVideoActive })
    : "";
  const videoThumbnailUrl = normalizedVideoUrl
    ? getVideoThumbnailUrl(normalizedVideoUrl)
    : "";
  const viewOptions = React.useMemo(
    () =>
      normalizedVideoUrl
        ? VIEW_OPTIONS
        : VIEW_OPTIONS.filter((view) => view.key !== "video"),
    [normalizedVideoUrl],
  );
  const carouselItems = React.useMemo(
    () => [
      ...(normalizedVideoUrl ? [{ type: "video" as const, index: -1 }] : []),
      ...effectiveImages.map((_, index) => ({ type: "image" as const, index })),
    ],
    [effectiveImages, normalizedVideoUrl],
  );

  React.useEffect(() => {
    if (hasInteractedWithCarousel) return;
    if (carouselItems.length <= 1 || modalOpen) return;
    if (activeView !== "image" && activeView !== "video") return;
    const currentItem = carouselItems[carouselIndex] || carouselItems[0];
    const delay =
      currentItem?.type === "video" ? VIDEO_ROTATION_MS : IMAGE_ROTATION_MS;
    const timer = window.setTimeout(() => {
      const nextIndex = (carouselIndex + 1) % carouselItems.length;
      const nextItem = carouselItems[nextIndex];
      if (nextItem?.type === "video") {
        setActiveView("video");
      } else if (nextItem) {
        setActiveView("image");
        setSelectedImageIndex(nextItem.index);
      }
      setCarouselIndex(nextIndex);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [
    activeView,
    carouselIndex,
    carouselItems,
    hasInteractedWithCarousel,
    modalOpen,
  ]);

  React.useEffect(() => {
    setProgressKey((prev) => prev + 1);
  }, [activeView, carouselIndex, selectedImageIndex]);

  const currentCarouselItem = carouselItems[carouselIndex] || carouselItems[0];
  const currentRotationMs =
    currentCarouselItem?.type === "video" ? VIDEO_ROTATION_MS : IMAGE_ROTATION_MS;
  const showProgress =
    carouselItems.length > 1 &&
    !modalOpen &&
    !hasInteractedWithCarousel &&
    (activeView === "image" || activeView === "video");

  const renderUnavailable = (title: string, body: string) => (
    <div className="h-full w-full flex items-center justify-center bg-ds-card/50">
      <div className="text-center px-6">
        <MapIcon className="mx-auto h-8 w-8 text-ds-body/40" />
        <p className="mt-3 text-sm font-semibold text-ds-heading">{title}</p>
        <p className="mt-1 text-xs text-ds-body">{body}</p>
      </div>
    </div>
  );

  return (
    <section className={cn("rounded-2xl border border-ds-card-border bg-white p-4 sm:p-5 shadow-sm", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {categorized.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {categorized.map(([name]) => (
              <button
                key={name}
                type="button"
                onClick={() => setActiveCategory((prev) => (prev === name ? null : name))}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  activeCategory === name
                    ? "border-ds-primary bg-ds-primary/5 text-ds-primary"
                    : "border-ds-card-border text-ds-body hover:bg-ds-card/60",
                )}
              >
                {name}
              </button>
            ))}
          </div>
        ) : (
          <div />
        )}

        {tourUrl ? (
          <a
            href={tourUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-ds-card-border px-3 py-1 text-xs font-semibold text-ds-primary hover:bg-ds-primary/5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Virtual Tour
          </a>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-ds-card-border bg-ds-card/40">
        <div className="absolute right-3 top-3 z-20 inline-flex rounded-xl border border-white/20 bg-slate-900/75 p-1 backdrop-blur-md">
          {viewOptions.map((view) => {
            const Icon = view.icon;
            const isActive = activeView === view.key;
            return (
              <button
                key={view.key}
                type="button"
                onClick={() => {
                  setHasInteractedWithCarousel(true);
                  setActiveView(view.key);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                  isActive
                    ? "bg-sky-500 text-white"
                    : "text-white/85 hover:bg-white/15 hover:text-white",
                )}
                aria-label={`Show ${view.label}`}
                title={view.label}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{view.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative h-[min(560px,62vh)] w-full">
          {showProgress ? (
            <div className="absolute inset-x-0 top-0 z-10 h-1 bg-black/20">
              <div
                key={progressKey}
                className="h-full bg-sky-500"
                style={{
                  animation: `media-showcase-progress ${currentRotationMs}ms linear forwards`,
                }}
              />
            </div>
          ) : null}
          {activeView === "image" ? (
            selectedImage ? (
              <button
                type="button"
                onClick={() => {
                  setHasInteractedWithCarousel(true);
                  setModalOpen(true);
                }}
                className="h-full w-full cursor-zoom-in"
                aria-label="Open full gallery"
              >
                <img
                  src={selectedImage}
                  alt="Property"
                  className="h-full w-full object-cover"
                />
                <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors hover:bg-black/5" />
                <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ds-heading shadow-sm">
                  {statusLabel}
                </span>
              </button>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-ds-card/50">
                <div className="text-center text-ds-body/70">
                  <HomeIcon className="mx-auto h-10 w-10" />
                  <p className="mt-2 text-sm font-medium">No images available</p>
                </div>
              </div>
            )
          ) : activeView === "video" ? (
            embeddableVideoUrl ? (
              <div
                className="h-full w-full"
                onPointerDownCapture={() => setHasInteractedWithCarousel(true)}
              >
                <iframe
                  title="Property video"
                  src={embeddableVideoUrl}
                  className="h-full w-full border-0 bg-black"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : (
              renderUnavailable(
                "Video unavailable",
                "No video URL has been added for this listing.",
              )
            )
          ) : activeView === "map" ? (
            mapEmbedUrl ? (
              <iframe
                title="Property location map"
                src={mapEmbedUrl}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              renderUnavailable(
                "Map unavailable",
                locationFallback || "Location coordinates are missing for this listing.",
              )
            )
          ) : streetEmbedUrl ? (
            <iframe
              title="Property street view"
              src={streetEmbedUrl}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            renderUnavailable(
              "Street View unavailable",
              locationFallback || "Street-level coordinates are not available yet.",
            )
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes media-showcase-progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>

      {(effectiveImages.length > 1 || normalizedVideoUrl) && (
        <div className="mt-3 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            {normalizedVideoUrl ? (
              <button
                type="button"
                onClick={() => {
                  setHasInteractedWithCarousel(true);
                  setActiveView("video");
                  setCarouselIndex(
                    Math.max(
                      0,
                      carouselItems.findIndex((item) => item.type === "video"),
                    ),
                  );
                }}
                className={cn(
                  "relative h-16 w-24 overflow-hidden rounded-lg border bg-slate-900 transition",
                  activeView === "video"
                    ? "border-ds-primary ring-2 ring-ds-primary/25"
                    : "border-ds-card-border hover:border-ds-primary/50",
                )}
                aria-label="Show property video"
              >
                {videoThumbnailUrl ? (
                  <img
                    src={videoThumbnailUrl}
                    alt="Property video thumbnail"
                    className="h-full w-full object-cover opacity-80"
                  />
                ) : null}
                <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <PlayCircle className="h-7 w-7 text-white drop-shadow" />
                </span>
              </button>
            ) : null}
            {effectiveImages.map((src, idx) => (
              <button
                key={`${src}-${idx}`}
                type="button"
                onClick={() => {
                  setHasInteractedWithCarousel(true);
                  setActiveView("image");
                  setSelectedImageIndex(idx);
                  setCarouselIndex(
                    Math.max(
                      0,
                      carouselItems.findIndex(
                        (item) => item.type === "image" && item.index === idx,
                      ),
                    ),
                  );
                }}
                className={cn(
                  "relative h-16 w-24 overflow-hidden rounded-lg border transition",
                  activeView === "image" && idx === selectedImageIndex
                    ? "border-ds-primary ring-2 ring-ds-primary/25"
                    : "border-ds-card-border hover:border-ds-primary/50",
                )}
                aria-label={`Show image ${idx + 1}`}
              >
                <img src={src} alt={`Property thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {hasCoordinates && (googleMapsUrl || streetViewUrl || mapSearchUrl) ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {googleMapsUrl ? (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ds-card-border bg-white px-3 py-1.5 text-xs font-semibold text-ds-body hover:bg-ds-card"
            >
              <MapIcon className="h-3.5 w-3.5 text-ds-primary" />
              Google Maps
            </a>
          ) : null}
          {streetViewUrl ? (
            <a
              href={streetViewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ds-card-border bg-white px-3 py-1.5 text-xs font-semibold text-ds-body hover:bg-ds-card"
            >
              <Navigation className="h-3.5 w-3.5 text-ds-primary" />
              Open Street View
            </a>
          ) : null}
          {mapSearchUrl ? (
            <Link
              href={mapSearchUrl}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ds-card-border bg-white px-3 py-1.5 text-xs font-semibold text-ds-body hover:bg-ds-card"
            >
              <ExternalLink className="h-3.5 w-3.5 text-ds-primary" />
              Explore Area
            </Link>
          ) : null}
        </div>
      ) : null}

      <FullGalleryModal
        images={effectiveImages}
        startIndex={selectedImageIndex}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
