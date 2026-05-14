"use client";

import { usePathname } from "next/navigation";
import { useUserAuth } from "@/contexts/UserAuthContext";
import PropertyGalleryGrid from "./PropertyGalleryGrid";
import GalleryAuthModal from "./GalleryAuthModal";
import PhoneVerificationModal from "./PhoneVerificationModal";

interface Props {
  images: string[];
  media?: Array<{ media_url?: string; media_category?: string }>;
  tourUrl?: string | null;
  statusLabel?: string;
}

export default function GalleryGateWrapper({ images, media, tourUrl, statusLabel }: Props) {
  const { user, isLoading } = useUserAuth();
  const pathname = usePathname();

  // Always render the gallery; overlays mount on top
  const isAuthed = !isLoading && !!user;
  const isVerified = isAuthed && !!user?.phone_verified;

  // Only gate when there's more than 1 image (nothing to hide otherwise)
  const shouldGate = images.length > 1 && !isVerified;

  return (
    <div className="relative">
      <PropertyGalleryGrid
        images={images}
        media={media}
        tourUrl={tourUrl}
        statusLabel={statusLabel}
      />

      {shouldGate && (
        <>
          {/* Blur mask — right half on desktop, bottom half on mobile */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="hidden md:block absolute top-0 right-0 w-1/2 h-full backdrop-blur-[6px] bg-black/40 rounded-r-xl" />
            <div className="md:hidden absolute bottom-0 left-0 w-full h-1/2 backdrop-blur-[6px] bg-black/40 rounded-b-xl" />
          </div>

          {/* CTA overlay — centred over the blurred zone */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="hidden md:flex absolute top-0 right-0 w-1/2 h-full items-center justify-center pointer-events-auto">
              {!isAuthed
                ? <GalleryAuthModal photoCount={images.length} returnPath={pathname} />
                : <PhoneVerificationModal />
              }
            </div>
            <div className="md:hidden absolute bottom-0 left-0 w-full h-1/2 flex items-center justify-center pointer-events-auto">
              {!isAuthed
                ? <GalleryAuthModal photoCount={images.length} returnPath={pathname} />
                : <PhoneVerificationModal />
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
}
