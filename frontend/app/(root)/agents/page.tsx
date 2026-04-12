"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { Users, Star, Award, ShieldCheck, Mail, Phone, ArrowRight } from "lucide-react";
import { colors } from "@/config/design-system";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function AgentsPage() {
  const agents = [
    {
      name: "Manoj Kumar",
      title: "Real Estate Broker",
      image: "https://estate-4u.com/wp-content/uploads/2024/06/manoj-portrait.jpg", // Placeholder or real
      specialty: "Residential & Pre-Construction",
      exp: "15+ Years"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 pt-32 pb-20">
        <Container>
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16 space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-ds-heading tracking-tight">
                Our Expert Team
              </h1>
              <p className="text-xl text-ds-body max-w-2xl mx-auto font-inter">
                Meet the professionals dedicated to helping you find your dream property and maximize your investments.
              </p>
            </div>

            {/* Main Agent Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
              {agents.map((agent, i) => (
                <div key={i} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group">
                  <div className="aspect-[4/5] relative overflow-hidden bg-gray-100">
                     <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <Users className="w-20 h-20 opacity-20" />
                     </div>
                     {/* Replace with real image if available */}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-8 space-y-4 text-center">
                    <div>
                      <h3 className="text-2xl font-bold text-ds-heading">{agent.name}</h3>
                      <p className="text-ds-primary font-bold text-sm uppercase tracking-widest">{agent.title}</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                    </div>
                    <p className="text-sm text-ds-body font-inter">{agent.specialty}</p>
                    <div className="pt-4 flex items-center justify-center gap-4">
                        <Button variant="outline" className="rounded-full w-10 h-10 p-0">
                           <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" className="rounded-full w-10 h-10 p-0">
                           <Mail className="w-4 h-4" />
                        </Button>
                        <Button className="rounded-full px-6 bg-ds-primary">
                           View Profile
                        </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Why Us */}
            <div className="grid md:grid-cols-3 gap-12 pt-12 border-t border-gray-200">
                <div className="space-y-4 text-center md:text-left">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto md:mx-0">
                        <Award className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-lg">Top 1% Performers</h4>
                    <p className="text-sm text-ds-body leading-relaxed font-inter">Our team consistently ranks among the highest performing real estate professionals in the GTA.</p>
                </div>
                <div className="space-y-4 text-center md:text-left">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 mx-auto md:mx-0">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-lg">Fiduciary Duty</h4>
                    <p className="text-sm text-ds-body leading-relaxed font-inter">We prioritize your interests above all else, ensuring transparency throughout every transaction.</p>
                </div>
                <div className="space-y-4 text-center md:text-left">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mx-auto md:mx-0">
                        <Star className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-lg">Local Experts</h4>
                    <p className="text-sm text-ds-body leading-relaxed font-inter">Deep knowledge of local zoning, neighborhood trends, and school rankings in every city we serve.</p>
                </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
