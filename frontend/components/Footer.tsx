'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Youtube, MessageCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export default function Footer() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    agreement: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission
  };

  return (
    <footer className="bg-teal-700 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Logo & Social */}
          <div>
            <Link href="/" className="inline-block mb-6">
              <Image
                src="https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=300&h=197"
                alt="TFN Realty Logo"
                width={200}
                height={130}
                className="brightness-0 invert"
              />
            </Link>
            
            <div className="flex space-x-4">
              <Link
                href="https://www.facebook.com/Estate4uCorp"
                className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </Link>
              <Link
                href="https://www.instagram.com/estate4uprec/"
                className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </Link>
              <Link
                href="https://wa.link/9m5jf2"
                className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </Link>
              <Link
                href="https://www.youtube.com/channel/UC7g87rmbTk4N8v5n4QAGfWw"
                className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Contact Details & Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Details:</h3>
            <div className="space-y-2 mb-8">
              <p>Direct +1 (416) 821-4200</p>
              <p>Sales +1 (647) 515-2000</p>
              <p className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                info@estate-4u.com
              </p>
              <p>
                Address: 71 Villarboit Crescent Unit 2,<br />
                Concord, ON, L4K 4K2
              </p>
            </div>

            <div className="space-y-2">
              <Link href="/" className="block hover:text-orange-400 transition-colors">Home</Link>
              <Link href="/our-listing" className="block hover:text-orange-400 transition-colors">Our Listings</Link>
              <Link href="/services" className="block hover:text-orange-400 transition-colors">Services</Link>
              <Link href="/about" className="block hover:text-orange-400 transition-colors">About</Link>
              <Link href="/contact-us" className="block hover:text-orange-400 transition-colors">Contact Us</Link>
              <Link href="/terms-conditions" className="block hover:text-orange-400 transition-colors">Terms Conditions</Link>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Sign Up To Get Platinum VIP Access</h3>
            <p className="text-sm opacity-90 mb-6">
              Get the newest updates on projects, pricing & floor plans delivered to your inbox
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-white bg-opacity-10 border-white border-opacity-30 text-white placeholder-white placeholder-opacity-70"
                required
              />
              <Input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-white bg-opacity-10 border-white border-opacity-30 text-white placeholder-white placeholder-opacity-70"
                required
              />
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agreement"
                  checked={formData.agreement}
                  onCheckedChange={(checked) => setFormData({...formData, agreement: checked as boolean})}
                  className="border-white border-opacity-30"
                  required
                />
                <label htmlFor="agreement" className="text-sm">
                  By submitting this form I agree to Terms of Use
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3"
              >
                Submit
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-black py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">All Rights Reserved @ Estate 4u</p>
        </div>
      </div>
    </footer>
  );
}