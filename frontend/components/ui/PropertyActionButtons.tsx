"use client";

import { Heart, Printer, Share2 } from "lucide-react";
import { Button } from "./button";

export function PropertyActionButtons() {
  return (
    <div className="flex items-center gap-4 py-4">
      <Button variant="outline" className="flex items-center gap-2">
        <Heart className="w-4 h-4" />
        Save Listing
      </Button>
      <Button variant="outline" className="flex items-center gap-2">
        <Printer className="w-4 h-4" />
        Print
      </Button>
      <Button variant="outline" className="flex items-center gap-2">
        <Share2 className="w-4 h-4" />
        Share
      </Button>
    </div>
  );
}

