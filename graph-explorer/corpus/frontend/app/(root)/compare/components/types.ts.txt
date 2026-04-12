export interface ComparisonProperty {
  id: string;
  image: string;
  price: string;
  address: string;
  municipality: string;
  province: string;
  postalCode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  totalRooms: number;
  yearBuilt: number | null;
  garage: string;
  airConditioning: string;
  basement: string;
  zoning: string;
  error?: string;
  rawData?: any;
}
