"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { colors } from "@/config/design-system";
import { Calculator, DollarSign, BarChart3, TrendingUp, Home } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const tools = [
    {
        id: "mortgage",
        name: "Mortgage Calculator",
        description: "Calculate your monthly payments and find out how much house you can afford.",
        icon: <Calculator className="w-8 h-8" />,
        href: "/mortgage-calculator",
        color: "#2563EB"
    },
    {
        id: "valuation",
        name: "Home Valuation",
        description: "Get a free estimate of your home's value in today's market.",
        icon: <Home className="w-8 h-8" />,
        href: "/valuation",
        color: "#1a2f5a"
    },
    {
        id: "trends",
        name: "Market Trends",
        description: "Stay updated with the latest real estate market data and trends in your area.",
        icon: <TrendingUp className="w-8 h-8" />,
        href: "/trends",
        color: "#0C1536"
    }
];

export default function ToolsPage() {
    return (
        <div className="min-h-screen bg-ds-card">
            <Header />

            <main className="pt-24 pb-20">
                <Container>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h1
                                className="text-4xl md:text-5xl font-bold mb-6 font-inter"
                                style={{ color: colors.heading }}
                            >
                                Real Estate Tools & Resources
                            </h1>
                            <p
                                className="text-lg text-ds-body max-w-2xl mx-auto font-inter"
                            >
                                Everything you need to navigate your home buying or selling journey with confidence and data-driven insights.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {tools.map((tool, index) => (
                                <motion.div
                                    key={tool.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link href={tool.href} className="block group h-full">
                                        <div className="bg-white p-8 rounded-3xl border border-ds-card-border shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col">
                                            <div
                                                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-300"
                                                style={{ backgroundColor: tool.color }}
                                            >
                                                {tool.icon}
                                            </div>
                                            <h3 className="text-2xl font-bold mb-4 font-inter" style={{ color: colors.heading }}>
                                                {tool.name}
                                            </h3>
                                            <p className="text-ds-body mb-8 font-inter leading-relaxed flex-grow">
                                                {tool.description}
                                            </p>
                                            <div
                                                className="flex items-center font-bold text-sm tracking-widest uppercase mt-auto"
                                                style={{ color: tool.color }}
                                            >
                                                Explore Tool
                                                <span className="ml-2 group-hover:translate-x-2 transition-transform duration-300">→</span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </Container>
            </main>

            <Footer />
        </div>
    );
}
