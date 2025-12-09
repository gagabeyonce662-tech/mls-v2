"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Menu, Phone, User, ChevronDown, X, HomeIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { colors } from "@/config/design-system";
import { useProvince } from "@/contexts/ProvinceContext";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedProvince, setSelectedProvince, getProvinceName, getAllProvinces } = useProvince();

  const navigation = [
    { name: "Map Search", href: "/map-search" },
    { name: "Trends", href: "/trends" },
    { name: "Home Valuation", href: "/valuation" },
    { name: "Agents", href: "/agents" },
    { name: "Tools", href: "/tools" },
    { name: "Watched", href: "/watched" },
    {name:"Blog", href:"/blog" },   
  ];

  return (
    <>
      {/* 🌐 Desktop Header */}
     
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden lg:block absolute top-0 left-0 right-0 z-50 bg-white shadow-sm transition-all duration-500"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* 🏠 Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-ds-primary rounded-lg flex items-center justify-center">
                  <HomeIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-ds-heading font-inter">EstateforYou</span>
              </div>
            </Link>

            {/* 🌍 Province Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-ds-heading hover:text-ds-primary hover:bg-ds-card transition-colors border border-ds-card-border rounded-lg"
                  style={{  backgroundColor: colors.primary,color: colors.cards }} 
                >
                  <MapPin className="w-4 h-4" />
                  <span>{selectedProvince}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto bg-white border border-ds-card-border shadow-lg">
                {getAllProvinces().map((province) => (
                  <DropdownMenuItem
                    key={province.code}
                    onClick={() => setSelectedProvince(province.code)}
                    className={`cursor-pointer px-3 py-2 text-sm hover:bg-ds-card transition-colors ${
                      selectedProvince === province.code ? 'bg-ds-card text-ds-primary font-semibold' : 'text-ds-heading'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-ds-body" />
                      <div>
                        <div className="font-medium">{province.name}</div>
                        <div className="text-xs text-ds-body">{province.shortName}</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 🧭 Navigation */}
            <nav className="flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-ds-heading hover:text-ds-primary transition-all duration-200 font-inter"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* 📞 Login Button */}
            <div className="flex items-center space-x-3">
           
             
            </div>
          </div>
        </div>
      </motion.header>

      {/* 📱 Mobile Header */}
      <header className="lg:hidden absolute top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Hamburger Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" style={{ color: colors.heading }} />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-72 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold" style={{ color: colors.heading }}>Menu</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="w-5 h-5" style={{ color: colors.heading }} />
                </Button>
              </div>

              {/* Province Selector for Mobile */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3" style={{ color: colors.heading }}>Select Province</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{getProvinceName(selectedProvince)}</span>
                      </div>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 max-h-64 overflow-y-auto">
                    {getAllProvinces().map((province) => (
                      <DropdownMenuItem
                        key={province.code}
                        onClick={() => setSelectedProvince(province.code)}
                        className={`cursor-pointer ${
                          selectedProvince === province.code ? 'bg-ds-card text-ds-primary font-semibold' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <MapPin className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{province.name}</div>
                            <div className="text-xs text-ds-body">{province.code}</div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <nav className="space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block text-lg font-medium transition-all"
                    style={{ color: colors.body }}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              <div className="mt-8 border-t pt-4 space-y-3" style={{ borderColor: colors.boarder }}>
                <Button className="w-full" variant="outline">
                  Login
                </Button>
                <Button className="w-full font-semibold" style={{ backgroundColor: colors.icon, color: colors.cards }}>
                  Get Started
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-ds-primary rounded-full flex items-center justify-center">
              <HomeIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-ds-primary font-inter">EstateforYou</span>
          </Link>

          {/* User Icon */}
          <Button variant="ghost" size="icon">
            <User className="w-6 h-6" style={{ color: colors.heading }} />
          </Button>
        </div>
      </header>
    </>
  );
}
