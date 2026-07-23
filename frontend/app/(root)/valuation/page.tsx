"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";

import { colors } from "@/config/design-system";
import {
  Search,
  Home,
  BarChart3,
  FileText,
  Bed,
  Bath,
  Ruler,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Shield,
  Clock,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  MessageSquare,
  ChevronDown,
  Sparkles,
  Target,
  LineChart,
} from "lucide-react";
import { env } from "@/lib/env";
import type {
  ValuationEstimateResponse,
  ValuationLookupPayload,
} from "@/lib/api/valuation";
import { ValuationSearch } from "@/components/valuation/ValuationSearch";
import { ValuationInputForm } from "@/components/valuation/ValuationInputForm";
import { BetaBanner } from "@/components/valuation/BetaBanner";
import { EstimateRangeCard } from "@/components/valuation/EstimateRangeCard";
import { BreakdownPanel } from "@/components/valuation/BreakdownPanel";
import { TrendIndicator } from "@/components/valuation/TrendIndicator";
import { ComparablesGrid } from "@/components/valuation/ComparablesGrid";
import { AgentConnectivity } from "@/components/valuation/AgentConnectivity";
import { submitPropertyInquiry } from "@/lib/api/inquiries";

/* ──────────────────────── hooks ──────────────────────── */

/** Intersection Observer hook — reveals elements on scroll */
function useRevealOnScroll() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/** Simple animated counter */
function AnimatedValue({
  value,
  prefix = "",
}: {
  value: string;
  prefix?: string;
}) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span
      ref={ref}
      className={show ? "animate-count-up inline-block" : "opacity-0"}
    >
      {prefix}
      {value}
    </span>
  );
}

/* ──────────────────────── static data ──────────────────────── */

const priceRanges = [
  {
    label: "Low Estimate",
    value: "$757,000",
    icon: <TrendingDown className="w-5 h-5" />,
    accent: "#f59e0b",
    gradient: "from-amber-500/10 to-amber-500/5",
    description: "Conservative market value",
  },
  {
    label: "Market Value",
    value: "$807,000",
    icon: <Target className="w-5 h-5" />,
    accent: colors.primary,
    gradient: "from-blue-500/10 to-blue-500/5",
    description: "Most likely selling price",
    featured: true,
  },
  {
    label: "High Estimate",
    value: "$905,600",
    icon: <TrendingUp className="w-5 h-5" />,
    accent: "#10b981",
    gradient: "from-emerald-500/10 to-emerald-500/5",
    description: "In a competitive market",
  },
  {
    label: "Quick Sale",
    value: "$720K – $760K",
    icon: <Zap className="w-5 h-5" />,
    accent: "#8b5cf6",
    gradient: "from-violet-500/10 to-violet-500/5",
    description: "For a faster closing",
  },
];

const comparableProperties = [
  {
    name: "Modern Detached Home",
    city: "Toronto, ON",
    price: "$849,000",
    bedrooms: 3,
    bathrooms: 2,
    sqft: "1,850",
    daysAgo: 12,
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
  },
  {
    name: "Semi-Detached in Leaside",
    city: "Mississauga, ON",
    price: "$779,900",
    bedrooms: 4,
    bathrooms: 3,
    sqft: "2,100",
    daysAgo: 8,
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
  },
  {
    name: "Updated Bungalow",
    city: "Oakville, ON",
    price: "$825,000",
    bedrooms: 3,
    bathrooms: 2,
    sqft: "1,600",
    daysAgo: 21,
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80",
  },
];

const steps = [
  {
    icon: <Home className="w-7 h-7" />,
    title: "Enter Your Address",
    description: "Provide your property address and we handle the rest.",
  },
  {
    icon: <LineChart className="w-7 h-7" />,
    title: "AI-Powered Analysis",
    description:
      "Our algorithm compares recent sales, market trends, and local data.",
  },
  {
    icon: <FileText className="w-7 h-7" />,
    title: "Get Your Report",
    description:
      "Receive a detailed valuation report with comparable properties.",
  },
];

const trustStats = [
  {
    icon: <Award className="w-6 h-6" />,
    value: "1,200+",
    label: "Valuations Completed",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    value: "Licensed",
    label: "Certified Appraisers",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    value: "24 hrs",
    label: "Report Delivery",
  },
  {
    icon: <Users className="w-6 h-6" />,
    value: "98%",
    label: "Client Satisfaction",
  },
];

const faqs = [
  {
    q: "How accurate is the AI valuation?",
    a: "Our algorithm analyzes thousands of recent comparable sales, neighbourhood trends, and property features to provide an estimate typically within 3–5% of the professional appraised value.",
  },
  {
    q: "Is this service really free?",
    a: "Yes — the online estimate and initial consultation are completely free with no obligations. A full professional appraisal may involve a fee depending on the property.",
  },
  {
    q: "How long does the report take?",
    a: "The instant online estimate is available immediately. If you request a professional consultation, our certified appraiser will deliver a detailed report within 24 hours.",
  },
  {
    q: "What areas do you cover?",
    a: "We currently cover all major markets across Ontario, including the Greater Toronto Area, Ottawa, Hamilton, and surrounding regions.",
  },
];

/* ──────────────────────── component ──────────────────────── */

export default function HomeValuation() {
  const valuationEngine =
    env.NEXT_PUBLIC_ENABLE_VALUATION_ENGINE === "true";
  const [engineQuery, setEngineQuery] = useState("");
  const [lookupPayload, setLookupPayload] =
    useState<ValuationLookupPayload | null>(null);
  const [estimateResult, setEstimateResult] =
    useState<ValuationEstimateResponse | null>(null);
  const [engineBusy, setEngineBusy] = useState(false);

  const [propertyAddress, setPropertyAddress] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const onLookupResolved = (payload: ValuationLookupPayload) => {
    setLookupPayload(payload);
    setEstimateResult(null);
    if (payload.unparsed_address) {
      setPropertyAddress(payload.unparsed_address);
      setEngineQuery(payload.unparsed_address);
    }
  };

  // Scroll reveal refs for each section
  const howItWorksRef = useRevealOnScroll();
  const valueRangeRef = useRevealOnScroll();
  const comparablesRef = useRevealOnScroll();
  const formRef = useRevealOnScroll();
  const faqRef = useRevealOnScroll();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/);
    if (!firstName) {
      setSubmitError("Please enter your name.");
      setIsSubmitting(false);
      return;
    }
    const propertyDetails = lookupPayload
      ? [
          lookupPayload.property_sub_type,
          lookupPayload.bedrooms_total != null
            ? `${lookupPayload.bedrooms_total} bed`
            : "",
          lookupPayload.bathrooms_total != null
            ? `${lookupPayload.bathrooms_total} bath`
            : "",
          lookupPayload.living_area != null
            ? `${Math.round(lookupPayload.living_area)} sq ft`
            : "",
        ]
          .filter(Boolean)
          .join(" • ")
      : "";

    try {
      await submitPropertyInquiry({
        first_name: firstName,
        last_name: lastNameParts.join(" "),
        email,
        phone: phoneNumber,
        intent: "sell",
        message: [
          `Home evaluation request for ${propertyAddress}.`,
          propertyDetails ? `Property details: ${propertyDetails}.` : "",
          estimateResult
            ? `Preliminary range: ${new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(estimateResult.estimate.low)} to ${new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(estimateResult.estimate.high)}.`
            : "",
          comment.trim(),
        ]
          .filter(Boolean)
          .join(" "),
        preferred_locations: lookupPayload?.city || "",
        property_types: lookupPayload?.property_sub_type || "",
        bedrooms_min: lookupPayload?.bedrooms_total ?? null,
        bathrooms_min: lookupPayload?.bathrooms_total ?? null,
        page_url:
          typeof window !== "undefined" ? window.location.href : "/valuation",
      });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We couldn’t send your evaluation request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fb" }}>
      <Header />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative overflow-hidden min-h-[520px] flex items-center">
        {/* Animated mesh gradient background */}
        <div
          className="absolute inset-0 animate-mesh-gradient"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, #0f172a 25%, #1e293b 50%, ${colors.primary} 75%, #0f172a 100%)`,
          }}
        />

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating gradient orbs */}
          <div
            className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full animate-float opacity-[0.07]"
            style={{
              background: `radial-gradient(circle, ${colors.icon} 0%, transparent 70%)`,
            }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full animate-float opacity-[0.05]"
            style={{
              background: `radial-gradient(circle, #8b5cf6 0%, transparent 70%)`,
              animationDelay: "3s",
            }}
          />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />

          {/* Shimmer sweep */}
          <div className="absolute inset-0 animate-shimmer" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 md:py-28 w-full">
          <div className="max-w-3xl">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 backdrop-blur-sm animate-fadeInUp"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: colors.icon }} />
              AI-Powered Home Valuation
            </div>

            {/* Headline */}
            <h1
              className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-white leading-[1.1] mb-6 animate-fadeInUp"
              style={{ animationDelay: "100ms" }}
            >
              Discover What Your
              <br />
              Home Is{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${colors.icon}, #fbbf24, ${colors.icon})`,
                  backgroundSize: "200% auto",
                }}
              >
                Really Worth
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-lg md:text-xl text-white/60 max-w-xl leading-relaxed mb-10 animate-fadeInUp"
              style={{ animationDelay: "200ms" }}
            >
              Get an instant, data-driven estimate based on recent Canadian
              market trends, comparable sales, and neighbourhood analytics.
            </p>

            {/* Hero search bar — glassmorphism */}
            <div
              className="max-w-2xl animate-fadeInUp"
              style={{ animationDelay: "300ms" }}
            >
              {valuationEngine ? (
                <ValuationSearch
                  value={engineQuery}
                  onChange={setEngineQuery}
                  onLookupResolved={onLookupResolved}
                  onBusyChange={setEngineBusy}
                />
              ) : (
                <div
                  className="flex items-stretch rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <div className="flex-1 flex items-center gap-3 px-5">
                    <MapPin
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: colors.body }}
                    />
                    <input
                      type="text"
                      placeholder="Enter your property address..."
                      value={propertyAddress}
                      onChange={(e) => setPropertyAddress(e.target.value)}
                      className="w-full py-4.5 focus:outline-none text-base bg-transparent"
                      style={{ color: colors.heading }}
                    />
                  </div>
                  <button
                    type="button"
                    className="px-8 py-4 font-semibold flex items-center gap-2 transition-all hover:opacity-90 hover:shadow-lg relative overflow-hidden group"
                    style={{ backgroundColor: colors.icon, color: "#fff" }}
                  >
                    <Search className="w-5 h-5 relative z-10" />
                    <span className="hidden sm:inline relative z-10">
                      Get Estimate
                    </span>
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                  </button>
                </div>
              )}

              {engineBusy ? (
                <p className="mt-3 text-sm text-white/70">Loading…</p>
              ) : null}

              {/* Quick stats under search */}
              <div className="flex items-center gap-6 mt-5 text-white/40 text-sm">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2
                    className="w-3.5 h-3.5"
                    style={{ color: "#10b981" }}
                  />
                  Free instant estimate
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2
                    className="w-3.5 h-3.5"
                    style={{ color: "#10b981" }}
                  />
                  No obligation
                </span>
                <span className="hidden sm:flex items-center gap-1.5">
                  <CheckCircle2
                    className="w-3.5 h-3.5"
                    style={{ color: "#10b981" }}
                  />
                  Results in seconds
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div ref={howItWorksRef} className="reveal-on-scroll">
          <div className="text-center mb-16">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: colors.icon }}
            >
              Simple Process
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ color: colors.heading }}
            >
              How It Works
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Connecting line (desktop) */}
            <div
              className="hidden md:block absolute top-20 left-[20%] right-[20%] h-px"
              style={{ backgroundColor: colors.cardsBoarder }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(90deg, transparent, ${colors.primary}30, transparent)`,
                }}
              />
            </div>

            {steps.map((step, i) => (
              <div
                key={i}
                className="relative text-center group"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div
                  className="relative z-10 p-8 rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-xl"
                  style={{
                    backgroundColor: colors.cards,
                    border: `1px solid ${colors.cardsBoarder}`,
                  }}
                >
                  {/* Step number badge */}
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg"
                    style={{
                      backgroundColor: colors.primary,
                      boxShadow: `0 4px 14px ${colors.primary}40`,
                    }}
                  >
                    {i + 1}
                  </div>

                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}15, ${colors.icon}10)`,
                      color: colors.primary,
                    }}
                  >
                    {step.icon}
                  </div>

                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ color: colors.heading }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: colors.body }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {valuationEngine ? (
        <section
          id="valuation-refine"
          className="max-w-7xl mx-auto px-6 lg:px-8 py-16"
        >
          {lookupPayload ? (
            <ValuationInputForm
              lookup={lookupPayload}
              onResult={setEstimateResult}
              onBusyChange={setEngineBusy}
            />
          ) : (
            <p className="text-center text-sm max-w-xl mx-auto" style={{ color: colors.body }}>
              Search by address, street, or listing number above. We&apos;ll load MLS
              fields so you can refine the estimate before running the model.
            </p>
          )}
        </section>
      ) : null}

      {/* ═══════════════════ ESTIMATED VALUE RANGE ═══════════════════ */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ backgroundColor: colors.cards }}
      >
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(${colors.primary} 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div ref={valueRangeRef} className="reveal-on-scroll">
            <div className="text-center mb-16">
              <p
                className="text-sm font-semibold uppercase tracking-widest mb-3"
                style={{ color: colors.icon }}
              >
                Your Estimate
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold"
                style={{ color: colors.heading }}
              >
                Estimated Value Range
              </h2>
              <p
                className="mt-3 text-lg max-w-xl mx-auto"
                style={{ color: colors.body }}
              >
                Based on recent comparable sales in your area
              </p>
            </div>

            {valuationEngine && estimateResult ? (
              <>
                <BetaBanner />
                {estimateResult.sparse ? (
                  <p
                    className="text-center text-sm mb-8 max-w-2xl mx-auto"
                    style={{ color: colors.body }}
                  >
                    Few closed sales in our database matched this micro-location — we
                    blended active listings where needed. Treat the bracket as
                    indicative only until more sold history is captured.
                  </p>
                ) : null}
                <EstimateRangeCard estimate={estimateResult.estimate} />
                <div className="max-w-3xl mx-auto">
                  <BreakdownPanel rows={estimateResult.breakdown} />
                  <TrendIndicator
                    pct30d={estimateResult.trend.pct_30d}
                    applied={estimateResult.trend.applied}
                  />
                </div>
              </>
            ) : valuationEngine ? (
              <p className="text-center max-w-xl mx-auto" style={{ color: colors.body }}>
                Run <strong>Sigma estimate</strong> after selecting a property to see
                your value range, adjustment breakdown, and neighbourhood momentum.
              </p>
            ) : (
              <>
                {/* Value gauge visualization */}
                <div className="max-w-3xl mx-auto mb-14">
                  <div
                    className="relative h-3 rounded-full overflow-hidden"
                    style={{ backgroundColor: `${colors.primary}10` }}
                  >
                    <div
                      className="absolute left-[25%] right-[25%] h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, #f59e0b, ${colors.primary}, #10b981)`,
                      }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-[3px] border-white shadow-lg animate-pulse-glow"
                      style={{
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: colors.primary,
                      }}
                    />
                  </div>
                  <div
                    className="flex justify-between mt-3 text-xs font-medium"
                    style={{ color: colors.body }}
                  >
                    <span>$700K</span>
                    <span style={{ color: colors.primary, fontWeight: 700 }}>
                      $807,000
                    </span>
                    <span>$950K</span>
                  </div>
                </div>

                <div className="stagger-children revealed grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {priceRanges.map((range, i) => (
                    <div
                      key={i}
                      className={`relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl overflow-hidden group ${
                        range.featured ? "ring-2 ring-offset-2" : ""
                      }`}
                      style={{
                        backgroundColor: "#ffffff",
                        border: `1px solid ${colors.cardsBoarder}`,
                      }}
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
                        style={{ backgroundColor: range.accent }}
                      />
                      {range.featured && (
                        <div
                          className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: `${colors.primary}10`,
                            color: colors.primary,
                          }}
                        >
                          Best Estimate
                        </div>
                      )}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: `${range.accent}14`,
                          color: range.accent,
                        }}
                      >
                        {range.icon}
                      </div>
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: colors.body }}
                      >
                        {range.label}
                      </p>
                      <p
                        className="text-2xl lg:text-3xl font-bold mb-2"
                        style={{ color: colors.heading }}
                      >
                        <AnimatedValue value={range.value} />
                      </p>
                      <p className="text-xs" style={{ color: colors.body }}>
                        {range.description}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════ COMPARABLE PROPERTIES ═══════════════════ */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div ref={comparablesRef} className="reveal-on-scroll">
          <div className="text-center mb-16">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: colors.icon }}
            >
              Market Data
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ color: colors.heading }}
            >
              Comparable Properties
            </h2>
            <p
              className="mt-3 text-lg max-w-xl mx-auto"
              style={{ color: colors.body }}
            >
              Recently sold homes similar to yours in the area
            </p>
          </div>

          {valuationEngine && estimateResult ? (
            <ComparablesGrid comps={estimateResult.comps} />
          ) : valuationEngine ? (
            <p className="text-center text-sm" style={{ color: colors.body }}>
              Comparables from our catalog will appear here after you run an estimate.
            </p>
          ) : (
            <div className="stagger-children revealed grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {comparableProperties.map((property, i) => (
                <div
                  key={i}
                  className="group rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                  style={{
                    backgroundColor: colors.cards,
                    border: `1px solid ${colors.cardsBoarder}`,
                  }}
                >
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={property.image}
                      alt={property.name}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span
                        className="px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md shadow-sm"
                        style={{
                          backgroundColor: "rgba(16, 185, 129, 0.9)",
                          color: "#fff",
                        }}
                      >
                        ✓ Sold
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-md"
                        style={{
                          backgroundColor: "rgba(0,0,0,0.4)",
                          color: "rgba(255,255,255,0.9)",
                        }}
                      >
                        {property.daysAgo}d ago
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <p className="text-white text-xl font-bold drop-shadow-lg">
                        {property.price}
                      </p>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3
                      className="font-bold mb-1"
                      style={{ color: colors.heading }}
                    >
                      {property.name}
                    </h3>
                    <p
                      className="text-xs flex items-center gap-1 mb-4"
                      style={{ color: colors.body }}
                    >
                      <MapPin className="w-3 h-3" />
                      {property.city}
                    </p>
                    <div
                      className="border-t pt-3"
                      style={{ borderColor: colors.cardsBoarder }}
                    >
                      <div
                        className="flex items-center gap-5 text-xs"
                        style={{ color: colors.body }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Bed className="w-3.5 h-3.5" />
                          <span className="font-medium">{property.bedrooms}</span> Beds
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bath className="w-3.5 h-3.5" />
                          <span className="font-medium">{property.bathrooms}</span> Baths
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5" />
                          <span className="font-medium">{property.sqft}</span> sqft
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════ CONSULTATION FORM ═══════════════════ */}
      <section
        className="py-24 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, #0f172a 100%)`,
        }}
      >
        {/* Decorative */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full animate-float opacity-[0.04]"
          style={{
            background: `radial-gradient(circle, ${colors.icon} 0%, transparent 70%)`,
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div ref={formRef} className="reveal-on-scroll">
            {valuationEngine && (
              <div className="mb-12">
                <AgentConnectivity agent={estimateResult?.agent ?? null}>
                  <p className="text-sm text-white/80 leading-relaxed">
                    Prefer a human? Use the consultation form on the right after
                    you&apos;ve reviewed your Sigma estimate.
                  </p>
                </AgentConnectivity>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              {/* Left — Form (glassmorphism) */}
              <div
                className="rounded-3xl p-8 md:p-10 backdrop-blur-sm shadow-2xl"
                style={{
                  backgroundColor: "rgba(255,255,255,0.97)",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                <h2
                  className="text-2xl md:text-3xl font-bold mb-2"
                  style={{ color: colors.heading }}
                >
                  Get a Free Consultation
                </h2>
                <p className="mb-8 text-sm" style={{ color: colors.body }}>
                  Our certified appraisers will provide a detailed report within
                  24 hours.
                </p>

                {submitted ? (
                  <div
                    className="text-center py-16 rounded-2xl"
                    style={{ backgroundColor: `${colors.primary}06` }}
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 animate-count-up"
                      style={{ backgroundColor: "#10b98115" }}
                    >
                      <CheckCircle2
                        className="w-10 h-10"
                        style={{ color: "#10b981" }}
                      />
                    </div>
                    <p
                      className="text-xl font-bold"
                      style={{ color: colors.heading }}
                    >
                      Request Submitted!
                    </p>
                    <p className="text-sm mt-2" style={{ color: colors.body }}>
                      We&apos;ll be in touch within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label
                        className="block text-sm font-semibold mb-2"
                        style={{ color: colors.heading }}
                      >
                        Your Name
                      </label>
                      <input
                        type="text"
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-xl border-2 bg-[#fafbfc] px-4 py-3.5 text-sm focus:border-blue-400 focus:outline-none focus:shadow-sm"
                        style={{ borderColor: colors.cardsBoarder, color: colors.heading }}
                        required
                      />
                    </div>
                    {/* Address */}
                    <div>
                      <label
                        className="block text-sm font-semibold mb-2"
                        style={{ color: colors.heading }}
                      >
                        Property Address
                      </label>
                      <div
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all focus-within:border-blue-400 focus-within:shadow-sm"
                        style={{
                          borderColor: colors.cardsBoarder,
                          backgroundColor: "#fafbfc",
                        }}
                      >
                        <MapPin
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: colors.body }}
                        />
                        <input
                          type="text"
                          placeholder="123 Main Street, Toronto, ON"
                          value={propertyAddress}
                          onChange={(e) => setPropertyAddress(e.target.value)}
                          className="w-full focus:outline-none bg-transparent text-sm"
                          style={{ color: colors.heading }}
                          required
                        />
                      </div>
                    </div>

                    {/* Phone + Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          className="block text-sm font-semibold mb-2"
                          style={{ color: colors.heading }}
                        >
                          Phone Number
                        </label>
                        <div
                          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all focus-within:border-blue-400 focus-within:shadow-sm"
                          style={{
                            borderColor: colors.cardsBoarder,
                            backgroundColor: "#fafbfc",
                          }}
                        >
                          <Phone
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: colors.body }}
                          />
                          <input
                            type="tel"
                            placeholder="(416) 555-0123"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full focus:outline-none bg-transparent text-sm"
                            style={{ color: colors.heading }}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          className="block text-sm font-semibold mb-2"
                          style={{ color: colors.heading }}
                        >
                          Email
                        </label>
                        <div
                          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all focus-within:border-blue-400 focus-within:shadow-sm"
                          style={{
                            borderColor: colors.cardsBoarder,
                            backgroundColor: "#fafbfc",
                          }}
                        >
                          <Mail
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: colors.body }}
                          />
                          <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full focus:outline-none bg-transparent text-sm"
                            style={{ color: colors.heading }}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label
                        className="block text-sm font-semibold mb-2"
                        style={{ color: colors.heading }}
                      >
                        Additional Comments
                      </label>
                      <div
                        className="flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 transition-all focus-within:border-blue-400 focus-within:shadow-sm"
                        style={{
                          borderColor: colors.cardsBoarder,
                          backgroundColor: "#fafbfc",
                        }}
                      >
                        <MessageSquare
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{ color: colors.body }}
                        />
                        <textarea
                          placeholder="Any details about your property..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full focus:outline-none bg-transparent text-sm resize-none"
                          style={{ color: colors.heading }}
                          rows={4}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-xl font-bold text-base transition-all duration-300 hover:shadow-xl hover:scale-[1.01] flex items-center justify-center gap-2 group"
                      style={{ backgroundColor: colors.icon, color: "#fff" }}
                    >
                      {isSubmitting ? "Sending request…" : "Request Free Consultation"}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    {submitError ? (
                      <p className="text-sm font-medium text-red-600" role="alert">
                        {submitError}
                      </p>
                    ) : null}
                  </form>
                )}
              </div>

              {/* Right — Benefits */}
              <div className="space-y-10 lg:pt-4">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                    Why Get a Professional Valuation?
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    Online estimates are a great start, but a professional
                    valuation considers renovations, unique features, and
                    hyper-local conditions that algorithms can miss.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    "Detailed neighbourhood-level analysis",
                    "Renovation & improvement value impact",
                    "Current market demand assessment",
                    "Local pricing strategy recommendations",
                    "No obligation — completely free",
                  ].map((benefit, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#10b98120" }}
                      >
                        <CheckCircle2
                          className="w-3.5 h-3.5"
                          style={{ color: "#10b981" }}
                        />
                      </div>
                      <span className="text-sm font-medium text-white/80">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Trust indicators */}
                <div className="grid grid-cols-2 gap-4">
                  {trustStats.map((stat, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-4 rounded-xl backdrop-blur-sm"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${colors.icon}20`,
                          color: colors.icon,
                        }}
                      >
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">
                          {stat.value}
                        </p>
                        <p className="text-xs text-white/50 leading-tight">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FAQ ═══════════════════ */}
      <section className="max-w-3xl mx-auto px-6 lg:px-8 py-24">
        <div ref={faqRef} className="reveal-on-scroll">
          <div className="text-center mb-14">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: colors.icon }}
            >
              Questions?
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ color: colors.heading }}
            >
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  backgroundColor: colors.cards,
                  border: `1px solid ${colors.cardsBoarder}`,
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-black/[0.02]"
                >
                  <span
                    className="font-semibold text-sm pr-4"
                    style={{ color: colors.heading }}
                  >
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                    style={{ color: colors.body }}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: openFaq === i ? "200px" : "0",
                    opacity: openFaq === i ? 1 : 0,
                  }}
                >
                  <p
                    className="px-5 pb-5 text-sm leading-relaxed"
                    style={{ color: colors.body }}
                  >
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
