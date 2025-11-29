"use client";

import { useState } from "react";
import { Search, MapPin } from "lucide-react";

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="relative w-full bg-gradient-to-r from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text and Search */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Find Your Place
              </h1>
              <p className="text-lg text-gray-600 max-w-lg">
                We are a community-led collaborative sales app that integrates your local
                Multiple Listing Service (MLS).
              </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-lg p-2 flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-4">
                <MapPin className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter city, neighborhood or address"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3 text-gray-700 placeholder-gray-400 focus:outline-none"
                />
              </div>
              <button className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 rounded-md font-medium flex items-center gap-2 transition-colors">
                <Search className="w-5 h-5" />
                Search
              </button>
            </div>
          </div>

          {/* Right Side - House Image */}
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
              alt="Modern House"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


//       {/* Floating Search Box (centered overlapping image and white section) */}
      // <div className="absolute left-1/2 bottom-[4rem] transform -translate-x-1/2 w-full max-w-3xl px-4 z-20 -top-16">
      //   <Card className="shadow-2xl bg-white border-0 rounded-2xl">
      //     <CardContent className="p-5">
      //       <div className="flex flex-col md:flex-row gap-4">
      //         <div className="flex-1 relative">
      //           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      //           <Input
      //             placeholder="Enter address, neighborhood, or postal code..."
      //             value={searchQuery}
      //             onChange={(e) => setSearchQuery(e.target.value)}
      //             className="pl-10 h-12 bg-white text-gray-800 border-gray-200"
      //           />
      //         </div>

      //         <Button
      //           size="lg"
      //           className="md:w-auto w-full bg-blue-600 hover:bg-blue-700 text-white"
      //         >
      //           <Search className="w-5 h-5 mr-2" />
      //           Search
      //         </Button>

      //         <Button
      //           size="lg"
      //           variant="outline"
      //           className="md:w-auto w-full border-gray-300 text-gray-700 hover:bg-gray-100"
      //         >
      //           <Filter className="w-5 h-5 mr-2" />
      //           Filters
      //         </Button>
      //       </div>

      //       <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
      //         {["Buy", "Rent", "Sold"].map((item) => (
      //           <Badge
      //             key={item}
      //             variant="outline"
      //             className="cursor-pointer border-gray-300 text-gray-600 hover:bg-gray-100"
      //           >
      //             {item}
      //           </Badge>
      //         ))}
      //         <Separator orientation="vertical" className="h-6 mx-2 bg-gray-300" />
      //         {["House", "Condo", "Townhouse"].map((type) => (
      //           <Badge
      //             key={type}
      //             variant="outline"
      //             className="cursor-pointer border-gray-300 text-gray-600 hover:bg-gray-100"
      //           >
      //             {type}
      //           </Badge>
      //         ))}
      //       </div>
      //     </CardContent>
      //   </Card>
      // </div>