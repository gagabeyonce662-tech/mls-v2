import "./globals.css";
import type { Metadata } from "next";
import { ProvinceProvider } from "@/contexts/ProvinceContext";
import { UserAuthProvider } from "@/contexts/UserAuthContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { WatchedProvider } from "@/contexts/WatchedContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://estate-4u.com"),
  title: {
    default:
      "Gunneet Singh | Top Realtor in Toronto GTA | Real Estate Agent in Toronto",
    template: "%s | Gunneet Singh - Toronto Real Estate",
  },
  description:
    "Find your perfect home with Gunneet Singh, a top realtor in Toronto GTA. Whether you're buying or selling, Estate-4u can help make the process easy. Contact us today for expert real estate agent in Toronto.",
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
    title: "Gunneet Singh | Top Realtor in Toronto GTA",
    description:
      "Expert real estate services in Toronto and the GTA. Find your dream home with Gunneet Singh.",
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
    title: "Gunneet Singh | Top Realtor in Toronto GTA",
    description:
      "Expert real estate services in Toronto and the GTA. Find your dream home with Gunneet Singh.",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <UserAuthProvider>
          <ProvinceProvider>
            <CompareProvider>
              <WatchedProvider>{children}</WatchedProvider>
            </CompareProvider>
          </ProvinceProvider>
        </UserAuthProvider>
      </body>
    </html>
  );
}
