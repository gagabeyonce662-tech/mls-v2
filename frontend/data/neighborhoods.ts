export type Neighborhood = {
  name: string;
  image: string;
};

// Kept separate from the section so the same city list can power future SEO pages.
export const neighborhoods: Neighborhood[] = [
  { name: "Brampton", image: "/images/1.jpg" },
  { name: "Brantford", image: "/images/2.jpg" },
  { name: "Thorold", image: "/images/3.jpg" },
  { name: "Hamilton", image: "/images/4.jpg" },
  { name: "Cambridge", image: "/images/5.jpg" },
];
