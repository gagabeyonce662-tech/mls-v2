"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { colors } from "@/config/design-system";
import type { HomepageCategory } from "@/lib/api/types";
import { trackHomepageCategoryEvent } from "@/lib/analytics/homepageCategories";

interface FeaturedCollectionsProps {
  categories?: HomepageCategory[];
}

export default function FeaturedCollections({ categories = [] }: FeaturedCollectionsProps) {
  const marketingCollections = [
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
  ];

  const categoryCollections = categories.slice(0, 2).map((item, index) => ({
    id: `cat-${item.key}`,
    title: item.label,
    href:
      item.query && Object.keys(item.query).length > 0
        ? `${item.route}?${new URLSearchParams(item.query).toString()}`
        : item.route,
    image:
      index % 2 === 0
        ? "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80"
        : "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=400&q=80",
    key: item.key,
  }));

  const collections = [...marketingCollections, ...categoryCollections].slice(0, 4);

  return (
    <div className="py-2 bg-white w-full overflow-hidden">
      <div className="w-full px-4 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {collections.map((collection) => (
            <div key={collection.id} className="w-full">
              <Link
                href={collection.href}
                onClick={() => {
                  if ("key" in collection) {
                    trackHomepageCategoryEvent("homepage_category_click", {
                      key: collection.key,
                      label: collection.title,
                      route: collection.href,
                    });
                  }
                }}
                className="group relative h-16 sm:h-20 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg cursor-pointer transform transition-all duration-500 ease-out hover:-translate-y-1 block ring-1 ring-black/5"
              >
                <Image
                  src={collection.image}
                  alt={collection.title}
                  width={400}
                  height={120}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                {/* Premium Brand-Colored Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0C1536]/95 via-[#0C1536]/70 to-black/30 group-hover:via-[#0C1536]/80 transition-colors duration-500 ease-out" />

                <div className="absolute inset-0 flex items-center justify-between px-6">
                  <h3 className="text-white text-sm sm:text-base font-inter font-semibold tracking-wide transition-transform duration-500 ease-out group-hover:translate-x-1">
                    {collection.title}
                  </h3>
                  <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/25 flex items-center justify-center transition-all duration-500 ease-out backdrop-blur-md border border-white/10 group-hover:border-white/40 shadow-sm">
                    <ArrowRight className="w-4 h-4 text-white transition-transform duration-500 ease-out" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
