"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="relative h-[600px] w-full ">
      <img
        src="https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1600"
        alt="Luxury Real Estate"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Find Your Dream Home
          </h1>
          <p className="text-lg md:text-xl mb-8">
            Search from thousands of listings in Toronto and the GTA
          </p>

          <Card className="max-w-4xl mx-auto shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
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
                {["Buy", "Rent", "Sold"].map((item) => (
                  <Badge key={item} variant="outline" className="cursor-pointer hover:bg-secondary">
                    {item}
                  </Badge>
                ))}
                <Separator orientation="vertical" className="h-6 mx-2" />
                {["House", "Condo", "Townhouse"].map((type) => (
                  <Badge key={type} variant="outline" className="cursor-pointer hover:bg-secondary">
                    {type}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
