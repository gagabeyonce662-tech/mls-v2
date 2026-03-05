"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HomeIcon,
  MapPin,
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { colors } from "@/config/design-system";
import { useProvince } from "@/contexts/ProvinceContext";
import { useUserAuth } from "@/contexts/UserAuthContext";

interface DesktopHeaderProps {
  navigation: { name: string; href: string }[];
}

export function DesktopHeader({ navigation }: DesktopHeaderProps) {
  const { selectedProvince, setSelectedProvince, getAllProvinces } =
    useProvince();
  const { user, logout } = useUserAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);

      // Intelligent Height adjustment: update global CSS variable
      const height = isScrolled ? "56px" : "104px";
      document.documentElement.style.setProperty("--header-height", height);
    };

    // Set initial value
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`hidden lg:block fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
        ? "bg-white/95 backdrop-blur-md shadow-lg"
        : "bg-transparent shadow-none"
        }`}
    >
      {/* 🔝 Top Utility Tier */}
      <motion.div
        animate={{ height: scrolled ? 0 : 40, opacity: scrolled ? 0 : 1 }}
        className="bg-[#0C1536] text-white/90 border-b border-white/10 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 h-10 flex items-center justify-between text-xs font-medium tracking-wide">
          {/* Contact Info */}
          <div className="flex items-center space-x-6">
            <a
              href="tel:+14168214200"
              className="flex items-center space-x-2 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#4C7DFF]" />
              <span>+1 (416) 821-4200</span>
            </a>
            <div className="w-px h-4 bg-white/20" />
            <a
              href="mailto:info@estate-4u.com"
              className="flex items-center space-x-2 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#4C7DFF]" />
              <span>info@estate-4u.com</span>
            </a>
          </div>

          {/* Location & Utilities */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1.5 hover:text-white transition-colors focus:outline-none">
                  <MapPin className="w-3.5 h-3.5 text-[#4C7DFF]" />
                  <span>{selectedProvince}</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 max-h-64 overflow-y-auto bg-white border border-ds-card-border shadow-lg mt-2"
              >
                {getAllProvinces().map((province) => (
                  <DropdownMenuItem
                    key={province.code}
                    onClick={() => setSelectedProvince(province.code)}
                    className={`cursor-pointer px-3 py-2 text-sm hover:bg-ds-card transition-colors ${selectedProvince === province.code
                      ? "bg-ds-card text-ds-primary font-semibold"
                      : "text-ds-heading"
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-ds-body" />
                      <div>
                        <div className="font-medium">{province.name}</div>
                        <div className="text-xs text-ds-body">
                          {province.shortName}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      {/* 🧭 Main Navigation Tier */}
      <div className={`transition-all duration-300 ${scrolled ? "bg-transparent h-14" : "bg-transparent h-20"}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-full">
          {/* 🏠 Logo */}
          <Link href="/" className="flex items-center group">
            <div className={`relative transition-all duration-300 group-hover:scale-[1.02] ${scrolled ? "h-10 w-40" : "h-14 w-52"}`}>
              <Image
                src="https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png"
                alt="Estate-4u"
                width={208}
                height={56}
                className={`h-full w-full object-contain transition-all duration-300 ${!scrolled ? "brightness-0 invert" : ""}`}
                priority
              />
            </div>
          </Link>

          {/* 🧭 Navigation Links */}
          <nav className="flex items-center space-x-10">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-bold transition-all duration-200 font-inter relative group uppercase tracking-widest ${scrolled ? "text-ds-heading hover:text-ds-primary" : "text-white hover:text-white/80"}`}
              >
                {item.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full rounded-full ${scrolled ? "bg-ds-primary" : "bg-white"}`} />
              </Link>
            ))}
          </nav>

          {/* 📞 Auth Buttons / User Menu */}
          <div className="flex items-center space-x-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full bg-ds-card border border-ds-card-border shadow-sm hover:shadow transition-all"
                  >
                    <User className="h-5 w-5 text-ds-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-ds-body">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/admin">
                    <DropdownMenuItem className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4 text-ds-primary" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4 text-ds-primary" />
                    <span>Profile Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/sign-in">
                  <Button
                    variant="ghost"
                    className={`text-sm font-bold h-9 px-4 transition-all ${scrolled ? "text-ds-heading hover:bg-ds-card" : "text-white hover:bg-white/10"}`}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className={`text-sm font-bold h-9 px-6 shadow-md hover:shadow-lg transition-all ${scrolled ? "bg-ds-primary text-white hover:bg-ds-primary/90" : "bg-white text-ds-primary hover:bg-white/90"}`}>
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
