"use client";

import Link from "next/link";
import Image from "next/image";

import { colors } from "@/config/design-system";

export default function FeaturedCollections() {
  const collections = [
    {
      id: 1,
      title: "Selling Your Home",
      href: "/valuation",
      image:
        "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&q=80",
    },
    {
      id: 2,
      title: "Pre-Construction",
      href: "/Precon",
      image:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
    },
    {
      id: 3,
      title: "Buyers Guide",
      href: "/blog",
      image:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80",
    },
    {
      id: 4,
      title: "View Properties",
      href: "/listing",
      image:
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80",
    },
  ];

  return (
    <div className="py-4 w-full overflow-hidden">
      <div className="w-full px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={collection.href}
              className="group relative h-40 rounded-xl overflow-hidden shadow-lg cursor-pointer transform transition-transform hover:scale-105"
            >
              <Image
                src={collection.image}
                alt={collection.title}
                width={400}
                height={320}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex items-end p-6">
                <h3 className="text-white text-base font-inter font-semibold">
                  {collection.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
