"use client";

export default function LocationsSection() {
  const locations = [
    {
      id: 1,
      name: "Sunport",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
    },
    {
      id: 2,
      name: "Alabama",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80",
    },
    {
      id: 3,
      name: "Oxford",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80",
    },
    {
      id: 4,
      name: "Houston",
      image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&q=80",
    },
    {
      id: 5,
      name: "Cambridge",
      image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&q=80",
    },
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-ds-h2 text-ds-heading font-inter">Our location for you</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {locations.map((location) => (
            <div
              key={location.id}
              className="relative h-48 rounded-xl overflow-hidden shadow-md cursor-pointer group"
            >
              <img
                src={location.image}
                alt={location.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-end justify-center p-4">
                <h3 className="text-white text-ds-h5-regular font-inter">{location.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
