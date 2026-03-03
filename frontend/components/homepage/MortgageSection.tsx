"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calculator, ArrowRight, DollarSign, Wallet, Percent } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { colors } from "@/config/design-system";

export default function MortgageCalculatorSection() {
  const [amount, setAmount] = useState(650000);
  const [downPercent, setDownPercent] = useState(20);
  const [monthly, setMonthly] = useState(0);

  // Simplified calculation for immediate visual feedback
  useEffect(() => {
    const rate = 5.25 / 100 / 12;
    const term = 25 * 12;
    const principal = amount * (1 - downPercent / 100);
    const m = (principal * rate) / (1 - Math.pow(1 + rate, -term));
    setMonthly(Math.round(m));
  }, [amount, downPercent]);

  return (
    <section className="relative py-16 overflow-hidden rounded-[2.5rem] my-8 mx-4 lg:mx-8">
      {/* 🎭 Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            background: `radial-gradient(circle at 100% 0%, ${colors.accent}15 0%, transparent 40%), 
                         radial-gradient(circle at 0% 100%, ${colors.primary} 0%, #0a1128 100%)`
          }}
        />
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-ds-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* 📝 Left Content: Storytelling & Value Prop */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Fast Calculations</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight font-inter">
              Your Dream Home <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-100">
                Is More Affordable
              </span>
            </h2>

            <p className="text-base text-white/60 leading-relaxed max-w-md font-inter">
              Visualize your future with precision. Tailored interest rates based on current market data.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/mortgage-calculator">
                <button
                  className="group px-6 py-3 bg-white text-ds-primary rounded-xl font-bold text-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/20"
                >
                  Start Calculating
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/tools">
                <button className="px-6 py-3 bg-transparent text-white/80 border border-white/20 rounded-xl font-bold text-sm transition-colors hover:bg-white/5 font-inter">
                  Explore Tools
                </button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="pt-4 flex items-center gap-3 text-white/40">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border border-[#0a1128] bg-gray-600 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" className="w-full h-full object-cover grayscale opacity-50" />
                  </div>
                ))}
              </div>
              <span className="text-xs font-medium italic">Used by 12k+ homeowners</span>
            </div>
          </motion.div>

          {/* 🧮 Right Content: Interactive Mini-Calculator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex justify-center lg:justify-end"
          >
            <div
              className="relative w-full max-w-[360px] p-6 lg:p-8 rounded-[2rem] border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col group"
              style={{ background: 'rgba(255, 255, 255, 0.03)' }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1 font-inter tracking-tight">Mini Calculator</h3>
                <p className="text-white/40 text-xs">Based on 5.25% fixed interest</p>
              </div>

              <div className="space-y-6">
                {/* Home Amount Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-white/60 font-semibold uppercase tracking-wider text-[9px]">Price</label>
                    <span className="text-white font-bold font-inter">${amount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max="2000000"
                    step="10000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full accent-blue-400 h-1 bg-white/10 rounded-full cursor-pointer appearance-none"
                  />
                </div>

                {/* Down Payment Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-white/60 font-semibold uppercase tracking-wider text-[9px]">Down Payment</label>
                    <span className="text-white font-bold font-inter">{downPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={downPercent}
                    onChange={(e) => setDownPercent(Number(e.target.value))}
                    className="w-full accent-blue-400 h-1 bg-white/10 rounded-full cursor-pointer appearance-none"
                  />
                </div>

                {/* Live Result Display */}
                <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-400/20 mt-2 text-center">
                  <span className="text-[9px] font-bold text-blue-300 uppercase tracking-widest mb-1.5 block">Monthly Estimate</span>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={monthly}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-4xl font-black text-white"
                    >
                      ${monthly.toLocaleString()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <Link href="/mortgage-calculator" className="text-xs font-bold text-white/60 hover:text-white transition-colors underline underline-offset-4 decoration-blue-400/50">
                  Full Breakdown
                </Link>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* 🏙️ Subtle Building Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-32 opacity-[0.03] pointer-events-none select-none overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"
          alt="Architectural detail"
          fill
          className="object-cover object-bottom"
        />
      </div>
    </section>
  );
}

