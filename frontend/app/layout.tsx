import "./globals.css";
import type { Metadata } from "next";
import { ProvinceProvider } from "@/contexts/ProvinceContext";
import { UserAuthProvider } from "@/contexts/UserAuthContext";

export const metadata: Metadata = {
  title:
    "Gunneet Singh Top Realtor in Toronto GTA | Real Estate Agent in Toronto",
  description:
    "Find your perfect home with Gunneet Singh, a top realtor in Toronto GTA. Whether you're buying or selling, Estate-4u can help make the process easy. Contact us today for expert real estate agent in Toronto.",
  icons: {
    icon: "https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png",
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
          <ProvinceProvider>{children}</ProvinceProvider>
        </UserAuthProvider>
      </body>
    </html>
  );
}
