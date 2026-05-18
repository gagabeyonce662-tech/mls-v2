"use client";

import { useState } from "react";
import { useHeaderState } from "@/hooks/useHeaderState";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  User,
  MapPin,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Bell,
} from "lucide-react";
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
import { useUserAuth } from "@/contexts/UserAuthContext";

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
  const { user, logout } = useUserAuth();

  const { scrolled, applyLightMode } = useHeaderState({
    scrollThreshold: 20,
    cssVarName: "--header-height-mobile",
    heightFull: "64px",
    heightScrolled: "56px",
  });

  return (
    <header
      className={`xl:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        applyLightMode
          ? "bg-white/95 backdrop-blur-md shadow-md border-b border-ds-card-border/70"
          : "bg-gradient-to-b from-black/55 via-black/30 to-transparent shadow-none"
      }`}
    >
      {/* 🧭 Main Navigation Tier (Mobile) */}
      <div
        className={`transition-all duration-300 ${
          scrolled ? "h-14" : "h-16"
        } ${applyLightMode ? "bg-ds-card/60" : "bg-transparent"}`}
      >
        <div className="flex items-center justify-between px-4 h-full">
          {/* Hamburger Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full transition-all ${
                  applyLightMode
                    ? "bg-white border border-ds-card-border shadow-sm hover:bg-ds-card"
                    : "bg-black/25 border border-white/20 hover:bg-black/35"
                }`}
              >
                <Menu
                  className={`w-6 h-6 transition-colors ${applyLightMode ? "text-ds-heading" : "text-white"}`}
                />
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
              </div>

              {/* Profile Section if logged in */}
              {user && (
                <div className="mb-6 pb-6 border-b border-ds-card-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-ds-card rounded-full flex items-center justify-center border border-ds-card-border">
                      <User className="h-6 w-6 text-ds-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-ds-heading">
                        {user.name}
                      </div>
                      <div className="text-xs text-ds-body">{user.email}</div>
                    </div>
                  </div>
                </div>
              )}

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
                {user && (
                  <Link
                    href="/watched"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-2 text-lg font-medium transition-all"
                    style={{ color: colors.body }}
                  >
                    <Bell className="w-5 h-5" />
                    <span>Watched</span>
                  </Link>
                )}
                {user && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-2 text-lg font-medium transition-all"
                    style={{ color: colors.body }}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Admin Panel</span>
                  </Link>
                )}
              </nav>

              <div
                className="mt-8 border-t pt-4 space-y-3"
                style={{ borderColor: colors.boarder }}
              >
                {user ? (
                  <Button
                    className="w-full text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700"
                    variant="outline"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </Button>
                ) : (
                  <>
                    <Link
                      href="/sign-in"
                      onClick={() => setIsOpen(false)}
                      className="block"
                    >
                      <Button className="w-full" variant="outline">
                        Sign In
                      </Button>
                    </Link>
                    <Link
                      href="/sign-up"
                      onClick={() => setIsOpen(false)}
                      className="block"
                    >
                      <Button
                        className="w-full font-semibold shadow-md active:scale-[0.98] transition-transform"
                        style={{
                          backgroundColor: colors.primary,
                          color: colors.cards,
                        }}
                      >
                        Join Estate-4u
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div
              className={`relative transition-all duration-300 active:scale-95 ${scrolled ? "h-9 w-36" : "h-10 w-40"}`}
            >
              <Image
                src="https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png"
                alt="Estate-4u"
                width={160}
                height={40}
                className={`h-full w-full object-contain transition-all duration-300 ${!applyLightMode ? "brightness-0 invert" : ""}`}
                priority
              />
            </div>
          </Link>

          {/* Main Nav Tools */}
          <div className="flex items-center space-x-2">
            {/* User Icon -> Admin Link */}
            {user ? (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`border rounded-full shadow-sm transition-all ${applyLightMode ? "bg-ds-card border-ds-card-border" : "bg-white/10 border-white/20"}`}
                >
                  <LayoutDashboard
                    className={`w-5 h-5 ${applyLightMode ? "text-ds-primary" : "text-white"}`}
                  />
                </Button>
              </Link>
            ) : (
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full transition-all ${
                    applyLightMode
                      ? "bg-white border border-ds-card-border shadow-sm hover:bg-ds-card"
                      : "bg-black/25 border border-white/20 hover:bg-black/35"
                  }`}
                >
                  <User
                    className={`w-5 h-5 drop-shadow-sm ${applyLightMode ? "text-ds-primary" : "text-white"}`}
                  />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
