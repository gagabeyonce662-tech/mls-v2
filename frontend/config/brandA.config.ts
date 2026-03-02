// configs/brandA.config.ts
export const brandConfig = {
  name: "Brand A",
  logo: "/brands/brandA/logo.svg",
  favicon: "/brands/brandA/favicon.ico",
  primaryColor: "#3c291b",
  secondaryColor: "#FBBF24",
  apiBaseUrl: "https://api.brandA.com",
  popularNeighborhoods: [
    {
      name: "Downtown Toronto",
      listings: 342,
      avgPrice: "$1.2M",
      image:
        "https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      name: "Yorkville",
      listings: 89,
      avgPrice: "$2.1M",
      image:
        "https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      name: "North York",
      listings: 256,
      avgPrice: "$980K",
      image:
        "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      name: "Etobicoke",
      listings: 178,
      avgPrice: "$850K",
      image:
        "https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
  ],
  recentListings: [
    {
      id: 4,
      title: "Charming Bungalow in North York",
      price: "$1,150,000",
      address: "234 Sheppard Ave, North York, ON",
      beds: 3,
      baths: 2,
      sqft: "1,800",
      image:
        "https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=800",
      daysOnMarket: 5,
    },
    {
      id: 5,
      title: "Contemporary Townhouse",
      price: "$1,350,000",
      address: "567 Yonge St, Toronto, ON",
      beds: 3,
      baths: 2.5,
      sqft: "2,100",
      image:
        "https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?auto=compress&cs=tinysrgb&w=800",
      daysOnMarket: 2,
    },
    {
      id: 6,
      title: "Elegant Detached Home",
      price: "$1,890,000",
      address: "890 Bloor St W, Toronto, ON",
      beds: 4,
      baths: 3,
      sqft: "2,900",
      image:
        "https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=800",
      daysOnMarket: 7,
    },
    {
      id: 7,
      title: "Cozy Starter Home",
      price: "$749,000",
      address: "321 Danforth Ave, Toronto, ON",
      beds: 2,
      baths: 1,
      sqft: "1,100",
      image:
        "https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?auto=compress&cs=tinysrgb&w=800",
      daysOnMarket: 3,
    },
  ],
  listings: [
    {
      id: 1,
      name: "Modern Condo in Downtown Toronto",
      developer: "Skyline Builders",
      location: "123 King St W, Toronto, ON",
      configurations: "2 Beds • 2 Baths • 1,200 sq.ft",
      possession: "Ready to Move",
      price: "$899,000",
      verified: true,
      image:
        "https://images.pexels.com/photos/1743231/pexels-photo-1743231.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: 2,
      name: "Luxury Family Home in Yorkville",
      developer: "Elite Estates",
      location: "456 Avenue Rd, Toronto, ON",
      configurations: "4 Beds • 3 Baths • 3,500 sq.ft",
      possession: "Under Construction",
      price: "$2,450,000",
      verified: true,
      image:
        "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: 3,
      name: "Waterfront Penthouse in Harbourfront",
      developer: "Harborview Properties",
      location: "789 Queens Quay, Toronto, ON",
      configurations: "3 Beds • 3 Baths • 2,800 sq.ft",
      possession: "Ready to Move",
      price: "$3,200,000",
      verified: true,
      image:
        "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: 4,
      name: "Elegant Townhouse in Etobicoke",
      developer: "UrbanLife Developers",
      location: "2500 Bloor St W, Toronto, ON",
      configurations: "3 Beds • 2 Baths • 1,900 sq.ft",
      possession: "Ready to Move",
      price: "$1,250,000",
      verified: true,
      image:
        "https://images.pexels.com/photos/208736/pexels-photo-208736.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: 5,
      name: "High-Rise Apartment at Midtown",
      developer: "SkyTower Group",
      location: "12 Eglinton Ave E, Toronto, ON",
      configurations: "2 Beds • 2 Baths • 1,050 sq.ft",
      possession: "Ready to Move",
      price: "$780,000",
      verified: true,
      image:
        "https://images.pexels.com/photos/259950/pexels-photo-259950.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: 6,
      name: "Luxury Villa in Bridle Path",
      developer: "Majestic Realty",
      location: "88 The Bridle Path, Toronto, ON",
      configurations: "5 Beds • 6 Baths • 6,500 sq.ft",
      possession: "Sold Out",
      price: "$6,800,000",
      verified: true,
      image:
        "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
  ],
};
