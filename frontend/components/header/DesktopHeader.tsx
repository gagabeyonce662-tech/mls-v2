"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useHeaderState } from "@/hooks/useHeaderState";
import { motion } from "framer-motion";
import {
  User,
  LogOut,
  LayoutDashboard,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { colors } from "@/config/design-system";
import { useUserAuth } from "@/contexts/UserAuthContext";

interface DesktopHeaderProps {
  navigation: { name: string; href: string }[];
}

export function DesktopHeader({ navigation }: DesktopHeaderProps) {
  const [showMainNav, setShowMainNav] = useState(true);
  const lastScrollY = useRef(0);
  const { user, logout } = useUserAuth();

  const { scrolled, applyLightMode } = useHeaderState({
    scrollThreshold: 50,
    cssVarName: "--header-height",
    heightFull: "80px",
    heightScrolled: "56px",
  });

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const scrollingUp = currentY < lastScrollY.current;
      const nearTop = currentY <= 10;

      setShowMainNav(nearTop || scrollingUp);
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`hidden xl:block fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${applyLightMode
          ? "bg-white/95 backdrop-blur-md shadow-lg"
          : "bg-transparent shadow-none"
        }`}
    >
      {/* 🧭 Main Navigation Tier */}
      <motion.div
        initial={false}
        animate={{
          height: showMainNav ? (scrolled ? 56 : 80) : 0,
          opacity: showMainNav ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="bg-transparent overflow-hidden"
      >
        <div className="w-full px-4 lg:px-6 flex items-center justify-between h-full">
          {/* 🏠 Logo */}
          <Link href="/" className="flex items-center group">
            <div
              className={`relative transition-all duration-500 ease-out group-hover:scale-[1.02] ${scrolled ? "h-10 w-32" : "h-14 w-44"}`}
            >
              <Image
                src="https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png"
                alt="Estate-4u"
                width={208}
                height={56}
                className="h-full w-full object-contain object-left transition-all duration-300"
                priority
              />
            </div>
          </Link>

          {/* 🧭 Navigation Links */}
          <nav className="flex-1 min-w-0 flex items-center justify-center gap-x-5 xl:gap-x-7 2xl:gap-x-10 3xl:gap-x-14 px-4 xl:px-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-bold transition-all duration-200 font-inter relative group uppercase tracking-wide whitespace-nowrap text-ds-heading hover:text-ds-primary"
              >
                {item.name}
                <span
                  className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full rounded-full bg-ds-primary"
                />
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
                <DropdownMenuContent
                  className="w-56 mt-2"
                  align="end"
                  forceMount
                >
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
                  <Link href="/watched">
                    <DropdownMenuItem className="cursor-pointer">
                      <Bell className="mr-2 h-4 w-4 text-ds-primary" />
                      <span>Watched</span>
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
                    className="text-sm font-bold h-9 px-3 xl:px-4 transition-all whitespace-nowrap text-ds-heading hover:bg-ds-card"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    className="text-sm font-bold h-9 px-4 xl:px-5 shadow-md hover:shadow-lg transition-all whitespace-nowrap bg-ds-primary text-white hover:bg-ds-primary/90"
                  >
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}
