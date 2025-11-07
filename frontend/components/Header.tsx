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
    { name: "Home", href: "/" },
    { name: "Pre-Construction", href: "/pre-construction" },
    {
      name: "Resale",
      href: "/resale",
      submenu: [{ name: "Our Listings", href: "/resale-listing" }],
    },
    { name: "Services", href: "/services" },
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <>
      {/* 🌐 Desktop Header */}
     
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden lg:block top-[-10] z-50 text-white shadow-lg transition-all duration-500 "
        style={{
          height: "300px",
          backgroundImage: "url('https://res.cloudinary.com/dlk9jjdvo/image/upload/v1762439828/1366-asbl-landmark_xbc0v9.webp')", // 🔥 change this to your image link
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Translucent Overlay */}
        <div className="backdrop-blur-md bg-black/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-20">
              {/* 🏠 Logo */}
              <Link href="/" className="flex items-center space-x-3">
                <Image
                  src="https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png"
                  alt="Estate-4u Logo"
                  width={120}
                  height={60}
                  className="object-contain brightness-110"
                />
                <span className="text-xl font-semibold tracking-tight">
                  Estate<span className="text-orange-500">4U</span>
                </span>
              </Link>

              {/* 🧭 Navigation */}
              <nav className="flex items-center space-x-8">
                {navigation.map((item) =>
                  item.submenu ? (
                    <DropdownMenu key={item.name}>
                      <DropdownMenuTrigger asChild>
                        <span className="flex items-center space-x-1 cursor-pointer text-gray-100 hover:text-orange-400 font-medium transition-all duration-200">
                          <span>{item.name}</span>
                          <ChevronDown className="w-4 h-4 mt-[1px]" />
                        </span>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent className="mt-2 bg-black/70 backdrop-blur-lg text-white shadow-lg rounded-xl border border-white/10">
                        {item.submenu.map((subItem) => (
                          <DropdownMenuItem key={subItem.name} asChild>
                            <Link
                              href={subItem.href}
                              className="block px-3 py-2 text-sm text-gray-100 hover:text-orange-400 transition-colors"
                            >
                              {subItem.name}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="relative text-gray-100 font-medium hover:text-orange-400 transition-all duration-300 group"
                    >
                      {item.name}
                      <motion.span
                        layoutId="underline"
                        className="absolute left-0 bottom-0 w-0 h-[2px] bg-orange-500 group-hover:w-full transition-all duration-300"
                      />
                    </Link>
                  )
                )}
              </nav>

              {/* 📞 Contact + User */}
              <div className="flex items-center space-x-5">
                <Link
                  href="tel:647-515-2000"
                  className="flex items-center text-gray-100 hover:text-orange-400 font-medium transition-all"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  647-515-2000
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all"
                >
                  <User className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 📱 Mobile Header */}
      <header
        className="lg:hidden sticky top-0 z-50 text-white"
        style={{
          backgroundImage: "url('/hero-bg.jpg')", // same image for mobile too
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="backdrop-blur-md bg-black/50">
          <div className="flex items-center justify-between px-4 h-20">
            {/* Hamburger Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6 text-white" />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-72 bg-black/70 backdrop-blur-lg text-white">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="w-5 h-5 text-white" />
                  </Button>
                </div>

                <nav className="space-y-4">
                  {navigation.map((item) => (
                    <div key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="block text-lg font-medium text-gray-100 hover:text-orange-400 transition-all"
                      >
                        {item.name}
                      </Link>

                      {item.submenu && (
                        <div className="ml-3 mt-2 space-y-2 border-l border-white/20 pl-3">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              onClick={() => setIsOpen(false)}
                              className="block text-sm text-gray-300 hover:text-orange-400"
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>

                <div className="mt-8 border-t border-white/20 pt-4">
                  <Link
                    href="tel:647-515-2000"
                    className="flex items-center text-gray-100 hover:text-orange-400"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    647-515-2000
                  </Link>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <HomeIcon className="w-6 h-6 text-orange-500" />
              <span className="text-lg font-semibold">
                Estate<span className="text-orange-500">4U</span>
              </span>
            </Link>

            {/* User Icon */}
            <Button variant="ghost" size="icon">
              <User className="w-6 h-6 text-white" />
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}
