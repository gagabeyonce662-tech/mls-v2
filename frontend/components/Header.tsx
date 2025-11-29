"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Menu, Phone, User, ChevronDown, X, HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Map Search", href: "/" },
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
                <span className="text-xl font-bold text-ds-heading font-inter">LOGOSIPSUM</span>
              </div>
            </Link>

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
              <Button
                variant="ghost"
                className="text-ds-heading hover:text-ds-primary px-4 font-inter"
              >
                Login
              </Button>
              <Button
                className="bg-cyan-400 hover:bg-cyan-500 text-ds-heading px-6 font-semibold font-inter"
              >
                Get Started
              </Button>
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
                <Menu className="w-6 h-6 text-gray-700" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-72 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="w-5 h-5 text-gray-700" />
                </Button>
              </div>

              <nav className="space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block text-lg font-medium text-gray-700 hover:text-blue-900 transition-all"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              <div className="mt-8 border-t border-gray-200 pt-4 space-y-3">
                <Button className="w-full" variant="outline">
                  Login
                </Button>
                <Button className="w-full bg-cyan-400 hover:bg-cyan-500 text-gray-900 font-semibold">
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
            <span className="text-lg font-bold text-ds-primary font-inter">LOGOSIPSUM</span>
          </Link>

          {/* User Icon */}
          <Button variant="ghost" size="icon">
            <User className="w-6 h-6 text-gray-700" />
          </Button>
        </div>
      </header>
    </>
  );
}
