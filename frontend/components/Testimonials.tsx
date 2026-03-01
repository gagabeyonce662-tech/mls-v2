"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { colors } from "@/config/design-system";

const testimonials = [
  {
    id: 1,
    name: "M S",
    date: "2025-05-22",
    rating: 5,
    text: "Gunnet's exceptional work ethic and professionalism made a lasting impression throughout our home-buying journey. He collaborated seamlessly with his mortgage and legal teams, ensuring that every detail was flawlessly managed. Together, we explored numerous properties, and his unwavering patience and commitment were instrumental in helping us find our dream home.",
    avatar:
      "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=80&h=80",
  },
  {
    id: 2,
    name: "Moustafa K",
    date: "2025-03-18",
    rating: 5,
    text: "Gunneet's services as a realtor cannot be described with words. My wife and I have recently bought a pre-constructed house with the help of Gunneet, who walked us through the entire process in a very positive and supportive and professional way. He always answered our calls and answered our questions while showing a great deal of pleasure in doing so.",
    avatar:
      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=80&h=80",
  },
  {
    id: 3,
    name: "Yasmeen Kurdi",
    date: "2025-03-18",
    rating: 5,
    text: "As a first-time homebuyer with little experience in the real estate world, I couldn't have asked for a better guide than Gunneet. He went above and beyond to ensure I had all the resources and knowledge needed to make informed decisions. From start to finish, Gunneet was dedicated, reliable, and thorough.",
    avatar:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=80&h=80",
  },
  {
    id: 4,
    name: "Vivek Soundararajan",
    date: "2025-02-21",
    rating: 5,
    text: "Guneet is very knowledgeable and a positive relator to work with. He goes above and beyond to help his clients.",
    avatar:
      "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=80&h=80",
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  return (
    <section
      className="py-16 text-white"
      style={{ backgroundColor: colors.primary }}
    >
      <div className="container mx-auto px-4">
        {/* Google Rating Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=110&h=35"
              alt="Google"
              width={110}
              height={35}
              className="mr-4"
            />
          </div>
          <div className="flex items-center justify-center mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-6 h-6 fill-current"
                style={{ color: colors.icon }}
              />
            ))}
          </div>
          <div className="text-2xl font-bold mb-2">EXCELLENT</div>
          <div style={{ color: colors.body }}>
            Based on <strong>53 reviews</strong>
          </div>
        </div>

        {/* Testimonials Slider */}
        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <div
                    className="rounded-lg p-8"
                    style={{ backgroundColor: colors.icon }}
                  >
                    <div className="flex items-center mb-4">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        width={60}
                        height={60}
                        className="rounded-full mr-4"
                      />
                      <div>
                        <h4
                          className="font-semibold text-lg"
                          style={{ color: colors.heading }}
                        >
                          {testimonial.name}
                        </h4>
                        <p className="text-sm" style={{ color: colors.body }}>
                          {testimonial.date}
                        </p>
                      </div>
                      <div className="ml-auto flex">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-current"
                            style={{ color: colors.icon }}
                          />
                        ))}
                      </div>
                    </div>
                    <p
                      className="leading-relaxed"
                      style={{ color: colors.body }}
                    >
                      {testimonial.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center mt-8 space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              className="bg-transparent text-white hover:text-black"
              style={{ borderColor: colors.cards }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="bg-transparent text-white hover:text-black"
              style={{ borderColor: colors.cards }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    index === currentIndex ? colors.cards : colors.body,
                }}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
