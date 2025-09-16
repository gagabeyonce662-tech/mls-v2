'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const cities = [
  'Ajax', 'Barrie', 'Binbrook', 'Bolton', 'Bradford', 'Brampton', 'Brantford',
  'Burlington', 'Caledon', 'Caledonia', 'Cambridge', 'Courtice', 'Erin',
  'Georgetown', 'Hamilton', 'Innisfil', 'Kitchener', 'Markham', 'Milton',
  'Mississauga', 'Oakville', 'Oshawa', 'Ottawa', 'Paris', 'Pickering',
  'Scarborough', 'Stoney Creek', 'Stouffville', 'Stratford', 'Thorold',
  'Vaughan', 'Waterdown', 'Welland', 'Whitby', 'Woodstock'
];

const priceRanges = [
  '$5,000', '$10,000', '$50,000', '$100,000', '$200,000', '$300,000',
  '$400,000', '$500,000', '$600,000', '$700,000', '$800,000', '$900,000',
  '$1,000,000', '$1,500,000', '$2,000,000', '$2,500,000', '$5,000,000', '$10,000,000'
];

const occupancyYears = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

export default function PropertySearch() {
  const [searchData, setSearchData] = useState({
    city: '',
    bedrooms: '',
    bathrooms: '',
    maxPrice: '',
    occupancy: []
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search data:', searchData);
    // Handle search logic here
  };

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-12">
          FIND YOUR PERFECT PROPERTY
        </h2>

        <form onSubmit={handleSearch} className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* Cities */}
            <div className="lg:col-span-1">
              <Select value={searchData.city} onValueChange={(value) => setSearchData({...searchData, city: value})}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-cities">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city.toLowerCase()}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bedrooms */}
            <div>
              <Select value={searchData.bedrooms} onValueChange={(value) => setSearchData({...searchData, bedrooms: value})}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any-bedrooms">Bedrooms</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bathrooms */}
            <div>
              <Select value={searchData.bathrooms} onValueChange={(value) => setSearchData({...searchData, bathrooms: value})}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Bathrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any-bathrooms">Bathrooms</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Max Price */}
            <div>
              <Select value={searchData.maxPrice} onValueChange={(value) => setSearchData({...searchData, maxPrice: value})}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Max. Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any-price">Max. Price</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                  {priceRanges.map((price) => (
                    <SelectItem key={price} value={price}>
                      {price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Occupancy */}
            <div>
              <Select>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Occupancy" />
                </SelectTrigger>
                <SelectContent>
                  {occupancyYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-center">
            <Button 
              type="submit" 
              className="bg-orange-600 hover:bg-orange-700 text-white px-12 py-3 text-lg font-medium"
            >
              Search
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}