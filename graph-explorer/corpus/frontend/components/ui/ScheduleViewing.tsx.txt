"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface ScheduleViewingProps {
  agentName?: string;
  contactNumber?: string;
  email?: string;
  listingId?: string;
  address?: string;
}

export function ScheduleViewing({
  agentName = "Harsh Srivastav",
  contactNumber = "",
  email = "hsrivastav099@gn",
  listingId = "HSE03269",
  address = "390 Bank St, Ottawa",
}: ScheduleViewingProps) {
  const [formData, setFormData] = useState({
    agentName,
    contactNumber,
    email,
    message: `I want to book an appointment to view: [${listingId}], ${address}`,
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const clearField = (field: string) => {
    setFormData((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  return (
    <Card className="bg-gray-50 border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900">
          Schedule Viewing
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">Tour with HouseSigma Agent</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Agent Name */}
          <div className="space-y-2">
            <Label
              htmlFor="agent-name"
              className="text-sm font-medium text-gray-700"
            >
              Agent Name
            </Label>
            <div className="relative">
              <Input
                id="agent-name"
                type="text"
                value={formData.agentName}
                onChange={(e) => handleChange("agentName", e.target.value)}
                className="pr-8 bg-white"
              />
              {formData.agentName && (
                <button
                  type="button"
                  onClick={() => clearField("agentName")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Contact Number & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="contact-number"
                className="text-sm font-medium text-gray-700"
              >
                Your Contact Number
              </Label>
              <div className="relative">
                <Input
                  id="contact-number"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) =>
                    handleChange("contactNumber", e.target.value)
                  }
                  className="pr-8 bg-white"
                  placeholder=""
                />
                {formData.contactNumber && (
                  <button
                    type="button"
                    onClick={() => clearField("contactNumber")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="pr-8 bg-white"
                />
                {formData.email && (
                  <button
                    type="button"
                    onClick={() => clearField("email")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Appointment Message */}
          <div className="space-y-2">
            <Label
              htmlFor="message"
              className="text-sm font-medium text-gray-700"
            >
              Appointment Message
            </Label>
            <div className="relative">
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleChange("message", e.target.value)}
                className="pr-8 bg-white min-h-[100px] resize-none"
                rows={4}
              />
              {formData.message && (
                <button
                  type="button"
                  onClick={() => clearField("message")}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">* Required field</p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-6 text-base"
          >
            Schedule Viewing
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
