import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Star, ChevronRight, CheckCircle2 } from "lucide-react";
import { config } from "@/config";

export default function FeaturedListings() {
  const listings = config.listings || [];

  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold">Featured Listings</h2>
          <p className="text-muted-foreground">Hand-picked premium properties</p>
        </div>
        <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
          View All <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <Card key={listing.id} className="group hover:shadow-xl transition-all border overflow-hidden cursor-pointer">
            <div className="relative overflow-hidden">
              <div className="aspect-[4/3] w-full">
                <img
                  src={listing.image}
                  alt={listing.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              {listing.verified && (
                <Badge className="absolute top-3 left-3 bg-black text-white border-0 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </Badge>
              )}
              <Badge className="absolute top-3 right-3 bg-white text-foreground hover:bg-white border-0">
                {listing.possession}
              </Badge>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Star className="w-4 h-4" />
              </Button>
            </div>
            <CardHeader>
              <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">
                {listing.name}
              </CardTitle>
              <p className="text-2xl font-bold text-primary">{listing.price}</p>
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">{listing.location}</span>
              </div>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4" />
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{listing.configurations}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">by {listing.developer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
