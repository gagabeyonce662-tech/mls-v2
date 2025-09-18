// components/PropertyListings.js
import React from 'react';

const PropertyListings = () => {
  const properties = [
    {
      id: 1,
      label: 'Exclusive Assignment',
      price: '$675,000',
      date: '2025-04-08',
      location: '105 Commerce St, Vaughan - Vaughan Corporate',
      type: 'Condo Apt',
      rentalYield: null,
      bedrooms: 1,
      bathrooms: 1,
    },
    {
      id: 2,
      label: 'Exclusive Assignment',
      price: '$599,000',
      date: '2025-01-08',
      location: '628 Church St, Toronto - Church-Yonge Corridor',
      type: 'Condo Apt',
      rentalYield: null,
      bedrooms: 1,
      bathrooms: 1,
    },
    {
      id: 3,
      label: 'Exclusive Assignment',
      price: '$1,250,000',
      date: '2025-01-17',
      location: '1521 19th Ave, Richmond Hill - Rural Richmond Hill',
      type: 'Freehold Townhouse',
      rentalYield: null,
      bedrooms: 3,
      bathrooms: 2,
    },
    {
      id: 4,
      label: 'Rental Yield: 8.7%',
      price: '$299,900',
      date: '1 day ago',
      location: '147 Kensington Avenue N, Hamilton - Crown Point',
      type: 'Single Family Residence',
      rentalYield: 8.7,
      bedrooms: 3,
      bathrooms: 2,
    },
  ];

  return (
    <div>
      {['Category 1', 'Exclusive Precon Assignment', 'Exclusive Precon Assignment', 'Exclusive Precon Assignment'].map((category, index) => (
        <div key={index} className="property-listings-container">
          <h2 className="section-title">{category}</h2>
          <div className="property-grid">
            {properties.map((property) => (
              <div key={property.id} className="property-card">
                <img
                  src="/images/default-image.jpg" // Placeholder image
                  alt={property.location}
                  className="property-image"
                />
                <div className="property-details">
                  <span className="property-label">{property.label}</span>
                  <h3 className="property-price">{property.price}</h3>
                  <p className="property-date">Listed: {property.date}</p>
                  <p className="property-location">{property.location}</p>
                  <p className="property-type">{property.type}</p>
                  {property.rentalYield && (
                    <p className="property-rental-yield">Rental Yield: {property.rentalYield}%</p>
                  )}
                  <div className="property-bed-bath">
                    <span>{property.bedrooms} Beds</span> | <span>{property.bathrooms} Baths</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="see-more-button">See More</button>
        </div>
      ))}
    </div>
  );
};

export default PropertyListings;
