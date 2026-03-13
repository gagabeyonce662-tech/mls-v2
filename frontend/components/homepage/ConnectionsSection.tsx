"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Scale,
  Wrench,
  Landmark,
  ClipboardCheck,
  Zap,
  Layout,
  ExternalLink,
} from "lucide-react";
import { colors } from "@/config/design-system";
import Container from "@/components/Container";

const connections = [
  {
    id: 1,
    name: "Legal Partners",
    role: "Attorneys",
    description: "Expert real estate lawyers to ensure smooth title transfers and legal compliance.",
    icon: Scale,
    color: "from-blue-500/10 to-indigo-500/10",
    iconColor: "text-blue-600",
  },
  {
    id: 2,
    name: "Financial Experts",
    role: "Mortgage Brokers",
    description: "Get the best rates and personalized financing solutions for your dream home.",
    icon: Landmark,
    color: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-600",
  },
  {
    id: 3,
    name: "Property Guard",
    role: "Home Inspectors",
    description: "Detailed inspections to identify potential issues before you make an offer.",
    icon: ClipboardCheck,
    color: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-600",
  },
  {
    id: 4,
    name: "Maintenance Pros",
    role: "Plumbers",
    description: "Trusted plumbing specialists for renovations, repairs, and emergency services.",
    icon: Wrench,
    color: "from-sky-500/10 to-cyan-500/10",
    iconColor: "text-sky-600",
  },
  {
    id: 5,
    name: "System Specialists",
    role: "Electricians",
    description: "Certified electricians for wiring, lighting, and electrical system upgrades.",
    icon: Zap,
    color: "from-purple-500/10 to-pink-500/10",
    iconColor: "text-purple-600",
  },
  {
    id: 6,
    name: "Style Visionaries",
    role: "Interior Designers",
    description: "Transform your new space with expert design and staging consultations.",
    icon: Layout,
    color: "from-rose-500/10 to-red-500/10",
    iconColor: "text-rose-600",
  },
];

const ConnectionsSection = () => {
  return (
    <section className="relative pt-10 pb-20 overflow-hidden bg-white">

      <Container className="relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-sm font-bold tracking-wider uppercase mb-3" style={{ color: colors.primary }}>
              Professional Network
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-gray-900 font-inter">
              Trusted Connections for Your Journey
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
              We connect you with top-tier professionals to ensure every aspect of your real estate experience is seamless, secure, and exceptional.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative p-8 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
            >
              {/* Gradient background hover effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-white shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className={`w-7 h-7 ${item.iconColor}`} />
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-1">
                    {item.name}
                  </h4>
                  <p className="text-xl font-bold text-gray-900">
                    {item.role}
                  </p>
                </div>
                
                <p className="text-gray-600 mb-6 line-clamp-2 text-sm leading-relaxed">
                  {item.description}
                </p>
                
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 p-1 px-4 rounded-full bg-primary/5 border border-primary/10 text-sm font-medium text-gray-600">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Over 50+ vetted industry professionals in our direct network</span>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};

export default ConnectionsSection;
