// components/PopularCities.js
import React from 'react';

const PopularCities = () => {
  const categories = [
    {
      categoryName: 'Homes for Sale in Popular Cities',
      provinces: [
        {
          name: 'Ontario',
          cities: [
            'Toronto', 'Mississauga', 'North York', 'Brampton', 'Scarborough',
            'Vaughan', 'Etobicoke', 'Oakville', 'Markham', 'London'
          ]
        },
        {
          name: 'British Columbia',
          cities: [
            'Vancouver', 'Surrey', 'Burnaby', 'Kelowna', 'Richmond', 'Langley',
            'Coquitlam', 'North Vancouver', 'Abbotsford', 'Chilliwack'
          ]
        },
        {
          name: 'Alberta',
          cities: [
            'Calgary', 'Edmonton', 'Airdrie', 'Red Deer', 'Lethbridge',
            'Grande Prairie', 'St. Albert', 'Fort McMurray', 'Sherwood Park', 'Cochrane'
          ]
        }
      ]
    },
    {
      categoryName: 'Sold Homes in Popular Cities',
      provinces: [
        {
          name: 'Ontario',
          cities: [
            'Toronto', 'Mississauga', 'North York', 'Brampton', 'Scarborough',
            'Vaughan', 'Etobicoke', 'Oakville', 'Markham', 'London'
          ]
        },
        {
          name: 'British Columbia',
          cities: [
            'Vancouver', 'Surrey', 'Burnaby', 'Kelowna', 'Richmond', 'Langley',
            'Coquitlam', 'North Vancouver', 'Abbotsford', 'Chilliwack'
          ]
        },
        {
          name: 'Alberta',
          cities: [
            'Calgary', 'Edmonton', 'Airdrie', 'Red Deer', 'Lethbridge',
            'Grande Prairie', 'St. Albert', 'Fort McMurray', 'Sherwood Park', 'Cochrane'
          ]
        }
      ]
    }
  ];

  return (
    <div className="popular-cities-container">
      {categories.map((category, index) => (
        <div key={index} className="category-section">
          <h2 className="category-title">{category.categoryName}</h2>
          <div className="provinces-container">
            {category.provinces.map((province, index) => (
              <div key={index} className="province">
                <h3>{province.name}</h3>
                <ul>
                  {province.cities.map((city, index) => (
                    <li key={index}>
                      {category.categoryName.includes('Homes for Sale') ? `Homes for Sale in ${city}` : `Sold Homes in ${city}`}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PopularCities;
