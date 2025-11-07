// src/data/listingDetails.ts
import type { ListingItem } from './listings';

export interface PropertyDetail {
  label: string;
  value: string | number;
}

export interface ListingHistoryItem {
  dateStart: string;
  dateEnd: string;
  price: string;
  event: string;
  listingId: string;
}

export interface ListingDetailsData {
  id: string;
  title: string;
  address: string;
  neighborhood: string;
  city: string;
  province: string;
  propertyType: string;
  estimatedValue: string;
  estimatedRent: string;
  listedPrice: string;
  listedDate: string;
  bedrooms: number;
  bathrooms: number;
  garage: number;
  mainImage: string;
  thumbnails: (string | null)[];
  description: string;
  details: PropertyDetail[];
  listingHistory: ListingHistoryItem[];
  priceChanges?: number;
  mapLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  nearbyListings: Array<{
    id: string;
    image: string;
    price: string;
    bedrooms: number;
    bathrooms: number;
    sqft: string;
    address: string;
  }>;
  ownershipCosts: {
    totalCost: number;
    costs: Array<{
      name: string;
      value: number;
      color: string;
    }>;
  };
  priceTrends: Array<{
    month: string;
    communityAverage: number;
    listingPrice: number;
  }>;
  salesDistribution: Array<{
    type: string;
    sales: number;
  }>;
  priceDistribution: Array<{
    range: string;
    count: number;
  }>;
  incomeDistribution: Array<{
    range: string;
    value: number;
    color: string;
  }>;
  demographics: {
    population: number;
    medianAge: number;
    averageHouseholdSize: number;
    averageHouseholdIncome: string;
    educationLevel: string;
    employmentRate: string;
    languageSpoken: string;
  };
}

// Sample detailed data for each listing category
const generateListingDetails = (id: string, title: string, image: string): ListingDetailsData => {
  // Generate variations based on listing type
  const baseAddresses: Record<string, string> = {
    'new-listings': '500 Bank St',
    'price-reduced': '450 Laurier Ave',
    'open-houses': '300 Elgin St',
    'recently-sold': '200 Rideau St',
    'new-construction': '150 Sparks St',
    'land': '100 Wellington St',
    'foreclosures': '250 Slater St',
    'condos': '350 Metcalfe St',
  };

  const basePrices: Record<string, { value: string; rent: string }> = {
    'new-listings': { value: '$450,000', rent: '$2,200' },
    'price-reduced': { value: '$425,000', rent: '$2,100' },
    'open-houses': { value: '$475,000', rent: '$2,300' },
    'recently-sold': { value: '$440,000', rent: '$2,150' },
    'new-construction': { value: '$500,000', rent: '$2,400' },
    'land': { value: '$350,000', rent: '$1,800' },
    'foreclosures': { value: '$380,000', rent: '$1,900' },
    'condos': { value: '$460,000', rent: '$2,250' },
  };

  const address = baseAddresses[id] || '500 Bank St';
  const prices = basePrices[id] || { value: '$450,000', rent: '$2,200' };
  const listedPrice = prices.value.replace('$', '').replace(',', '');
  const listedPriceFormatted = prices.value;

  return {
    id,
    title,
    address,
    neighborhood: 'Ottawa - Centretown',
    city: 'Ottawa',
    province: 'ON',
    propertyType: 'Condo Apt',
    estimatedValue: prices.value,
    estimatedRent: prices.rent,
    listedPrice: listedPriceFormatted,
    listedDate: 'Feb 2024',
    bedrooms: 2,
    bathrooms: 2,
    garage: 1,
    mainImage: image,
    thumbnails: [
      '/images/2.jpg',
      '/images/3.jpg',
      null,
      null,
    ] as (string | null)[],
    description: `Welcome to this stunning property in ${title}. This modern property features excellent amenities and is located in the heart of Ottawa's Centretown. Perfect for urban professionals or first-time buyers.

The property boasts beautiful features and modern amenities. Located just steps away from downtown Ottawa, you'll have easy access to shopping, dining, entertainment, and public transportation.

This is an excellent opportunity to own a piece of Ottawa's vibrant downtown core. The property is move-in ready and available for immediate possession.`,
    listingHistory: [
      {
        dateStart: '2024-02-09',
        dateEnd: '',
        price: listedPriceFormatted,
        event: 'For Sale',
        listingId: 'HSE03269',
      },
      {
        dateStart: '',
        dateEnd: '',
        price: '$900,000',
        event: 'Sold by Builder',
        listingId: '',
      },
    ],
    priceChanges: 0,
    details: [
      { label: 'Property Type', value: 'Condo Apartment' },
      { label: 'Bedrooms', value: '1' },
      { label: 'Bathrooms', value: '1' },
      { label: 'Size', value: '500-599 sqft' },
      { label: 'Parking Type', value: 'Underground' },
      { label: 'Parking Spaces', value: '1' },
      { label: 'Property Tax', value: '$2,000 - $2,499' },
      { label: 'Maintenance Fee', value: '$300 - $399' },
      { label: 'Locker', value: 'Yes' },
      { label: 'Exposure', value: 'East' },
      { label: 'Unit #', value: '1' },
      { label: 'Building Style', value: 'Apartment' },
      { label: 'Year Built', value: '2023' },
      { label: 'Stories', value: '6' },
      { label: 'Property Features', value: 'Balcony, Ensuite Laundry' },
      { label: 'Heating', value: 'Forced Air' },
      { label: 'Cooling', value: 'Central Air' },
      { label: 'Basement', value: 'None' },
      { label: 'Possession Date', value: 'Immediate' },
      { label: 'Status', value: 'Active' },
      { label: 'MLS #', value: '12345678' },
    ],
    mapLocation: {
      latitude: 45.4215,
      longitude: -75.6972,
      address: `${address}, Ottawa, ON`,
    },
    nearbyListings: [
      {
        id: '1',
        image: '/images/4.jpg',
        price: '$425,000',
        bedrooms: 1,
        bathrooms: 1,
        sqft: '450-499',
        address: '450 Bank St, Ottawa',
      },
      {
        id: '2',
        image: '/images/5.jpg',
        price: '$475,000',
        bedrooms: 1,
        bathrooms: 1,
        sqft: '550-599',
        address: '550 Bank St, Ottawa',
      },
    ],
    ownershipCosts: {
      totalCost: 1573,
      costs: [
        { name: 'Mortgage Payment', value: 1200, color: '#14b8a6' },
        { name: 'Property Tax', value: 200, color: '#06b6d4' },
        { name: 'Maintenance Fee', value: 350, color: '#3b82f6' },
        { name: 'Other', value: 123, color: '#8b5cf6' },
      ],
    },
    priceTrends: [
      { month: 'Apr', communityAverage: 420000, listingPrice: 430000 },
      { month: 'May', communityAverage: 435000, listingPrice: 440000 },
      { month: 'Jun', communityAverage: 440000, listingPrice: 450000 },
      { month: 'Jul', communityAverage: 445000, listingPrice: 450000 },
      { month: 'Aug', communityAverage: 450000, listingPrice: 450000 },
    ],
    salesDistribution: [
      { type: 'Condo', sales: 45 },
      { type: 'Townhouse', sales: 20 },
      { type: 'Detached', sales: 15 },
      { type: 'Semi-Detached', sales: 10 },
    ],
    priceDistribution: [
      { range: '$300K-$400K', count: 25 },
      { range: '$400K-$500K', count: 35 },
      { range: '$500K-$600K', count: 20 },
      { range: '$600K+', count: 10 },
    ],
    incomeDistribution: [
      { range: '<$20K', value: 0.05, color: '#14b8a6' },
      { range: '$20K-$39K', value: 0.10, color: '#06b6d4' },
      { range: '$40K-$59K', value: 0.15, color: '#3b82f6' },
      { range: '$60K-$79K', value: 0.20, color: '#8b5cf6' },
      { range: '$80K-$99K', value: 0.25, color: '#ec4899' },
      { range: '$100K+', value: 0.25, color: '#f59e0b' },
    ],
    demographics: {
      population: 125000,
      medianAge: 38,
      averageHouseholdSize: 2.1,
      averageHouseholdIncome: '$75,000',
      educationLevel: "Bachelor's Degree",
      employmentRate: '85%',
      languageSpoken: 'English, French',
    },
  };
};

// Create a map of all listing details
export const LISTING_DETAILS: Record<string, ListingDetailsData> = {
  'new-listings': generateListingDetails('new-listings', 'New Listings', '/images/1.jpg'),
  'price-reduced': generateListingDetails('price-reduced', 'Price Reduced', '/images/2.jpg'),
  'open-houses': generateListingDetails('open-houses', 'Open Houses', '/images/3.jpg'),
  'recently-sold': generateListingDetails('recently-sold', 'Recently Sold', '/images/4.jpg'),
  'new-construction': generateListingDetails('new-construction', 'New Construction', '/images/5.jpg'),
  'land': generateListingDetails('land', 'Land', '/images/6.jpg'),
  'foreclosures': generateListingDetails('foreclosures', 'Foreclosures', '/images/7.jpg'),
  'condos': generateListingDetails('condos', 'Condos', '/images/8.jpg'),
};

// Helper function to get listing details by ID
export function getListingDetails(id: string): ListingDetailsData | undefined {
  return LISTING_DETAILS[id];
}

