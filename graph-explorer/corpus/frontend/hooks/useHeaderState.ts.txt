import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface HeaderStateOptions {
  scrollThreshold: number;
  cssVarName: string;
  heightFull: string;
  heightScrolled: string;
}

export function useHeaderState({
  scrollThreshold,
  cssVarName,
  heightFull,
  heightScrolled,
}: HeaderStateOptions) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const isHeroPage = pathname === "/" || pathname === "/valuation";
  const applyLightMode = scrolled || !isHeroPage;

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > scrollThreshold;
      setScrolled(isScrolled);

      const height = isScrolled ? heightScrolled : heightFull;
      document.documentElement.style.setProperty(cssVarName, height);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollThreshold, cssVarName, heightFull, heightScrolled]);

  return { scrolled, applyLightMode };
}
