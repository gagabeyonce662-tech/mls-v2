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
    <div className="relative h-[300px] w-full overflow-hidden">
      {/* Background Image with blur + dim + grayscale */}
      <img
        src="https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1600"
        alt="Luxury Real Estate"
        className="w-full h-full object-cover scale-105 brightness-50 saturate-50 blur-[1px]"
      />

      {/* Muted gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-800/60 to-gray-900/80" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-2 drop-shadow-lg">
            Find Your Dream Home
          </h1>
          <p className="text-base md:text-lg mb-6 text-gray-100 drop-shadow-md">
            Search from thousands of listings in Toronto and the GTA
          </p>

          {/* Solid white search card */}
          <Card className="max-w-3xl mx-auto shadow-xl bg-white border-0">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Enter address, neighborhood, or postal code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 bg-white text-gray-800 border-gray-200"
                  />
                </div>
                <Button
                  size="lg"
                  className="md:w-auto w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="md:w-auto w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                {["Buy", "Rent", "Sold"].map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className="cursor-pointer border-gray-300 text-gray-600 hover:bg-gray-100"
                  >
                    {item}
                  </Badge>
                ))}
                <Separator orientation="vertical" className="h-6 mx-2 bg-gray-300" />
                {["House", "Condo", "Townhouse"].map((type) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className="cursor-pointer border-gray-300 text-gray-600 hover:bg-gray-100"
                  >
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
