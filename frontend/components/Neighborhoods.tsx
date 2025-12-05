import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { colors } from '@/config/design-system';

const neighborhoods = [
  {
    name: 'Brampton',
    image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
    href: '/homes-for-sale-in-brampton'
  },
  {
    name: 'Brantford',
    image: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
    href: '/houses-for-sale-brantford'
  },
  {
    name: 'Thorold',
    image: 'https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
    href: '/houses-for-sale-in-niagara-falls'
  },
  {
    name: 'Hamilton',
    image: 'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
    href: '/homes-for-sale-in-hamilton'
  },
  {
    name: 'Cambridge',
    image: 'https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
    href: '/homes-for-sale-in-cambridge'
  }
];

export default function Neighborhoods() {
  return (
    <section className="py-16" style={{ backgroundColor: colors.cards }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-1">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6" style={{ color: colors.heading }}>
              EXPLORE OUR NEIGHBOURHOODS
            </h2>
            <p className="text-lg" style={{ color: colors.body }}>
              Discover a community where convenience meets charm! Our neighbourhood is 
              thoughtfully designed to offer everything you need within easy reach.
            </p>
          </div>
          
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {neighborhoods.slice(0, 2).map((neighborhood) => (
              <Link
                key={neighborhood.name}
                href={neighborhood.href}
                className="group relative h-64 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Image
                  src={neighborhood.image}
                  alt={neighborhood.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300" />
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">{neighborhood.name}</h3>
                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="mr-2">More Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {neighborhoods.slice(2).map((neighborhood) => (
            <Link
              key={neighborhood.name}
              href={neighborhood.href}
              className="group relative h-64 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Image
                src={neighborhood.image}
                alt={neighborhood.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300" />
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">{neighborhood.name}</h3>
                  <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="mr-2">More Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}