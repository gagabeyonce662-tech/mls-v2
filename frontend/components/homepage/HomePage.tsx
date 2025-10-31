"use client";
import { useState } from 'react';
import { Search, TrendingUp, MapPin, Home, Building2, DollarSign, Users, ChevronRight, Star, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { label: 'Active Listings', value: '12,456', change: '+12%', icon: Home, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Avg. Price', value: '$1.2M', change: '+5.3%', icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Sales This Month', value: '3,842', change: '+8.1%', icon: TrendingUp, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { label: 'Active Users', value: '45K+', change: '+15%', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ];

  const featuredListings = [
    {
      id: 1,
      title: 'Modern Condo in Downtown Toronto',
      price: '$899,000',
      address: '123 King St W, Toronto, ON',
      beds: 2,
      baths: 2,
      sqft: '1,200',
      image: 'https://images.pexels.com/photos/1743231/pexels-photo-1743231.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'For Sale',
      type: 'Condo',
      featured: true,
    },
    {
      id: 2,
      title: 'Luxury Family Home in Yorkville',
      price: '$2,450,000',
      address: '456 Avenue Rd, Toronto, ON',
      beds: 4,
      baths: 3,
      sqft: '3,500',
      image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'For Sale',
      type: 'House',
      featured: true,
    },
    {
      id: 3,
      title: 'Waterfront Penthouse',
      price: '$3,200,000',
      address: '789 Queens Quay, Toronto, ON',
      beds: 3,
      baths: 3,
      sqft: '2,800',
      image: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
      status: 'New',
      type: 'Penthouse',
      featured: true,
    },
  ];

  const recentListings = [
    {
      id: 4,
      title: 'Charming Bungalow in North York',
      price: '$1,150,000',
      address: '234 Sheppard Ave, North York, ON',
      beds: 3,
      baths: 2,
      sqft: '1,800',
      image: 'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=800',
      daysOnMarket: 5,
    },
    {
      id: 5,
      title: 'Contemporary Townhouse',
      price: '$1,350,000',
      address: '567 Yonge St, Toronto, ON',
      beds: 3,
      baths: 2.5,
      sqft: '2,100',
      image: 'https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?auto=compress&cs=tinysrgb&w=800',
      daysOnMarket: 2,
    },
    {
      id: 6,
      title: 'Elegant Detached Home',
      price: '$1,890,000',
      address: '890 Bloor St W, Toronto, ON',
      beds: 4,
      baths: 3,
      sqft: '2,900',
      image: 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=800',
      daysOnMarket: 7,
    },
    {
      id: 7,
      title: 'Cozy Starter Home',
      price: '$749,000',
      address: '321 Danforth Ave, Toronto, ON',
      beds: 2,
      baths: 1,
      sqft: '1,100',
      image: 'https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?auto=compress&cs=tinysrgb&w=800',
      daysOnMarket: 3,
    },
  ];

  const popularNeighborhoods = [
    { name: 'Downtown Toronto', listings: 342, avgPrice: '$1.2M', image: 'https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Yorkville', listings: 89, avgPrice: '$2.1M', image: 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'North York', listings: 256, avgPrice: '$980K', image: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Etobicoke', listings: 178, avgPrice: '$850K', image: 'https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?auto=compress&cs=tinysrgb&w=400' },
  ];


  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <div className="relative bg-background">
        <div className="relative h-[600px] w-full overflow-hidden">
          <img
            src="https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Luxury Real Estate"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
                  Find Your Dream Home
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                  Search from thousands of listings in Toronto and the GTA
                </p>
              </div>

          <Card className="max-w-4xl mx-auto shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    placeholder="Enter address, neighborhood, or postal code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <Button size="lg" className="md:w-auto w-full">
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
                <Button size="lg" variant="outline" className="md:w-auto w-full">
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  Buy
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
                  Rent
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
                  Sold
                </Badge>
                <Separator orientation="vertical" className="h-6 mx-2" />
                <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
                  House
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
                  Condo
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
                  Townhouse
                </Badge>
              </div>
            </CardContent>
          </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold mb-1">{stat.value}</p>
                    <p className="text-xs text-green-600 font-medium">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Featured Listings</h2>
            <p className="text-muted-foreground">Hand-picked premium properties</p>
          </div>
          <Button variant="ghost" className="hidden md:flex">
            View All
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredListings.map((listing) => (
            <Card key={listing.id} className="group hover:shadow-xl transition-all border overflow-hidden cursor-pointer">
              <div className="relative h-56 overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-3 left-3 bg-primary">
                  {listing.status}
                </Badge>
                <Badge variant="secondary" className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm">
                  {listing.type}
                </Badge>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-3 right-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Star className="w-4 h-4" />
                </Button>
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">
                      {listing.title}
                    </CardTitle>
                    <p className="text-2xl font-bold text-primary">{listing.price}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {listing.address}
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{listing.beds} Beds</span>
                    <span className="font-medium">{listing.baths} Baths</span>
                    <span className="font-medium">{listing.sqft} sqft</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button variant="outline" className="w-full mt-6 md:hidden">
          View All Featured Listings
        </Button>
      </div>

      <div className="bg-muted/30 py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Popular Neighborhoods</h2>
            <p className="text-muted-foreground">Explore the most sought-after areas</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularNeighborhoods.map((neighborhood, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={neighborhood.image}
                    alt={neighborhood.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold text-lg">{neighborhood.name}</h3>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{neighborhood.listings} listings</span>
                    <span className="font-bold text-primary">{neighborhood.avgPrice}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Recent Listings</h2>
            <p className="text-muted-foreground">Just added to the market</p>
          </div>
          <Button variant="ghost" className="hidden md:flex">
            View All
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentListings.map((listing) => (
            <Card key={listing.id} className="group hover:shadow-lg transition-all border overflow-hidden cursor-pointer">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge variant="secondary" className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs">
                  {listing.daysOnMarket}d ago
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                  {listing.title}
                </h3>
                <p className="text-xl font-bold text-primary mb-2">{listing.price}</p>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                  {listing.address}
                </p>
                <Separator className="mb-3" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{listing.beds} Beds</span>
                  <span className="font-medium">{listing.baths} Baths</span>
                  <span className="font-medium">{listing.sqft} sqft</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Find Your Home?
              </h2>
              <p className="text-lg mb-6 text-primary-foreground/90">
                Get personalized recommendations and exclusive listings delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-white text-foreground flex-1"
                />
                <Button variant="secondary" size="lg">
                  Get Started
                </Button>
              </div>
              <p className="text-sm mt-3 text-primary-foreground/80">
                Join 45,000+ home seekers. Unsubscribe anytime.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-0">
                  <CardContent className="p-4">
                    <MapPin className="w-8 h-8 text-primary mb-2" />
                    <p className="font-semibold text-sm">12K+ Locations</p>
                  </CardContent>
                </Card>
                <Card className="border-0">
                  <CardContent className="p-4">
                    <Home className="w-8 h-8 text-green-600 mb-2" />
                    <p className="font-semibold text-sm">50K+ Properties</p>
                  </CardContent>
                </Card>
                <Card className="border-0">
                  <CardContent className="p-4">
                    <Building2 className="w-8 h-8 text-orange-600 mb-2" />
                    <p className="font-semibold text-sm">Top Agents</p>
                  </CardContent>
                </Card>
                <Card className="border-0">
                  <CardContent className="p-4">
                    <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="font-semibold text-sm">Market Data</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
