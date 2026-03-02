"use client";
import Image from "next/image";

export default function LocationsSection() {
  const locations = [
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

  const marqueeLocations = [...locations, ...locations];

  return (
    <div className="py-8 bg-white overflow-hidden">
      {" "}
      {/* was py-20 */}
      <div className="max-w-[1320px] mx-auto px-4 mb-4">
        {" "}
        {/* was mb-10 */}
        <h2 className="text-ds-h2 text-ds-heading font-inter text-[22px] mb-2">
          {" "}
          {/* tighter */}
          Our locations for you
        </h2>
      </div>
      <div className="relative overflow-hidden">
        <div className="flex gap-4 w-max marquee-track">
          {" "}
          {/* was gap-8 */}
          {marqueeLocations.map((location, i) => (
            <div
              key={`${location.id}-${i}`}
              className="relative h-72 w-64 rounded-xl overflow-hidden shadow-lg cursor-pointer group flex-shrink-0"
              /* was h-80 w-72 + very large card */
            >
              <Image
                src={location.image}
                alt={location.name}
                width={256}
                height={288}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex items-end justify-center p-4">
                <h3 className="text-white text-lg font-semibold tracking-wide">
                  {" "}
                  {/* more compact */}
                  {location.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .marquee-track {
          animation: marquee 25s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
