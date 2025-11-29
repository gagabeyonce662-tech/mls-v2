"use client";

import { Search } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";

export function PropertyHeader() {
  return (
    <div className="w-full bg-gray-100 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search listings..."
              className="pl-10 bg-white"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-gray-700">
            Sign In
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
}

