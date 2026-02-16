"use client";

import { Star } from "lucide-react";

export default function ClientReviews() {
  const reviews = [
    {
      id: 1,
      name: "Alex Jones",
      location: "New Jersey, USA",
      rating: 5,
      text: "I found my dream home! I'm thrilled with the service I received from this website. The search functionality was easy to use, and I was able to find exactly what I was looking for in just a few clicks.",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    {
      id: 2,
      name: "Emily Brown",
      location: "New Jersey, USA",
      rating: 5,
      text: "I found my dream home! I'm thrilled with the service I received from this website. The search functionality was easy to use, and I was able to find exactly what I was looking for in just a few clicks.",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    {
      id: 3,
      name: "John Smith",
      location: "New Jersey, USA",
      rating: 5,
      text: "I found my dream home! I'm thrilled with the service I received from this website. The search functionality was easy to use, and I was able to find exactly what I was looking for in just a few clicks.",
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
                <img
                  src={review.avatar}
                  alt={review.name}
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
