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
    <div className="relative w-full ">

<div className="max-w-4xl mx-auto -mt-8 relative z-20">
  <div className="bg-white shadow-lg overflow-hidden">
    <div className="flex items-stretch">
      {/* Text input */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="City, Area, Postal Code, ID#, or Addr"
          className="w-full h-16 px-6 text-gray-700 placeholder-gray-400 focus:outline-none"
        />
      </div>

      {/* Dropdowns group */}
      <div className="flex space-x-0">
        <select className="h-16 px-6 border-l border-gray-200 text-gray-700 focus:outline-none">
          <option>Single Family, Condo</option>
        </select>

        <select className="h-16 px-6 border-l border-gray-200 text-gray-700 focus:outline-none">
          <option>Beds</option>
        </select>

        <select className="h-16 px-6 border-l border-gray-200 text-gray-700 focus:outline-none">
          <option>Baths</option>
        </select>

        <select className="h-16 px-6 border-l border-gray-200 text-gray-700 focus:outline-none">
          <option>Min</option>
        </select>

        <select className="h-16 px-6 border-l border-gray-200 text-gray-700 focus:outline-none">
          <option>Max</option>
        </select>
      </div>

      {/* Search button */}
      <div className="flex-shrink-0">
        <button
          type="button"
          className="h-16 px-8 bg-blue-800 text-white font-semibold focus:outline-none"
        >
          Search
        </button>
      </div>
    </div>
  </div>

  {/* More Options centered below */}
  <div className="flex justify-center mt-4">
    <button
      type="button"
      className="inline-flex items-center gap-2 bg-blue-800 text-white text-sm px-5 py-2 shadow"
    >
      More Options
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  </div>
</div>

      <div className="h-20" /> {/* Spacer to prevent content overlap */}
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