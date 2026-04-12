"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Map as MapIcon, ChevronLeft, Search } from "lucide-react";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ds-primary/5 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ds-primary/10 rounded-full blur-[120px] -z-10 animate-pulse delay-700" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full"
        >
          {/* 404 Visual */}
          <div className="relative mb-8 inline-block">
            <h1 className="text-[12rem] font-black text-ds-heading tracking-tighter opacity-[0.03] select-none leading-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-6 bg-white rounded-[2.5rem] shadow-2xl shadow-ds-primary/10 border border-ds-card-border transform rotate-6 hover:rotate-0 transition-transform duration-500 cursor-default">
                <Search className="w-16 h-16 text-ds-primary" />
              </div>
            </div>
          </div>

          {/* Text Content */}
          <h2 className="text-4xl md:text-5xl font-bold text-ds-heading mb-4 tracking-tight">
            Lost in the Neighborhood?
          </h2>
          <p className="text-lg text-ds-body mb-10 max-w-md mx-auto leading-relaxed">
            The listing or page you&apos;re searching for seems to have moved
            off the market or never existed. Let&apos;s get you back on track.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/" passHref>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-4 bg-ds-primary text-white font-bold rounded-2xl shadow-lg shadow-ds-primary/25 flex items-center justify-center gap-2 transition-all"
              >
                <Home className="w-5 h-5" />
                Return Home
              </motion.button>
            </Link>

            <Link href="/map-search" passHref>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-4 bg-white text-ds-heading font-bold rounded-2xl border border-ds-card-border shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <MapIcon className="w-5 h-5" />
                Explore the Map
              </motion.button>
            </Link>
          </div>

          {/* Subtle Back Link */}
          <button
            onClick={() => window.history.back()}
            className="mt-12 text-ds-body hover:text-ds-primary text-sm font-semibold flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Go back to previous page
          </button>
        </motion.div>
      </main>

      {/* Footer Branding */}
      <footer className="py-8 text-center border-t border-ds-card-border bg-white">
        <p className="text-xs font-bold text-ds-heading tracking-widest uppercase opacity-40">
          MLS Premium Discovery
        </p>
      </footer>
    </div>
  );
}
