"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, User, Mail, Phone, ArrowRight, MessageSquare, CheckCircle2, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { colors } from "@/config/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { submitPropertyInquiry } from "@/lib/api";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  contact: z.string().min(10, "Please enter a valid contact number"),
});

type FormData = z.infer<typeof formSchema>;

const containerVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0, y: 20 },
  visible: { 
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 300,
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: { 
    scale: 0.8,
    opacity: 0,
    y: 20,
    transition: { ease: "easeOut", duration: 0.2 }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const splitFullName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
};

export const LeadCaptureWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { firstName, lastName } = splitFullName(data.name);

      await submitPropertyInquiry({
        first_name: firstName,
        last_name: lastName,
        email: data.email,
        phone: data.contact,
        intent: "explore",
        message: "Homepage lead capture widget submission.",
        page_url: typeof window !== "undefined" ? window.location.href : "",
      });

      setIsSuccess(true);
      toast.success("Details captured successfully!");
      reset();
      
      // Reset success state and close after a delay
      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => setIsSuccess(false), 500);
      }, 3000);

    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: isOpen ? 100 : 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20 }}
        whileHover={{ scale: 1.05, x: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-0 bottom-0 h-fit my-auto z-50 flex flex-col items-center gap-3 px-3 py-10 rounded-l-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-white font-medium overflow-hidden group"
        style={{ 
          background: `linear-gradient(135deg, ${colors.primary} 0%, #2a4a8e 100%)`,
        }}
        aria-label="Connect with us"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <MessageSquare className="w-6 h-6 mb-2" />
        <span className="vertical-text tracking-[0.2em] uppercase text-[10px] font-bold">Connect</span>
        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
      </motion.button>


      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-6 bottom-24 w-[320px] h-auto max-h-[calc(100vh-120px)] bg-white shadow-[0_20px_70px_rgba(0,0,0,0.15)] z-[90] flex flex-col border border-gray-100 rounded-[2rem] overflow-hidden"
          >
            {/* Success Overlay */}
            <AnimatePresence>
              {isSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 z-[80] bg-white/95 flex flex-col items-center justify-center p-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  >
                    <CheckCircle2 className="w-24 h-24 text-green-500 mb-6" />
                  </motion.div>
                  <h3 className="text-3xl font-bold mb-4" style={{ color: colors.primary }}>Thank You!</h3>
                  <p className="text-gray-600 max-w-sm">
                    Your details have been securely synced. A professional will reach out to you shortly.
                  </p>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-5"
                  >
                    <Sparkles className="w-64 h-64" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="p-5 pt-6 flex items-center justify-between">
              <motion.div variants={itemVariants}>
                <h3 className="text-xl font-bold tracking-tight" style={{ color: colors.primary }}>
                  Explore Beyond <span className="text-blue-500">.</span>
                </h3>
                <p className="text-gray-400 mt-0.5 text-[11px] font-medium leading-none">
                  Get exclusive property insights.
                </p>
              </motion.div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all hover:rotate-90 duration-300"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-1">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {[
                  { id: "name", label: "Full Name", icon: User, placeholder: "John Doe" },
                  { id: "email", label: "Email Address", icon: Mail, placeholder: "john@example.com", type: "email" },
                  { id: "contact", label: "Phone Number", icon: Phone, placeholder: "+1 (555) 123-4567" }
                ].map((field) => (
                  <motion.div key={field.id} variants={itemVariants} className="group">
                    <label className="text-[10px] uppercase tracking-wider font-bold mb-2 block opacity-60 transition-opacity group-focus-within:opacity-100" style={{ color: colors.primary }}>
                      <field.icon className="w-2.5 h-2.5 inline-block mr-1.5 mb-0.5" />
                      {field.label}
                    </label>
                    <div className="relative">
                      <Input
                        {...register(field.id as any)}
                        type={field.type || "text"}
                        placeholder={field.placeholder}
                        className={`h-10 bg-gray-50/50 border-0 border-b-2 rounded-none px-0 text-base transition-all focus:bg-transparent ${
                          errors[field.id as keyof FormData] 
                            ? "border-red-400" 
                            : "border-gray-200 focus:border-blue-500"
                        }`}
                      />
                    </div>
                    {errors[field.id as keyof FormData] && (
                      <p className="text-xs text-red-500 mt-2 font-medium">
                        {errors[field.id as keyof FormData]?.message}
                      </p>
                    )}
                  </motion.div>
                ))}

                <motion.div variants={itemVariants} className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 relative overflow-hidden group"
                    style={{ background: colors.primary }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    {isSubmitting ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        Join the Network
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                      </div>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Footer */}
              <motion.div variants={itemVariants} className="mt-6 pt-4 border-t border-gray-50 text-center">
                <p className="text-[9px] uppercase tracking-tighter text-gray-300 font-bold leading-relaxed px-2">
                  Secure transmission. By submitting you agree to our 
                  <span className="text-gray-500 mx-1">Privacy</span> 
                  and 
                  <span className="text-gray-500 ml-1">Terms</span>.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </>
  );
};

export default LeadCaptureWidget;
