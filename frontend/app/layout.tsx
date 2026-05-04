import "./globals.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ProvinceProvider } from "@/contexts/ProvinceContext";
import { UserAuthProvider } from "@/contexts/UserAuthContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { WatchedProvider } from "@/contexts/WatchedContext";
import { SearchProvider } from "@/contexts/SearchContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://estate-4u.com"),
  title: {
    default:
      "Toronto & GTA Real Estate — Homes for Sale, Rentals & Pre-Construction | Estate-4u",
    template: "%s | Estate-4u - Toronto Real Estate",
  },
  description:
    "Browse 1000+ Toronto & GTA listings — detached homes, condos, rentals & pre-construction projects. Free home valuations, mortgage tools & expert guidance from Estate-4u.",
  keywords: [
    "Toronto Real Estate",
    "GTA Realtor",
    "Gunneet Singh",
    "Buy Home Toronto",
    "Sell Home Toronto",
    "Estate-4u",
    "Toronto Real Estate Agent",
  ],
  authors: [{ name: "Gunneet Singh" }],
  creator: "Gunneet Singh",
  publisher: "Gunneet Singh",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png",
    shortcut: "https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png",
    apple: "https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png",
  },
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: "https://estate-4u.com",
    title: "Toronto & GTA Real Estate — Estate-4u",
    description:
      "Browse 1000+ Toronto & GTA listings. Homes for sale, condos, rentals and pre-construction projects with expert guidance.",
    siteName: "Estate-4u",
    images: [
      {
        url: "https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png",
        width: 1200,
        height: 630,
        alt: "Estate-4u Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toronto & GTA Real Estate — Estate-4u",
    description:
      "Browse 1000+ Toronto & GTA listings. Homes for sale, condos, rentals and pre-construction projects with expert guidance.",
    images: ["https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { TooltipProvider } from "@/components/ui/tooltip";
import FeedbackWidget from "@/components/FeedbackWidget";
import { Toaster } from "@/components/ui/toaster";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  const locale = await getLocale();
  const htmlLang = locale === "zh-Hans" ? "zh-Hans" : "en";

  return (
    <html lang={htmlLang}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <UserAuthProvider>
            <ProvinceProvider>
              <CompareProvider>
                <WatchedProvider>
                  <SearchProvider>
                    <TooltipProvider delayDuration={0}>
                      {children}
                      <FeedbackWidget />
                      <Toaster />
                    </TooltipProvider>
                  </SearchProvider>
                </WatchedProvider>
              </CompareProvider>
            </ProvinceProvider>
          </UserAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
