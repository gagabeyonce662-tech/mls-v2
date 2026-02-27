"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  HomeIcon,
  MapPin,
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
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

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-white shadow-sm transition-all duration-500"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* 🏠 Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-ds-primary rounded-lg flex items-center justify-center">
                <HomeIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-ds-heading font-inter">
                EstateforYou
              </span>
            </div>
          </Link>

          {/* 🌍 Province Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-ds-heading hover:text-ds-primary hover:bg-ds-card transition-colors border border-ds-card-border rounded-lg"
                style={{
                  backgroundColor: colors.primary,
                  color: colors.cards,
                }}
              >
                <MapPin className="w-4 h-4" />
                <span>{selectedProvince}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56 max-h-64 overflow-y-auto bg-white border border-ds-card-border shadow-lg"
            >
              {getAllProvinces().map((province) => (
                <DropdownMenuItem
                  key={province.code}
                  onClick={() => setSelectedProvince(province.code)}
                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-ds-card transition-colors ${
                    selectedProvince === province.code
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

          {/* 📞 Auth Buttons / User Menu */}
          <div className="flex items-center space-x-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full bg-ds-card border border-ds-card-border"
                  >
                    <User className="h-5 w-5 text-ds-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
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
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
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
              <>
                <Link href="/sign-in">
                  <Button
                    variant="ghost"
                    className="text-sm font-semibold text-ds-heading hover:bg-ds-card"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="text-sm font-semibold h-9 px-4">
                    Join
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
