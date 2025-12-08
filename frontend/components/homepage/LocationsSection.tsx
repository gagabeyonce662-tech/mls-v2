"use client";

export default function LocationsSection() {
  const locations = [
    { id: 1, name: "Toronto", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80" },
    { id: 2, name: "Brantford", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80" },
    { id: 3, name: "Kitchener", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80" },
    { id: 4, name: "Houston", image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80" },
    { id: 5, name: "OakVille", image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80" },
  ];

  // Duplicate array for seamless infinite loop
  const marqueeLocations = [...locations, ...locations];

  return (
    <div className="py-20 bg-white overflow-hidden">
      <div className="max-w-[1800px] mx-auto px-4 mb-10">
        <h2 className="text-ds-h2 text-ds-heading font-inter">
          Our locations for you
        </h2>
      </div>

      {/* ✅ MARQUEE CONTAINER */}
      <div className="relative overflow-hidden">
        <div className="flex gap-8 w-max marquee-track">
          {marqueeLocations.map((location, i) => (
            <div
              key={`${location.id}-${i}`}
              className="relative h-80 w-72 rounded-2xl overflow-hidden shadow-xl cursor-pointer group flex-shrink-0"
            >
              <img
                src={location.image}
                alt={location.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex items-end justify-center p-6">
                <h3 className="text-white text-xl font-semibold tracking-wide">
                  {location.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ MARQUEE ANIMATION */}
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
