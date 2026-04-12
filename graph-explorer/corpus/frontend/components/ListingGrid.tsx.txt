// src/components/ListingGrid.tsx
import React from "react";
import Link from "next/link";
import { useListings } from "../hooks/useListings";

export const ListingGrid: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const listings = useListings();

  return (
    <div className={`max-w-7xl mx-auto px-6 py-8 ${className}`}>
      <h2 className="text-2xl text-center md:text-3xl font-bold mb-6">
        Browse homes in Miami Beach, FL
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {listings.map((item) => (
          <Link key={item.id} href={`/listing/${item.id}`} className="block">
            <article
              className="relative rounded-lg overflow-hidden shadow-md group h-48 md:h-56 focus:outline-none cursor-pointer"
              tabIndex={0}
              aria-label={`${item.title} — ${item.count.toLocaleString('en-US')}`}
              role="button"
            >
              {/* Background image */}
              <div
                className="absolute inset-0 bg-center bg-cover transform group-hover:scale-105 transition-transform duration-300"
                style={{ backgroundImage: `url(${item.image})` }}
                aria-hidden="true"
              />

              {/* dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

              {/* Title + Count */}
              <div className="absolute inset-0 p-5 flex items-start justify-between">
                <div>
                  <h3 className="text-white text-xl md:text-2xl font-extrabold tracking-tight drop-shadow">
                    {item.title}
                  </h3>
                </div>

                <div>
                  <span className="inline-block bg-white text-gray-800 text-sm font-semibold px-3 py-1 rounded-full shadow">
                    {item.count.toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              {/* Hidden accessible label */}
              <span className="sr-only">View {item.title}</span>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ListingGrid;
