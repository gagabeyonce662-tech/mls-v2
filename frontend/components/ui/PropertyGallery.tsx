"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";

interface PropertyGalleryProps {
  mainImage: string;
  thumbnails: (string | null)[];
}

export function PropertyGallery({
  mainImage,
  thumbnails,
}: PropertyGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(mainImage);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Image */}
      <div className="lg:col-span-2 relative group">
        <div className="relative w-full h-[500px] rounded-lg overflow-hidden bg-gray-200">
          <img
            src={selectedImage}
            alt="Property main view"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <Badge className="bg-gray-900 text-white">New Listing</Badge>
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-2 gap-4">
        {thumbnails.map((thumb, index) => (
          <div
            key={index}
            className={`relative cursor-pointer rounded-lg overflow-hidden bg-gray-200 ${
              selectedImage === thumb ? "ring-2 ring-teal-600" : ""
            }`}
            onClick={() => thumb && setSelectedImage(thumb)}
          >
            {thumb ? (
              <img
                src={thumb}
                alt={`Property view ${index + 1}`}
                className="w-full h-full object-cover aspect-square"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-xs">Coming Soon</span>
              </div>
            )}
          </div>
        ))}
        <div className="col-span-2">
          <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
            View All Photos
          </Button>
        </div>
      </div>
    </div>
  );
}
