import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Star, ChevronRight } from "lucide-react";
import { config } from "@/config";

export default function FeaturedListings() {
  const listings = config.listings || [];

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold">Featured Listings</h2>
          <p className="text-muted-foreground">Hand-picked premium properties</p>
        </div>
        <Button variant="ghost">
          View All <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <Card key={listing.id} className="group hover:shadow-xl transition-all border overflow-hidden cursor-pointer">
            <div className="relative h-56 overflow-hidden">
              <img src={listing.image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <Badge className="absolute top-3 left-3 bg-primary">{listing.status}</Badge>
              <Badge variant="secondary" className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm">{listing.type}</Badge>
              <Button size="icon" variant="secondary" className="absolute bottom-3 right-3 rounded-full opacity-0 group-hover:opacity-100">
                <Star className="w-4 h-4" />
              </Button>
            </div>
            <CardHeader>
              <CardTitle className="text-xl mb-1 group-hover:text-primary">{listing.title}</CardTitle>
              <p className="text-2xl font-bold text-primary">{listing.price}</p>
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <MapPin className="w-4 h-4 mr-1" /> {listing.address}
              </div>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4" />
              <div className="flex gap-4 text-sm">
                <span>{listing.beds} Beds</span>
                <span>{listing.baths} Baths</span>
                <span>{listing.sqft} sqft</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
