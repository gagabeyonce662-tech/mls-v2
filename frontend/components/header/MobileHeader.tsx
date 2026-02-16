"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, User, X, MapPin, ChevronDown, HomeIcon } from "lucide-react";
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

interface MobileHeaderProps {
  navigation: { name: string; href: string }[];
}

export function MobileHeader({ navigation }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    selectedProvince,
    setSelectedProvince,
    getProvinceName,
    getAllProvinces,
  } = useProvince();

  return (
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
              <h2
                className="text-lg font-semibold"
                style={{ color: colors.heading }}
              >
                Menu
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" style={{ color: colors.heading }} />
              </Button>
            </div>

            {/* Province Selector for Mobile */}
            <div className="mb-6">
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: colors.heading }}
              >
                Select Province
              </h3>
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
                        selectedProvince === province.code
                          ? "bg-ds-card text-ds-primary font-semibold"
                          : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{province.name}</div>
                          <div className="text-xs text-ds-body">
                            {province.code}
                          </div>
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

            <div
              className="mt-8 border-t pt-4 space-y-3"
              style={{ borderColor: colors.boarder }}
            >
              <Button className="w-full" variant="outline">
                Login
              </Button>
              <Button
                className="w-full font-semibold"
                style={{ backgroundColor: colors.icon, color: colors.cards }}
              >
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
          <span className="text-lg font-bold text-ds-primary font-inter">
            EstateforYou
          </span>
        </Link>

        {/* User Icon -> Admin Link */}
        <Link href="/admin">
          <Button variant="ghost" size="icon" title="Admin Login">
            <User className="w-6 h-6" style={{ color: colors.heading }} />
          </Button>
        </Link>
      </div>
    </header>
  );
}
