"use client";

import Link from "next/link";
import Image from "next/image";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { HomeIcon, User } from "lucide-react";
import ProvinceSelector from "./ProvinceSelector";
import { colors } from "@/config/design-system";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Map Search", href: "/map-search" },
  { name: "Community Listings", href: "/community-listings" },
  { name: "Find My Home", href: "/find-my-property" },
  { name: "List Property", href: "/list-your-property" },
  { name: "PreCon", href: "/precon-listings" },
  { name: "Home Valuation", href: "/valuation" },
  { name: "Blog", href: "/blog" },
];

interface DesktopNavProps {
  isScrolled: boolean;
}

export default function DesktopNav({ isScrolled }: DesktopNavProps) {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ backgroundColor: "#0C1536" }}
      className={`hidden lg:block fixed top-0 left-0 right-0 z-50 transition-all duration-500 antialiased ${isScrolled ? "shadow-2xl py-1" : "py-3"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo Group */}
          <Link href="/" className="flex items-center group">
            <div className="relative h-12 w-48 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png"
                alt="Estate-4u"
                width={192}
                height={48}
                className="h-full w-full object-contain filter brightness-0 invert"
                priority
              />
            </div>
          </Link>

          {/* Navigation & Utilities */}
          <div className="flex items-center space-x-10">
            <nav className="flex items-center space-x-6">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative text-xs font-semibold uppercase tracking-wider transition-all duration-300 font-inter group ${isActive ? "text-white" : "text-white/60 hover:text-white"
                      }`}
                  >
                    {item.name}
                    <span
                      className={`absolute -bottom-1.5 left-0 h-0.5 transition-all duration-300 ${isActive
                          ? "w-full bg-[#4C7DFF]"
                          : "w-0 group-hover:w-full bg-[#4C7DFF]/50"
                        }`}
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="h-6 w-px bg-white/10" />

            <div className="flex items-center space-x-6">
              <ProvinceSelector variant="desktop" isScrolled={isScrolled} />

              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-[#4C7DFF] hover:bg-white/5 transition-all duration-300 font-medium px-4"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/valuation">
                  <Button
                    size="sm"
                    className="font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] text-white px-6 rounded-lg"
                    style={{
                      backgroundColor: "#4C7DFF",
                    }}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
