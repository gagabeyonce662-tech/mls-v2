"use client";

import {
  HomeIcon,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Building2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import Image from "next/image";
import { colors } from "@/config/design-system";

const Footer = () => {
  return (
    <footer style={{ backgroundColor: colors.primary, color: colors.cards }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="relative h-10 w-40">
                  <Image
                    src="https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png"
                    alt="Estate-4u Logo"
                    width={160}
                    height={40}
                    className="h-full w-full object-contain brightness-0 invert"
                    priority
                  />
                </div>
              </div>

              {/* Brokerage Logo */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-1 px-2 rounded border border-white/20 flex items-center space-x-2 cursor-help opacity-90 hover:opacity-100 transition-opacity bg-white/10">
                      <Image
                        src="https://estate-4u.com/wp-content/uploads/elementor/thumbs/Remax-N-Logo_11-rbufwi97ttun502ryrnerevnq8q4d38qspkdwun580.png"
                        alt="RE/MAX Brokerage Logo"
                        width={120}
                        height={35}
                        className="h-7 w-auto object-contain"
                      />
                      <span className="text-[10px] uppercase tracking-wider font-bold">Brokerage</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Our Brokerage</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p
              className="text-ds-body-regular leading-relaxed mb-6 font-inter"
              style={{ color: colors.cards, opacity: 0.8 }}
            >
              Estate-4u is a cutting-edge property and real estate discovery
              portal for finding residential & commercial properties. Start your
              property searching journey with us, powered by an intuitive
              technology platform with a team of dedicated professionals at your
              service.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/Estate4uCorp"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                style={{
                  backgroundColor: `${colors.cards}20`,
                  color: colors.cards,
                }}
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/estate4uprec/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                style={{
                  backgroundColor: `${colors.cards}20`,
                  color: colors.cards,
                }}
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/channel/UC7g87rmbTk4N8v5n4QAGfWw"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                style={{
                  backgroundColor: `${colors.cards}20`,
                  color: colors.cards,
                }}
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href="https://wa.link/9m5jf2"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                style={{
                  backgroundColor: `${colors.cards}20`,
                  color: colors.cards,
                }}
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3
              className="text-ds-text mb-4 font-inter font-bold"
              style={{ color: colors.cards }}
            >
              SERVICES
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/map-search"
                  className="transition-colors text-sm hover:opacity-80"
                  style={{ color: colors.cards, opacity: 0.8 }}
                >
                  Map Search
                </Link>
              </li>
              <li>
                <Link
                  href="/Precon"
                  className="transition-colors text-sm hover:opacity-80"
                  style={{ color: colors.cards, opacity: 0.8 }}
                >
                  Pre-Construction
                </Link>
              </li>
              <li>
                <Link
                  href="/new-listings"
                  className="transition-colors text-sm hover:opacity-80"
                  style={{ color: colors.cards, opacity: 0.8 }}
                >
                  New Listings
                </Link>
              </li>
              <li>
                <Link
                  href="/valuation"
                  className="transition-colors text-sm hover:opacity-80"
                  style={{ color: colors.cards, opacity: 0.8 }}
                >
                  Home Valuation
                </Link>
              </li>
            </ul>
          </div>

          {/* Tools & Resources */}
          <div>
            <h3 className="font-bold mb-4" style={{ color: colors.cards }}>
              TOOLS
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/mortgage-calculator"
                  className="transition-colors text-sm hover:opacity-80"
                  style={{ color: colors.cards, opacity: 0.8 }}
                >
                  Mortgage Calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="transition-colors text-sm hover:opacity-80"
                  style={{ color: colors.cards, opacity: 0.8 }}
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/watched"
                  className="transition-colors text-sm hover:opacity-80"
                  style={{ color: colors.cards, opacity: 0.8 }}
                >
                  Watched Listings
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors text-sm hover:opacity-80"
                  style={{ color: colors.cards, opacity: 0.8 }}
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="font-bold mb-4" style={{ color: colors.cards }}>
              CONTACT
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-sm" style={{ opacity: 0.9 }}>
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold" style={{ color: colors.cards }}>Direct</p>
                  <a href="tel:+14168214200" className="hover:underline">+1 (416) 821-4200</a>
                </div>
              </li>
              <li className="flex items-start space-x-3 text-sm" style={{ opacity: 0.9 }}>
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold" style={{ color: colors.cards }}>Sales</p>
                  <a href="tel:+16475152000" className="hover:underline">+1 (647) 515-2000</a>
                </div>
              </li>
              <li className="flex items-start space-x-3 text-sm" style={{ opacity: 0.9 }}>
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold" style={{ color: colors.cards }}>Email</p>
                  <a href="mailto:info@estate-4u.com" className="hover:underline">info@estate-4u.com</a>
                </div>
              </li>
              <li className="flex items-start space-x-3 text-sm" style={{ opacity: 0.9 }}>
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold" style={{ color: colors.cards }}>Office</p>
                  <p className="leading-tight">100 Milverton Dr #610, Mississauga, ON L5R 4H1</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t pt-8" style={{ borderColor: colors.boarder }}>
          <p
            className="text-sm text-center"
            style={{ color: colors.cards, opacity: 0.8 }}
          >
            © Copyright 2025. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
