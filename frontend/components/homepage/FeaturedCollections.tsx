"use client";

import { colors } from "@/config/design-system";

export default function FeaturedCollections() {
  const collections = [
    {
      id: 1,
      title: "Selling Your Home",
      image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&q=80",
    },
    {
      id: 2,
      title: "Downsizing",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
    },
    {
      id: 3,
      title: "Buyers Guide Hub",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80",
    },
    {
      id: 4,
      title: "View Properties",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80",
    },
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="group relative h-64 rounded-xl overflow-hidden shadow-lg cursor-pointer transform transition-transform hover:scale-105"
            >
              <img
                src={collection.image}
                alt={collection.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex items-end p-6">
                <h3 className="text-white text-ds-h5 font-inter">{collection.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
