import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bed,
  Bath,
  Maximize,
  Heart,
  Maximize2,
  MapPin,
  ArrowRight,
  Share2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  CarFront,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { colors } from "@/config/design-system";
import {
  getPrice,
  formatPrice,
  getThumbnail,
  getCity,
  getPropertyType,
  getBedrooms,
  getBathrooms,
  getSqft,
  getDescription,
  getAddress,
  getProvince,
  getListingDate,
  getParkingSpaces,
  getPropertyKey,
  getDetailUrl,
  getPhotos,
  getYearBuilt,
  getStatus,
} from "@/lib/propertyUtils";
import { useWatched } from "@/contexts/WatchedContext";
import { useCompare } from "@/contexts/CompareContext";
import { useProperty } from "@/hooks/react-query";
import { openInNewTab } from "@/lib/navigation/openInNewTab";

interface PropertyQuickViewModalProps {
  show: boolean;
  property: any;
  onClose: () => void;
}

export const PropertyQuickViewModal = ({
  show,
  property,
  onClose,
}: PropertyQuickViewModalProps) => {
  const { toggleFavorite, isFavorite, addToHistory } = useWatched();
  const { addToCompare, isPropertySelected } = useCompare();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Reset index when property changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [property?.listing_key, property?.PropertyKey]);

  // Unconditional hook calls
  const propertyKey = property ? getPropertyKey(property) : "";
  const { data: detailedProperty, isLoading } = useProperty(
    show && propertyKey ? propertyKey : undefined,
  );

  if (!show || !property) return null;

  const activeProperty = detailedProperty || property;

  const price = getPrice(activeProperty);
  const city = getCity(activeProperty);
  const type = getPropertyType(activeProperty);
  const beds = getBedrooms(activeProperty);
  const baths = getBathrooms(activeProperty);
  const sqft = getSqft(activeProperty);
  const photos = getPhotos(activeProperty);
  const thumbnail = photos[currentImageIndex] || getThumbnail(activeProperty);
  const description = getDescription(activeProperty);
  const address = getAddress(activeProperty);
  const province = getProvince(activeProperty);
  const listingDate = getListingDate(activeProperty);
  const yearBuilt = getYearBuilt(activeProperty);
  const parking = getParkingSpaces(activeProperty);
  const status = getStatus(activeProperty);
  const isSaved = isFavorite(propertyKey);
  const isSelected = isPropertySelected(propertyKey);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length === 0) return;
    setDirection(1);
    setCurrentImageIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length === 0) return;
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const handleFullDetails = () => {
    addToHistory(property);
    onClose();
    openInNewTab(getDetailUrl(property));
  };

  const handleAddToCompare = () => {
    addToCompare(property);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fadeIn"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 md:hidden p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Image Gallery/Main Photo */}
        <div className="w-full md:w-1/2 relative h-64 md:h-auto bg-gray-100 overflow-hidden group flex items-center justify-center">
          <AnimatePresence initial={false} custom={direction}>
            {thumbnail ? (
              <motion.div
                key={currentImageIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0"
              >
                <Image
                  src={thumbnail}
                  alt={`Property in ${city}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </motion.div>
            ) : (
              <motion.div
                key="no-image"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center text-gray-300"
              >
                <Maximize2 className="w-20 h-20 opacity-20" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Carousel Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40 active:scale-90"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40 active:scale-90"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-10 w-11/12 pr-4">
            <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-ds-primary shadow-lg">
              {type}
            </div>
            <div
              className={`bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-lg`}
            >
              {status}
            </div>
            {listingDate && (
              <div className="bg-black/40 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg flex items-center">
                {listingDate}
              </div>
            )}
            {photos.length > 1 && (
              <div className="bg-black/40 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-white shadow-lg flex items-center tracking-widest gap-2">
                {currentImageIndex + 1} / {photos.length}
              </div>
            )}
            {isLoading && (
              <div className="bg-black/40 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-white shadow-lg flex items-center tracking-widest gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                LOADING...
              </div>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        {/* Right Side: Details */}
        <div className="w-full md:w-1/2 flex flex-col p-6 md:p-10 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start gap-4 mb-2">
            <h2
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: colors.heading }}
            >
              {formatPrice(price)}
            </h2>
            <div className="flex gap-2 md:mr-16">
              <button
                onClick={() => toggleFavorite(property)}
                className={`p-2.5 rounded-xl border transition-all ${
                  isSaved
                    ? "bg-red-50 border-red-100 text-red-500"
                    : "bg-white border-ds-card-border text-ds-body hover:border-red-200 hover:text-red-400"
                }`}
              >
                <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
              </button>
              <button
                className="p-2.5 rounded-xl border border-ds-card-border bg-white text-ds-body hover:bg-gray-50 transition-all hidden sm:block"
                onClick={() =>
                  navigator.clipboard.writeText(
                    window.location.origin + getDetailUrl(property),
                  )
                }
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-ds-body font-medium mb-6">
            <MapPin className="w-4 h-4 text-ds-primary" />
            {address ? `${address}, ${city}, ${province}` : city}
          </div>

          {/* Key Features Tray */}
          <div className="flex flex-wrap justify-center gap-6 p-4 bg-ds-background rounded-2xl mb-8 border border-ds-card-border/50">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-2 shadow-sm">
                <Bed className="w-5 h-5 text-ds-primary" />
              </div>
              <span
                className="text-lg font-bold"
                style={{ color: colors.heading }}
              >
                {beds > 0 ? beds : "N/A"}
              </span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-ds-body">
                Beds
              </span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-2 shadow-sm">
                <Bath className="w-5 h-5 text-ds-primary" />
              </div>
              <span
                className="text-lg font-bold"
                style={{ color: colors.heading }}
              >
                {baths > 0 ? baths : "N/A"}
              </span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-ds-body">
                Baths
              </span>
            </div>

            {sqft && (
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-2 shadow-sm">
                  <Maximize className="w-5 h-5 text-ds-primary" />
                </div>
                <span
                  className="text-lg font-bold"
                  style={{ color: colors.heading }}
                >
                  {sqft}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-ds-body">
                  SqFt
                </span>
              </div>
            )}

            {parking !== null && parking > 0 && (
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-2 shadow-sm">
                  <CarFront className="w-5 h-5 text-ds-primary" />
                </div>
                <span
                  className="text-lg font-bold"
                  style={{ color: colors.heading }}
                >
                  {parking}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-ds-body">
                  Parking
                </span>
              </div>
            )}

            {yearBuilt && (
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-2 shadow-sm">
                  <CalendarDays className="w-5 h-5 text-ds-primary" />
                </div>
                <span
                  className="text-lg font-bold"
                  style={{ color: colors.heading }}
                >
                  {yearBuilt}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-ds-body">
                  Built
                </span>
              </div>
            )}
          </div>

          {/* Description Snippet */}
          <div className="flex-1">
            <h4 className="text-sm font-bold uppercase tracking-widest text-ds-body mb-3">
              About this home
            </h4>
            <p className="text-ds-body leading-relaxed text-sm mb-8 line-clamp-6 italic">
              {description
                ? `"${description}"`
                : "Discover luxury living in this pristine property. Contact us for private viewing details and specific listing secrets."}
            </p>
          </div>

          {/* Action Footer */}
          <div className="mt-auto space-y-3 pt-6 border-t border-ds-card-border">
            <button
              onClick={handleFullDetails}
              className="w-full flex items-center justify-center gap-2 py-4 bg-ds-primary text-white font-bold rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-ds-primary/20"
              style={{ backgroundColor: colors.primary }}
            >
              Full Detailed View
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleAddToCompare}
              disabled={isSelected}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all border ${
                isSelected
                  ? "bg-emerald-50 border-emerald-100 text-emerald-600 disabled:opacity-100"
                  : "bg-white border-ds-card-border text-ds-heading hover:bg-gray-50"
              }`}
            >
              {isSelected ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Added to Comparison
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  Add to Comparison
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Modal Close Button Desktop */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 z-20 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white border border-ds-card-border shadow-xl hover:bg-gray-50 transition-all active:scale-95 group"
        >
          <X className="w-6 h-6 text-ds-heading transition-transform" />
        </button>
      </div>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
