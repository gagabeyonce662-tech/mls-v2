'use client';

import React, { useState } from 'react';
import { Mail, Check } from 'lucide-react';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
      <div className="flex items-center space-x-2 mb-4">
        <Mail className="h-5 w-5 text-blue-400" />
        <h3 className="text-lg font-semibold">Stay Updated</h3>
      </div>
      
      <p className="text-gray-300 mb-4 text-sm leading-relaxed">
        Get the latest articles and insights delivered to your inbox weekly.
      </p>
      
      {!subscribed ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white py-3 px-4 rounded-lg font-medium"
          >
            Subscribe
          </button>
        </form>
      ) : (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500 rounded-full mb-3">
            <Check className="h-6 w-6 text-white" />
          </div>
          <p className="text-green-400 font-medium">Thanks for subscribing!</p>
        </div>
      )}
    </div>
  );
};

export default Newsletter;
