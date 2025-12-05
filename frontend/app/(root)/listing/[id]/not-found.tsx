import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ds } from '@/lib/design-system-utils';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-16">
        <div className="text-center">
          <h1 className={`${ds.h1} mb-4`}>Property Not Found</h1>
          <p className={`${ds.bodyRegular} text-ds-body mb-8`}>
            The property you're looking for could not be found. It may have been removed, sold, or the ID is incorrect.
          </p>
          
          <div className="space-y-4">
            <Link
              href="/"
              className={`${ds.btnPrimary} inline-block`}
            >
              Return to Homepage
            </Link>
            
            <p className={`${ds.small} text-ds-body`}>
              Or try searching for properties using our search feature.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}