// components/PropertySearch.js
import React, { useState } from 'react';

const PropertySearch = () => {
  const [city, setCity] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [price, setPrice] = useState('');
  const [occupancy, setOccupancy] = useState('');

  const handleSearch = () => {
    // Implement your search functionality here
    console.log({
      city,
      bedrooms,
      bathrooms,
      price,
      occupancy,
    });
  };

  return (
    <div className="property-search-container">
      <h2 className="search-title">Find Your Perfect Property</h2>
      <div className="search-fields">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="search-field"
        >
          <option value="">All Cities</option>
          <option value="city1">City 1</option>
          <option value="city2">City 2</option>
          <option value="city3">City 3</option>
        </select>
        
        <select
          value={bedrooms}
          onChange={(e) => setBedrooms(e.target.value)}
          className="search-field"
        >
          <option value="">Bedrooms</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>

        <select
          value={bathrooms}
          onChange={(e) => setBathrooms(e.target.value)}
          className="search-field"
        >
          <option value="">Bathrooms</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>

        <select
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="search-field"
        >
          <option value="">Max. Price</option>
          <option value="100000">100,000</option>
          <option value="200000">200,000</option>
          <option value="300000">300,000</option>
        </select>

        <select
          value={occupancy}
          onChange={(e) => setOccupancy(e.target.value)}
          className="search-field"
        >
          <option value="">Occupancy</option>
          <option value="single">Single</option>
          <option value="multiple">Multiple</option>
        </select>

        <button onClick={handleSearch} className="search-button">Search</button>
      </div>
    </div>
  );
};

export default PropertySearch;
