"use client";

import { DesktopHeader } from "@/components/header/DesktopHeader";
import { MobileHeader } from "@/components/header/MobileHeader";

export default function Header() {
  const navigation = [
    { name: "Map Search", href: "/map-search" },
    { name: "Trends", href: "/trends" },
    { name: "Home Valuation", href: "/valuation" },
    { name: "Watched", href: "/watched" },
    { name: "Our Properties", href: "/pre-construction" },
    { name: "PreCon", href: "/precon-listings" },
    { name: "Blog", href: "/blog" },
  ];

  return (
    <>
      {/* 🌐 Desktop Header */}
      <DesktopHeader navigation={navigation} />

      {/* 📱 Mobile Header */}
      <MobileHeader navigation={navigation} />
    </>
  );
}
