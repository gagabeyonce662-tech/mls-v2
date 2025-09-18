// components/HeroSection.js
import React from 'react';

const HeroSection = () => {
  return (
    <div className="hero-container">
      <div className="hero-overlay">
        <div className="hero-content">
          <h1 className="hero-title">
            The #1 site real estate professionals trust
          </h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Address, School, City, Zip or Neighborhood"
              className="search-input"
            />
            <button className="search-button">Search</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
