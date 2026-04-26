"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { Menu, X, HomeIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ProvinceSelector from "./ProvinceSelector";
import { colors } from "@/config/design-system";

const navigation = [
  { name: "Map Search", href: "/map-search" },
  { name: "Find My Home", href: "/find-my-property" },
  { name: "Pre-Construction", href: "/Precon" },
  { name: "Home Valuation", href: "/valuation" },
  { name: "Blog", href: "/blog" },
];

interface MobileNavProps {
  isScrolled: boolean;
}

export default function MobileNav({ isScrolled }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header
      style={{ backgroundColor: "#0C1536" }}
      className={`lg:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "shadow-xl py-1" : "py-3"
        }`}
    >
      <div className="flex items-center justify-between px-4 h-16">
        {/* Menu & Logo */}
        <div className="flex items-center space-x-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="transition-colors duration-300"
              >
                <Menu className="w-6 h-6 text-white drop-shadow-md" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-[300px] bg-[#0C1536] p-0 border-r border-white/10"
            >
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                  <div className="flex items-center">
                    <div className="relative h-8 w-32">
                      <Image
                        src="https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png"
                        alt="Estate-4u"
                        width={128}
                        height={32}
                        className="h-full w-full object-contain filter brightness-0 invert"
                        priority
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/50 hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Province Selector for Mobile */}
                  <div>
                    <h3 className="text-xs font-semibold text-[#4C7DFF] uppercase tracking-widest mb-4">
                      Location
                    </h3>
                    <ProvinceSelector variant="mobile" />
                  </div>

                  {/* Navigation Links */}
                  <div>
                    <h3 className="text-xs font-semibold text-[#4C7DFF] uppercase tracking-widest mb-4">
                      Navigation
                    </h3>
                    <nav className="space-y-1">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="block px-3 py-3 rounded-lg text-base font-medium text-white/80 hover:text-white hover:bg-white/5 transition-all"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </nav>
                  </div>
                </div>

                {/* Mobile Menu Footer */}
                <div className="p-6 border-t border-white/5 space-y-4">
                  <Link
                    href="/login"
                    className="w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    <Button
                      className="w-full text-white border-white/10 hover:bg-white/5"
                      variant="outline"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link
                    href="/valuation"
                    className="w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    <Button
                      className="w-full font-semibold text-white"
                      style={{ backgroundColor: colors.primary }}
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center">
            <div className="relative h-10 w-40">
              <Image
                src="https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png"
                alt="Estate-4u"
                width={160}
                height={40}
                className="h-full w-full object-contain filter brightness-0 invert"
                priority
              />
            </div>
          </Link>
        </div>

        {/* User Icon Quick Action */}
        <Button variant="ghost" size="icon">
          <User className="w-6 h-6 text-white drop-shadow-md" />
        </Button>
      </div>
    </header>
  );
}
