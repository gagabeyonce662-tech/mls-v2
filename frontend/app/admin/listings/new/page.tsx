"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { createProperty } from "@/lib/api";
import {
  ArrowLeft,
  UploadCloud,
  X,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Building2,
  ListFilter,
  Info,
  DollarSign,
  Maximize2,
  Bed,
  Bath,
  Home,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { colors } from "@/config/design-system";
import { motion, AnimatePresence } from "framer-motion";

type FormDataInputs = {
  unparsed_address: string;
  city: string;
  state_or_province: string;
  postal_code: string;
  list_price: number;
  bedrooms_total: number;
  bathrooms_total_integer: number;
  building_area_total: number;
  public_remarks: string;
  property_sub_type: string;
  standard_status: string;
};

export default function NewListingPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormDataInputs>({
    defaultValues: {
      state_or_province: "ON",
      standard_status: "Active",
      property_sub_type: "Detached",
    },
  });
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages((prev) => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormDataInputs) => {
    setIsSubmitting(true);
    console.log("Submitting listing data:", data);
    try {
      const formData = new FormData();

      // Append all text fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Append images
      images.forEach((image) => {
        formData.append("images", image);
      });

      await createProperty(formData);

      toast({
        title: "Success",
        description: "Listing created successfully.",
      });

      router.push("/admin/listings");
    } catch (error: any) {
      console.error("Submission error:", error);

      let errorMessage = "Failed to create listing. Please try again.";

      if (error.status === 400 && error.data) {
        if (typeof error.data === "object") {
          // If the backend returns field-level errors, extract the first one or join them
          const fieldErrors = Object.entries(error.data)
            .map(
              ([field, msgs]) =>
                `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`,
            )
            .join(" | ");
          errorMessage = fieldErrors || errorMessage;
        } else if (typeof error.data === "string") {
          errorMessage = error.data;
        }
      } else if (error.status) {
        errorMessage = `Error ${error.status}: ${error.message || "Unknown error"}`;
      }

      toast({
        title: "Submission Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full pl-10 pr-4 py-3 bg-ds-card/50 border border-ds-card-border rounded-xl text-sm text-ds-heading focus:ring-2 focus:ring-ds-primary/10 focus:border-ds-primary transition-all outline-none font-medium placeholder:text-ds-body/30 box-border";
  const labelCls =
    "text-[11px] font-bold text-ds-body mb-2 uppercase tracking-widest flex items-center gap-1.5";
  const sectionCls =
    "bg-white p-8 rounded-[2rem] border border-ds-card-border shadow-2xl shadow-ds-primary/5 transition-all hover:shadow-ds-primary/10";
  const iconCls =
    "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ds-primary/60";

  return (
    <div className="max-w-5xl mx-auto px-6 pb-20 pt-8">
      {/* Header Area */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12"
      >
        <div className="flex items-center gap-6">
          <Link
            href="/admin/listings"
            className="p-4 bg-white hover:bg-ds-card text-ds-heading rounded-2xl border border-ds-card-border shadow-xl hover:shadow-2xl transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-4xl font-black text-ds-heading tracking-tight">
              Create Listing
            </h1>
            <p className="text-ds-body font-medium flex items-center gap-2 mt-1 opacity-70">
              <Building2 className="w-4 h-4" />
              Add a new property to the exclusive registry
            </p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        {/* Section 1: Location & Price */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={sectionCls}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-ds-primary/10 rounded-xl flex items-center justify-center text-ds-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-ds-heading">
              Basic Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label className={labelCls}>Property Address</label>
              <div className="relative">
                <MapPin className={iconCls} />
                <input
                  {...register("unparsed_address", {
                    required: "Address is required",
                  })}
                  className={inputCls}
                  placeholder="Street name and house number"
                />
              </div>
              {errors.unparsed_address && (
                <span className="text-[10px] font-bold text-red-500 uppercase mt-2 block tracking-widest">
                  {errors.unparsed_address.message}
                </span>
              )}
            </div>

            <div className="lg:col-span-1">
              <label className={labelCls}>City</label>
              <div className="relative">
                <Building2 className={iconCls} />
                <input
                  {...register("city", { required: "City is required" })}
                  className={inputCls}
                  placeholder="Enter city"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Postal Code</label>
              <div className="relative">
                <Info className={iconCls} />
                <input
                  {...register("postal_code", {
                    required: "Postal Code is required",
                  })}
                  className={inputCls}
                  placeholder="M5V 2N8"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>List Price (CAD)</label>
              <div className="relative">
                <DollarSign className={iconCls} />
                <input
                  type="number"
                  {...register("list_price", {
                    required: "Price is required",
                    min: 0,
                  })}
                  className={inputCls}
                  placeholder="0,000"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Province</label>
              <div className="relative">
                <MapPin className={iconCls} />
                <select
                  {...register("state_or_province")}
                  className={`${inputCls} appearance-none`}
                >
                  <option value="ON">Ontario (ON)</option>
                  <option value="BC">British Columbia (BC)</option>
                  <option value="AB">Alberta (AB)</option>
                  <option value="QC">Quebec (QC)</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Listing Status</label>
              <div className="relative">
                <ListFilter className={iconCls} />
                <select
                  {...register("standard_status")}
                  className={`${inputCls} appearance-none`}
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Property Sub-Type</label>
              <div className="relative">
                <Home className={iconCls} />
                <select
                  {...register("property_sub_type")}
                  className={`${inputCls} appearance-none`}
                >
                  <option value="Detached">Detached</option>
                  <option value="Semi-Detached">Semi-Detached</option>
                  <option value="Condo Apt">Condo Apt</option>
                  <option value="Townhouse">Townhouse</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 2: Property Specs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={sectionCls}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-ds-primary/10 rounded-xl flex items-center justify-center text-ds-primary">
              <ListFilter className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-ds-heading">
              Property Features
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <label className={labelCls}>Bedrooms</label>
              <div className="relative">
                <Bed className={iconCls} />
                <input
                  type="number"
                  {...register("bedrooms_total", { min: 0 })}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Bathrooms</label>
              <div className="relative">
                <Bath className={iconCls} />
                <input
                  type="number"
                  {...register("bathrooms_total_integer", { min: 0 })}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Sq Ft (Area)</label>
              <div className="relative">
                <Maximize2 className={iconCls} />
                <input
                  type="number"
                  {...register("building_area_total", { min: 0 })}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="col-span-2 md:col-span-3">
              <label className={labelCls}>Public Remarks</label>
              <textarea
                {...register("public_remarks")}
                rows={5}
                className="w-full px-6 py-4 bg-ds-card/50 border border-ds-card-border rounded-2xl text-sm text-ds-heading focus:ring-2 focus:ring-ds-primary/10 focus:border-ds-primary transition-all outline-none font-medium placeholder:text-ds-body/30 resize-none"
                placeholder="Highlight the property's best features..."
              />
            </div>
          </div>
        </motion.div>

        {/* Section 3: Media */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={sectionCls}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-ds-primary/10 rounded-xl flex items-center justify-center text-ds-primary">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-ds-heading">
              Media Showcase
            </h2>
          </div>

          <div className="border-2 border-dashed border-ds-card-border rounded-[2rem] p-12 text-center hover:bg-ds-card hover:border-ds-primary transition-all cursor-pointer relative group">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-4 pointer-events-none">
              <div className="p-5 bg-ds-primary/5 rounded-2xl text-ds-primary group-hover:scale-110 group-hover:bg-ds-primary group-hover:text-white transition-all">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-bold text-ds-heading tracking-tight">
                  Upload Property Photos
                </p>
                <p className="text-sm text-ds-body opacity-60">
                  Drag and drop files or click to browse (MAX 5MB)
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-10">
                {images.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-[1.5rem] overflow-hidden border-2 border-ds-card-border shadow-xl group"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-3 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 active:scale-95 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6"
        >
          <Link
            href="/admin/listings"
            className="w-full sm:w-auto px-10 py-4 rounded-2xl border border-ds-card-border text-ds-body font-bold hover:bg-white hover:text-ds-heading transition-all text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-12 py-4 rounded-2xl bg-ds-primary text-white font-bold shadow-2xl shadow-ds-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            style={{ backgroundColor: colors.primary }}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Launch Listing
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
}
