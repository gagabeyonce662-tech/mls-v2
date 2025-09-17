import './globals.css';
import type { Metadata } from 'next';
// import { Poppins, Montserrat } from 'next/font/google';

// const poppins = Poppins({
//   subsets: ['latin'],
//   weight: ['300', '400', '500', '600', '700'],
//   variable: '--font-poppins'
// });

// const montserrat = Montserrat({
//   subsets: ['latin'],
//   weight: ['400', '500', '600'],
//   variable: '--font-montserrat'
// });

export const metadata: Metadata = {
  title: 'Gunneet Singh Top Realtor in Toronto GTA | Real Estate Agent in Toronto',
  description: 'Find your perfect home with Gunneet Singh, a top realtor in Toronto GTA. Whether you\'re buying or selling, Estate-4u can help make the process easy. Contact us today for expert real estate agent in Toronto.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body >{children}</body>

    </html>
  );
}
