"use client";

import Link from "next/link";
import Image from "next/image";
import { HomeIcon } from "lucide-react";
import { colors } from "@/config/design-system";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Visual Side (Left) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-ds-primary relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-ds-accent/20 rounded-full -ml-48 -mb-48 blur-3xl" />

        <Link
          href="/"
          className="flex items-center z-10 transition-transform hover:scale-105"
        >
          <div className="relative h-12 w-48 transition-transform duration-300">
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

        <div className="z-10">
          <h1 className="text-5xl font-bold text-white leading-tight mb-6 font-inter">
            Discover Your <br />
            <span className="text-emerald-300">Dream Home</span> With Ease.
          </h1>
          <p className="text-white/80 text-lg max-w-md leading-relaxed font-inter">
            Join thousands of happy homeowners who found their perfect match
            through our platform. Secure, transparent, and always at your
            service.
          </p>
        </div>

        <div className="z-10 text-white/60 text-sm">
          © 2025 Estate-4u. All rights reserved.
        </div>
      </div>

      {/* Form Side (Right) */}
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50/50">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
