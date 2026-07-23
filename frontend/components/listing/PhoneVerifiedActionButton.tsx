"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PhoneVerificationModal from "@/components/listing/PhoneVerificationModal";
import { useUserAuth } from "@/contexts/UserAuthContext";

interface PhoneVerifiedActionButtonProps {
  children: ReactNode;
  className?: string;
  onAccess: () => void;
}

export default function PhoneVerifiedActionButton({
  children,
  className,
  onAccess,
}: PhoneVerifiedActionButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading, refreshProfile } = useUserAuth();
  const [showVerification, setShowVerification] = useState(false);

  const returnPath = searchParams.size
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  const handleClick = () => {
    if (isLoading) return;

    if (!user) {
      router.push(`/sign-in?next=${encodeURIComponent(returnPath)}`);
      return;
    }

    if (!user.phone_verified) {
      setShowVerification(true);
      return;
    }

    onAccess();
  };

  const handleVerified = async () => {
    await refreshProfile();
    setShowVerification(false);
    onAccess();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={className}
      >
        {children}
      </button>

      {showVerification ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowVerification(false)}
              className="absolute -right-2 -top-2 z-10 rounded-full bg-white px-2 py-1 text-xs font-bold shadow"
              aria-label="Close phone verification"
            >
              X
            </button>
            <PhoneVerificationModal onVerified={handleVerified} />
          </div>
        </div>
      ) : null}
    </>
  );
}
