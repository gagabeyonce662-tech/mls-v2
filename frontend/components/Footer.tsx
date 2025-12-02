"use client";

import { HomeIcon, Facebook, Instagram, Linkedin, Youtube, Twitter } from "lucide-react";
import Link from "next/link";
import { colors } from "@/config/design-system";

const Footer = () => {
  return (
    <footer style={{ backgroundColor: colors.primary, color: colors.cards }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.cards }}>
                <HomeIcon className="w-5 h-5" style={{ color: colors.primary }} />
              </div>
              <span className="text-ds-h5 font-inter">LOGOSIPSUM</span>
            </div>
            <p className="text-ds-body-regular leading-relaxed mb-6 font-inter" style={{ color: colors.cards, opacity: 0.8 }}>
              LogoIpsum is a cutting-edge property and real estate discovery portal for finding
              residential & commercial properties. Start your property searching journey with
              us, powered by an intuitive technology platform with a team of dedicated
              professionals at your service.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80" style={{ backgroundColor: `${colors.cards}20`, color: colors.cards }}>
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80" style={{ backgroundColor: `${colors.cards}20`, color: colors.cards }}>
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80" style={{ backgroundColor: `${colors.cards}20`, color: colors.cards }}>
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80" style={{ backgroundColor: `${colors.cards}20`, color: colors.cards }}>
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-ds-text mb-4 font-inter" style={{ color: colors.cards }}>COMPANY</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="transition-colors text-sm hover:opacity-80" style={{ color: colors.cards, opacity: 0.8 }}>About</Link></li>
              <li><Link href="/pricing" className="transition-colors text-sm hover:opacity-80" style={{ color: colors.cards, opacity: 0.8 }}>Pricing</Link></li>
              <li><Link href="/portfolio" className="transition-colors text-sm hover:opacity-80" style={{ color: colors.cards, opacity: 0.8 }}>Portfolio</Link></li>
              <li><Link href="/feedback" className="transition-colors text-sm hover:opacity-80" style={{ color: colors.cards, opacity: 0.8 }}>Feedback</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold mb-4" style={{ color: colors.cards }}>SUPPORT</h3>
            <ul className="space-y-3">
              <li><Link href="/faqs" className="transition-colors text-sm hover:opacity-80" style={{ color: colors.cards, opacity: 0.8 }}>FAQs</Link></li>
              <li><Link href="/features" className="transition-colors text-sm hover:opacity-80" style={{ color: colors.cards, opacity: 0.8 }}>Features</Link></li>
              <li><Link href="/contact" className="transition-colors text-sm hover:opacity-80" style={{ color: colors.cards, opacity: 0.8 }}>Contact us</Link></li>
            </ul>
          </div>

          {/* Download App */}
          <div>
            <h3 className="font-bold mb-4" style={{ color: colors.cards }}>DOWNLOAD APP</h3>
            <div className="space-y-3">
              <a href="#" className="block">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Get it on Google Play"
                  className="h-10"
                />
              </a>
              <a href="#" className="block">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                  alt="Download on the App Store"
                  className="h-10"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t pt-8" style={{ borderColor: colors.boarder }}>
          <p className="text-sm text-center" style={{ color: colors.cards, opacity: 0.8 }}>
            © Copyright 2025. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
