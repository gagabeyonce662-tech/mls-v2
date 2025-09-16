'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Pre-Construction', href: '/pre-construction' },
    { 
      name: 'Resale', 
      href: '/resale',
      submenu: [
        { name: 'Our Listing', href: '/resale-listing' }
      ]
    },
    { name: 'Services', href: '/services' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:block bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image
                src="https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png?auto=compress&cs=tinysrgb&w=150&h=125"
                alt="Estate-4u Logo"
                width={150}
                height={125}
                className="h-16 w-auto"
              />
            </Link>

            {/* Navigation */}
            <nav className="flex-1 flex justify-end">
              <ul className="flex items-center space-x-8">
                {navigation.map((item) => (
                  <li key={item.name} className="relative group">
                    <Link
                      href={item.href}
                      className="text-black hover:text-orange-600 font-medium text-lg uppercase transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                    {item.submenu && (
                      <ul className="absolute top-full left-0 bg-white shadow-lg rounded-md py-2 min-w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        {item.submenu.map((subItem) => (
                          <li key={subItem.name}>
                            <Link
                              href={subItem.href}
                              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-orange-600"
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Phone & Login */}
            <div className="flex items-center space-x-4 ml-8">
              <Link
                href="tel:647-515-2000"
                className="flex items-center text-black hover:text-orange-600 font-medium"
              >
                <Phone className="w-4 h-4 mr-2" />
                647-515-2000
              </Link>
              <Button variant="outline" size="sm">
                <User className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 h-20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>

          <Link href="/" className="flex-shrink-0">
            <Image
              src="https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=100&h=100"
              alt="Estate-4u Logo"
              width={100}
              height={100}
              className="h-12 w-auto"
            />
          </Link>

          <Button variant="ghost" size="sm">
            <User className="w-6 h-6" />
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 bg-white">
            <div className="flex items-center justify-between px-4 h-20 border-b">
              <span className="font-semibold">Menu</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            <nav className="px-4 py-6">
              <ul className="space-y-4">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="block text-lg font-medium text-gray-900 hover:text-orange-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                    {item.submenu && (
                      <ul className="ml-4 mt-2 space-y-2">
                        {item.submenu.map((subItem) => (
                          <li key={subItem.name}>
                            <Link
                              href={subItem.href}
                              className="block text-gray-600 hover:text-orange-600"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}