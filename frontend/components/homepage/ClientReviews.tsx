"use client";

import { Star } from "lucide-react";
import Image from "next/image";

export default function ClientReviews() {
  const reviews = [
    {
      id: 1,
      name: "Priya Sharma",
      location: "Toronto, ON",
      rating: 5,
      text: "We found the perfect condo in downtown Toronto within two weeks. The detailed neighbourhood data and instant alerts made all the difference — we saw the listing before anyone else.",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    {
      id: 2,
      name: "Emily Tremblay",
      location: "Ottawa, ON",
      rating: 5,
      text: "As first-time buyers, the mortgage calculator and market insights gave us the confidence to make an offer. The whole process felt transparent and stress-free.",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    {
      id: 3,
      name: "James Okafor",
      location: "Vancouver, BC",
      rating: 5,
      text: "I relocated from Alberta and used the map search to explore neighbourhoods remotely. By the time I visited in person, I already knew exactly where I wanted to live.",
      avatar: "https://i.pravatar.cc/150?img=33",
    },
  ];

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h6 className="text-ds-h2 text-ds-heading font-inter">
            Clients Reviews
          </h6>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl shadow-md p-6 space-y-4"
            >
              <div className="flex items-center gap-4">
                <Image
                  src={review.avatar}
                  alt={review.name}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-ds-text text-ds-heading font-inter">
                    {review.name}
                  </h3>
                  <p className="text-ds-small-regular text-ds-body font-inter">
                    {review.location}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                {[...Array(review.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-ds-body-regular text-ds-body leading-relaxed font-inter">
                {review.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
