// src/data/listings.ts
export type ListingItem = {
  id: string;
  title: string;
  count: number;
  image: string; // public path or remote URL
};

export const LISTINGS: ListingItem[] = [
  { id: 'new-listings', title: 'New Listings', count: 196, image: '/images/1.jpg' },
  { id: 'price-reduced', title: 'Price Reduced', count: 303, image: '/images/2.jpg' },
  { id: 'open-houses', title: 'Open Houses', count: 27, image: '/images/3.jpg' },
  { id: 'recently-sold', title: 'Recently Sold', count: 1339, image: '/images/4.jpg' },
  { id: 'new-construction', title: 'New Construction', count: 161, image: '/images/5.jpg' },
  { id: 'land', title: 'Land', count: 54, image: '/images/6.jpg' },
  { id: 'foreclosures', title: 'Foreclosures', count: 49, image: '/images/7.jpg' },
  { id: 'condos', title: 'Condos', count: 2294, image: '/images/8.jpg' },
];

export default LISTINGS;
