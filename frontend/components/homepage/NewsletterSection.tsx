"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { config } from "@/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    // handle subscription (API call, etc.)
    console.log(`Subscribed: ${email}`);
    setEmail("");
  };

  return (
   <section className="py-16 text-center" style={{ backgroundColor: "#f7f7f7" }}>

      <div className="max-w-xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-4"
        >
          Stay Updated with {config.name}
        </motion.h2>
        <p className="mb-6 text-gray-100">
          Get the latest listings, insights, and market trends delivered to your inbox.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Input
            type="email"
            placeholder="Enter your email"
            className="rounded-xl text-gray-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            className="rounded-xl px-6"
            style={{ backgroundColor: config.secondaryColor }}
            onClick={handleSubscribe}
          >
            Subscribe
          </Button>
        </div>
      </div>
    </section>
  );
}
