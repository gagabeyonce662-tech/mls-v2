"use client";

import { FormEvent, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { colors } from "@/config/design-system";
import { Phone, Mail, MapPin, MessageSquare, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitPropertyInquiry } from "@/lib/api";

export default function ContactPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitState("idle");

    try {
      await submitPropertyInquiry({
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        email: email.trim(),
        message: message.trim(),
        intent: "explore",
        page_url: window.location.href,
      });

      setFirstName("");
      setLastName("");
      setEmail("");
      setMessage("");
      setSubmitState("success");
    } catch (error) {
      console.error("Unable to submit contact inquiry:", error);
      setSubmitState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="contact-first-name" className="text-xs font-bold uppercase text-ds-body tracking-wider">First Name</label>
                      <Input
                        id="contact-first-name"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        placeholder="John"
                        autoComplete="given-name"
                        required
                        className="bg-gray-50 border-0 h-12 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="contact-last-name" className="text-xs font-bold uppercase text-ds-body tracking-wider">Last Name</label>
                      <Input
                        id="contact-last-name"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        placeholder="Doe"
                        autoComplete="family-name"
                        className="bg-gray-50 border-0 h-12 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contact-email" className="text-xs font-bold uppercase text-ds-body tracking-wider">Email Address</label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="john@example.com"
                      autoComplete="email"
                      required
                      className="bg-gray-50 border-0 h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contact-message" className="text-xs font-bold uppercase text-ds-body tracking-wider">Message</label>
                    <Textarea 
                      id="contact-message"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="How can we help you?" 
                      required
                      className="bg-gray-50 border-0 min-h-[150px] rounded-xl pt-4" 
                    />
                  </div>

                  {submitState === "success" && (
                    <p role="status" className="text-sm font-medium text-green-700">
                      Thanks — your message has been received. We’ll be in touch soon.
                    </p>
                  )}
                  {submitState === "error" && (
                    <p role="alert" className="text-sm font-medium text-red-700">
                      We couldn’t send your message. Please try again or email us directly.
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-indigo-200"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {isSubmitting ? "Sending…" : "Send Message"}
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
