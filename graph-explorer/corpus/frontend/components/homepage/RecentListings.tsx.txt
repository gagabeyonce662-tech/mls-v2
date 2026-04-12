"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { config } from "@/config";

const listings = config.recentListings;

export default function RecentListings() {
  return (
    <section className="py-16 bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-10 text-gray-900 dark:text-white">
          Recent Listings
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {listings.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-neutral-950 rounded-2xl shadow-md overflow-hidden"
            >
              <Image
                src={item.image}
                alt={item.title}
                width={500}
                height={300}
                className="object-cover w-full h-56"
              />
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {item.address}
                </p>
                <p
                  className="font-bold text-lg"
                  style={{ color: config.primaryColor }}
                >
                  {item.price}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
