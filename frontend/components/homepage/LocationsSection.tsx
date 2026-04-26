"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useSearch } from "@/contexts/SearchContext";
import { Search } from "lucide-react";
import { openInNewTab } from "@/lib/navigation/openInNewTab";

interface Location {
  id: number;
  name: string;
  image: string;
}

const LOCATIONS: Location[] = [
  {
    id: 1,
    name: "Toronto",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
  },
  {
    id: 2,
    name: "Brantford",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
  },
  {
    id: 3,
    name: "Kitchener",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
  },
  {
    id: 4,
    name: "Mississauga",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80",
  },
  {
    id: 5,
    name: "Oakville",
    image:
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80",
  },
];

export default function LocationsSection() {
  const { setSearchQuery, clearSearch } = useSearch();
  const trackRef = useRef<HTMLDivElement>(null);

  // Drag state
  const isDragging = useRef(false);
  const wasDrag = useRef(false); // survives until after onClick fires
  const startX = useRef(0);

  const currentX = useRef(0); // accumulated drag offset
  const dragDelta = useRef(0); // delta during current drag
  const animStartRef = useRef<number | null>(null); // requestAnimationFrame id

  // CSS animation speed: pixels per second
  const SPEED = 60; // px/s  (matches 25s for ~1500px track)

  /**
   * We drive the marquee with rAF instead of a pure CSS keyframe so we can
   * seamlessly pause/resume at any position.
   */
  const positionRef = useRef(0); // current translateX (negative)
  const lastTimeRef = useRef<number | null>(null);
  const halfWidthRef = useRef(0); // half the track width (= one set of cards)
  const pausedRef = useRef(false);

  const animate = (time: number) => {
    if (!trackRef.current) return;

    if (lastTimeRef.current !== null && !pausedRef.current) {
      const dt = (time - lastTimeRef.current) / 1000; // seconds
      positionRef.current -= SPEED * dt;

      // Seamless loop: when we've scrolled one full "set", reset
      if (
        halfWidthRef.current > 0 &&
        positionRef.current <= -halfWidthRef.current
      ) {
        positionRef.current += halfWidthRef.current;
      }
    }

    lastTimeRef.current = time;
    trackRef.current.style.transform = `translateX(${positionRef.current + dragDelta.current}px)`;
    animStartRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const handleResize = () => {
      if (trackRef.current) {
        // Track contains locations duplicated x6, so one full set is 1/6th
        halfWidthRef.current = trackRef.current.scrollWidth / 6;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    animStartRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animStartRef.current !== null)
        cancelAnimationFrame(animStartRef.current);
    };
  }, []);

  // ─── Pointer (mouse + touch) drag handlers ────────────────────────────────

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    pausedRef.current = true;
    startX.current = e.clientX;
    dragDelta.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    dragDelta.current = e.clientX - startX.current;
  };

  const onPointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    // Record whether this gesture was a drag BEFORE resetting delta
    wasDrag.current = Math.abs(dragDelta.current) > 5;

    // Absorb drag delta into the base position
    positionRef.current += dragDelta.current;
    dragDelta.current = 0;

    // Clamp so the loop still works with multiple sets
    if (halfWidthRef.current > 0) {
      positionRef.current =
        ((positionRef.current % halfWidthRef.current) - halfWidthRef.current) %
        -halfWidthRef.current;
    }

    // Reset timing so there's no jump when animation resumes
    lastTimeRef.current = null;
    pausedRef.current = false;
  };

  const handleLocationClick = async (locationName: string) => {
    setSearchQuery(locationName);
    const target = `/listing?city=${encodeURIComponent(locationName)}`;
    openInNewTab(target);
  };

  const marqueeLocations = [
    ...LOCATIONS,
    ...LOCATIONS,
    ...LOCATIONS,
    ...LOCATIONS,
    ...LOCATIONS,
    ...LOCATIONS,
  ];

  return (
    <div className="py-8 bg-white overflow-hidden select-none">
      <div className="px-4 lg:px-6 mb-4">
        <h2 className="text-ds-h2 text-ds-heading font-inter text-[22px] mb-2">
          Our locations for you
        </h2>
      </div>

      {/* Drag-to-scroll track */}
      <div
        className="relative overflow-hidden cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div ref={trackRef} className="flex gap-4 w-max will-change-transform">
          {marqueeLocations.map((location, i) => (
            <div
              key={`${location.id}-${i}`}
              className="relative h-72 w-64 rounded-xl overflow-hidden shadow-lg group flex-shrink-0 cursor-pointer"
              // Direct click handler that respects drag state
              onClick={() => {
                if (!wasDrag.current) {
                  handleLocationClick(location.name);
                }
                wasDrag.current = false; // Reset for next interaction
              }}
              draggable={false}
            >
              <Image
                src={location.image}
                alt={location.name}
                width={256}
                height={288}
                draggable={false}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 pointer-events-none"
              />

              {/* Semi-transparent "Search" button on top right */}
              <div
                className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30 cursor-pointer pointer-events-auto shadow-xl"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent the card's own onClick from firing twice
                  handleLocationClick(location.name);
                }}
              >
                <Search className="w-4 h-4" />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <div className="absolute inset-0 flex items-end justify-center p-4">
                <h3 className="text-white text-lg font-semibold tracking-wide">
                  {location.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
