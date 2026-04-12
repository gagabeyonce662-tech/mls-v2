"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { colors } from "@/config/design-system";
import { Phone, Mail, MapPin, MessageSquare, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 pt-32 pb-20">
        <Container>
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16 space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-ds-heading tracking-tight">
                Get in Touch
              </h1>
              <p className="text-lg text-ds-body max-w-2xl mx-auto">
                Have questions about a property or want to discuss your next real estate investment? 
                Our team is here to help you navigate the market.
              </p>
            </div>

            <div className="grid md:grid-cols-5 gap-12">
              {/* Contact Info */}
              <div className="md:col-span-2 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border flex items-center justify-center text-ds-primary shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-ds-heading">Phone</h3>
                      <p className="text-ds-body text-sm">+1 (416) 821-4200 (Direct)</p>
                      <p className="text-ds-body text-sm">+1 (647) 515-2000 (Sales)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border flex items-center justify-center text-ds-primary shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-ds-heading">Email</h3>
                      <p className="text-ds-body text-sm">info@estate-4u.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border flex items-center justify-center text-ds-primary shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-ds-heading">Office</h3>
                      <p className="text-ds-body text-sm">
                        100 Milverton Dr #610,<br />
                        Mississauga, ON L5R 4H1
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-[2rem] bg-indigo-900 text-white space-y-4">
                  <h4 className="font-bold text-xl">Business Hours</h4>
                  <div className="space-y-2 opacity-80 text-sm">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span>10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="md:col-span-3 bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-10">
                <form className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-ds-body tracking-wider">First Name</label>
                      <Input placeholder="John" className="bg-gray-50 border-0 h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-ds-body tracking-wider">Last Name</label>
                      <Input placeholder="Doe" className="bg-gray-50 border-0 h-12 rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-ds-body tracking-wider">Email Address</label>
                    <Input type="email" placeholder="john@example.com" className="bg-gray-50 border-0 h-12 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-ds-body tracking-wider">Message</label>
                    <Textarea 
                      placeholder="How can we help you?" 
                      className="bg-gray-50 border-0 min-h-[150px] rounded-xl pt-4" 
                    />
                  </div>

                  <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-indigo-200" style={{ backgroundColor: colors.primary }}>
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
