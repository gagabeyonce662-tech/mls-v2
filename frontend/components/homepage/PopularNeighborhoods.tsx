"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { config } from "@/config";
// 

const neighborhoods = config.popularNeighborhoods || [
  { name: "Downtown", image: "/images/neighborhoods/downtown.jpg", listings: 124 },
  { name: "Uptown", image: "/images/neighborhoods/uptown.jpg", listings: 89 },
  { name: "Seaside", image: "/images/neighborhoods/seaside.jpg", listings: 56 },
];

export default function PopularNeighborhoods() {
  return (
    <section className="py-16 bg-white dark:bg-neutral-950">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-10 text-gray-900 dark:text-white">
          Popular Neighborhoods
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {neighborhoods.map((area, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.03 }}
              className="relative rounded-2xl overflow-hidden shadow-lg group"
            >
              <Image
                src={area.image}
                alt={area.name}
                width={500}
                height={300}
                className="object-cover w-full h-56 group-hover:scale-110 transition-transform"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"
              />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-semibold">{area.name}</h3>
                <p
                  className="text-sm"
                  style={{ color: config.primaryColor }}
                >
                  {area.listings} Listings
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
