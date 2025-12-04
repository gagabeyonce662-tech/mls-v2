"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { colors } from "@/config/design-system";

interface PropertyGalleryProps {
  images: string[];
}

export default function PropertyGallery({ images }: PropertyGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const mainImageRef = useRef<HTMLDivElement>(null);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Auto-scroll thumbnails to show current image
  useEffect(() => {
    if (thumbnailsRef.current) {
      const thumbnailElement = thumbnailsRef.current.children[currentImageIndex] as HTMLElement;
      if (thumbnailElement) {
        thumbnailElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentImageIndex]);

  // Add keyboard navigation and horizontal scrolling
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'Escape') setIsFullscreen(false);
    };

    const handleWheel = (e: WheelEvent) => {
      if (mainImageRef.current && mainImageRef.current.contains(e.target as Node)) {
        e.preventDefault();
        if (e.deltaX > 0 || e.deltaY > 0) {
          nextImage();
        } else if (e.deltaX < 0 || e.deltaY < 0) {
          prevImage();
        }
      }
    };

    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyPress);
    }
    
    if (mainImageRef.current) {
      mainImageRef.current.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (mainImageRef.current) {
        mainImageRef.current.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isFullscreen]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="space-y-4">
        {/* Main Image Display */}
        <div 
          ref={mainImageRef}
          className="relative h-96 lg:h-[500px] overflow-hidden bg-gray-100 group cursor-grab active:cursor-grabbing"
          style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}
        >
          <div 
            className="w-full h-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
          >
            <div className="flex h-full">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Property image ${index + 1}`}
                  className="w-full h-full object-cover flex-shrink-0"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                style={{ background: 'none', border: 'none', padding: 0, outline: 'none' }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6 text-white drop-shadow-lg" />
              </button>
              <button
                onClick={nextImage}
                style={{ background: 'none', border: 'none', padding: 0, outline: 'none' }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                <ChevronRight className="w-6 h-6 text-white drop-shadow-lg" />
              </button>
            </>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(true)}
            style={{ background: 'none', border: 'none', padding: 0, outline: 'none' }}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <Expand className="w-5 h-5 text-white drop-shadow-lg" />
          </button>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="relative">
            <div 
              ref={thumbnailsRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  style={{ background: 'none', border: 'none', padding: 0, outline: 'none' }}
                  className={`relative flex-shrink-0 w-20 h-16 overflow-hidden transition-all cursor-pointer ${
                    index === currentImageIndex 
                      ? 'scale-105 opacity-100' 
                      : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full">
            <img
              src={images[currentImageIndex]}
              alt={`Property image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Close Button */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation in Fullscreen */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              </>
            )}

            {/* Image Counter in Fullscreen */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
