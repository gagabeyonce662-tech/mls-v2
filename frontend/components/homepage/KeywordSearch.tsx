// components/KeywordSearch.js
import React, { useState } from 'react';

const KeywordSearch = () => {
  const keywords = [
    'Sold Prices', 'Houses for Sale', 'Condos for Sale', 'Townhouses for Sale', 
    'Home Appraisal', 'Find an Agent', 'Houses', '3-Bed Houses', '2-Bed Condos',
    'Houses Under $1 mil', 'Condos > $1,000,000', 'Most Expensive Houses', 
    'Luxury Condos', 'Cheapest Condos in Toronto', 'Cheapest Houses in Toronto', 
    'Downtown Toronto Condos', 'Condos for Rent', 'Houses for Rent'
  ];

  const [selectedKeyword, setSelectedKeyword] = useState(null);

  const handleKeywordClick = (keyword) => {
    setSelectedKeyword(keyword);
    // Here you can perform the search or filter functionality
    console.log(`Searching for: ${keyword}`);
  };

  return (
    <div className="keyword-search-container">
      <h2 className="search-title">Search by Keywords</h2>
      <div className="keyword-tags">
        {keywords.map((keyword, index) => (
          <button
            key={index}
            className={`keyword-tag ${selectedKeyword === keyword ? 'active' : ''}`}
            onClick={() => handleKeywordClick(keyword)}
          >
            {keyword}
          </button>
        ))}
      </div>
    </div>
  );
};

export default KeywordSearch;
