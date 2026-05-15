"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

interface Props {
  photoCount: number;
  returnPath: string;
}

export default function GalleryAuthModal({ photoCount, returnPath }: Props) {
  const router = useRouter();
  const encoded = encodeURIComponent(returnPath);

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5 max-w-xs w-full mx-4 border border-white/60">
      <div className="w-14 h-14 rounded-full bg-ds-primary/10 flex items-center justify-center">
        <Lock className="w-7 h-7 text-ds-primary" />
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-base font-semibold text-ds-heading">
          Sign in to view all photos
        </p>
        <p className="text-sm text-ds-body">
          {photoCount > 1 ? `${photoCount - 1} more photo${photoCount - 1 !== 1 ? "s" : ""} available` : "Full gallery available"} after a quick sign-in
        </p>
      </div>
      <div className="flex flex-col gap-2.5 w-full">
        <button
          onClick={() => router.push(`/sign-in?next=${encoded}`)}
          className="w-full rounded-xl bg-ds-primary text-white py-2.5 text-sm font-semibold hover:bg-ds-primary/90 transition-colors"
        >
          Sign In
        </button>
        <button
          onClick={() => router.push(`/sign-up?next=${encoded}`)}
          className="w-full rounded-xl border border-ds-card-border text-ds-heading py-2.5 text-sm font-semibold hover:bg-ds-card transition-colors"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
