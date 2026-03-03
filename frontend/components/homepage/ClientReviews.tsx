"use client";

import React from "react";
import { Star, Quote, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const googleReviewsUrl = "https://share.google/6vyjc5to83rV9p9h8";

const reviews = [
  {
    id: 1,
    name: "Asjad Asghar",
    location: "Local Guide",
    rating: 5,
    text: "My wife and I had the pleasure of working with Gunneet Singh for the purchase of our first home and it was an amazing experience. He truly went above and beyond with everything and greatly helped us throughout the process. He was available day and night and answered all our questions thoroughly and expertly. I highly recommend working with Gunneet if anyone is in the market as he is a great gentleman to work with.",
    avatar: "https://i.pravatar.cc/150?u=asjad",
  },
  {
    id: 2,
    name: "Shuja ud-din",
    location: "First-time Buyer",
    rating: 5,
    text: "Purchasing a first home is never easy, but having someone like Gunneet by your side makes the journey significantly smoother. His professionalism, patience, and positive attitude helped ease the entire process. He addressed our countless questions with genuine care and always with a smile. I highly recommend Gunneet — he is one of the most sincere and dedicated agents.",
    avatar: "https://i.pravatar.cc/150?u=shuja",
  },
  {
    id: 3,
    name: "Rehan Azeem",
    location: "Local Guide",
    rating: 5,
    text: "Guneet made the whole selling process way easier than I thought it would be. He explained everything clearly, was always available to answer my questions, and handled all the details with a lot of care and professionalism. His calm, reliable approach gave me a ton of confidence, and the whole experience felt smooth from start to finish.",
    avatar: "https://i.pravatar.cc/150?u=rehan",
  },
  {
    id: 4,
    name: "Shraddha Parmar",
    location: "Local Guide",
    rating: 5,
    text: "We had an amazing experience working with Guneetji. From start to finish, they made the process of buying our store absolutely seamless and hassle-free. Their knowledge, professionalism, and attention to detail gave us confidence every step of the way. What really stood out was how they went above and beyond—answering our endless questions and guiding us through paperwork.",
    avatar: "https://i.pravatar.cc/150?u=shraddha",
  },
  {
    id: 5,
    name: "Moustafa K",
    location: "Local Guide",
    rating: 5,
    text: "Gunneet is a gem among gems, especially for first time home buyers. In a market that's shifty, his services and guidance were the best tool to have to navigate through a smooth first home buyer process. Meticulously searching for resale and preconstruction builds. If one wants to have the pleasure of enjoying their home buying journey with complete relaxation, there is no better asset than Gunneet.",
    avatar: "https://i.pravatar.cc/150?u=moustafa",
  },
  {
    id: 6,
    name: "Sameera Rehan",
    location: "Home Seller",
    rating: 5,
    text: "I have pleasure of working with Guneet and I can confidently say that the experience was outstanding. From our very first meeting, Guneet made the entire home-selling process smooth and stress-free. Guneet was incredibly responsive and knowledgeable. What impressed me the most was his attention to detail and personalized approach.",
    avatar: "https://i.pravatar.cc/150?u=sameera",
  },
  {
    id: 7,
    name: "Texim Gamer JD",
    location: "Home Buyer",
    rating: 5,
    text: "Great service provided by Gurneet from Estate4u. She was very thorough with the market insight and guided us throughout the home buying process. I would recommend her with complete confidence as she is one of the best in the market.",
    avatar: "https://i.pravatar.cc/150?u=texim",
  },
  {
    id: 8,
    name: "Yasmeen Kurdi",
    location: "First-time Buyer",
    rating: 5,
    text: "As a first-time homebuyer with little experience in the real estate world, I couldn’t have asked for a better guide than Gunneet. He went above and beyond to ensure I had all the resources and knowledge needed to make informed decisions. Dedicated, reliable, and thorough, making the entire process seamless and stress-free.",
    avatar: "https://i.pravatar.cc/150?u=yasmeen",
  },
];

function ReviewCard({ review, index }: { review: any, index: number }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const exceedsClamping = review.text.length > 150;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      viewport={{ once: true }}
      className={`w-[280px] bg-white rounded-2xl p-5 border border-ds-card-border shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group cursor-pointer h-fit min-h-full`}
      onClick={() => window.open(googleReviewsUrl, '_blank')}
    >
      <div className="mb-4 flex justify-between items-start">
        <div className="flex gap-0.5">
          {[...Array(review.rating)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <Quote className="w-5 h-5 text-ds-primary/10 group-hover:text-ds-primary/20 transition-colors" />
      </div>

      <div className="flex-grow">
        <p className={`text-xs text-ds-body leading-relaxed mb-2 italic ${!isExpanded ? 'line-clamp-4' : ''}`}>
          "{review.text}"
        </p>

        {exceedsClamping && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-[10px] font-bold text-ds-primary flex items-center gap-1 hover:underline mb-4"
          >
            {isExpanded ? (
              <>Show Less <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>Read More <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-gray-50 mt-auto">
        <div className="relative">
          <Image
            src={review.avatar}
            alt={review.name}
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg object-cover ring-1 ring-transparent group-hover:ring-ds-primary/10 transition-all"
          />
          <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-xs">
            <svg className="w-2 h-2 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-ds-heading font-bold text-xs">{review.name}</h3>
          <p className="text-[8px] text-ds-body uppercase font-bold tracking-widest opacity-60">
            {review.location}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function ClientReviews() {
  return (
    <section className="py-12 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-100">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-[9px] font-bold text-teal-700 uppercase tracking-widest">Real Stories</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-ds-heading font-inter tracking-tight">
              What Our Clients Say
            </h2>
          </div>
          <Link
            href={googleReviewsUrl}
            target="_blank"
            className="flex items-center gap-1.5 text-ds-primary text-sm font-bold hover:underline group"
          >
            20+ Google Reviews
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {reviews.map((review, index) => (
            <ReviewCard key={review.id} review={review} index={index} />
          ))}
        </div>

        {/* 🏢 Trust Indicator */}
        <div className="mt-6 flex items-center justify-center gap-4 border-t border-gray-100 pt-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-ds-heading font-inter">4.9/5</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>
          <div className="w-px h-4 bg-gray-200" />
          <p className="text-[10px] text-ds-body font-medium uppercase tracking-wider">
            Verified by Google Business Profile
          </p>
        </div>
      </div>

    </section>
  );
}


