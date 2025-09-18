// components/Footer.js
import React from 'react';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Contact</h3>
          <p>Viewhomes.ca Team</p>
          <p>Nu-Vista Premiere Realty Inc.</p>
          <p>London, ON N5Y 2L8</p>
          <p>O: (519) 438-5478</p>
          <p>M: (519) 851-2844</p>
          <p>
            <a href="mailto:email@example.com">E: Email Us</a>
          </p>
        </div>

        <div className="footer-section">
          <h3>Connect</h3>
          <ul>
            <li>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
            </li>
            <li>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Navigation</h3>
          <ul>
            <li><a href="/search">Search</a></li>
            <li><a href="/communities">Communities</a></li>
            <li><a href="/buyers">Buyers</a></li>
            <li><a href="/sellers">Sellers</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Popular Searches</h3>
          <ul>
            <li><a href="/newest-listings">Newest Listings</a></li>
            <li><a href="/hamilton">Hamilton</a></li>
            <li><a href="/london">London</a></li>
            <li><a href="/cambridge">Cambridge</a></li>
            <li><a href="/toronto">Toronto</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          <a href="/accessibility">Accessibility</a> | 
          <a href="/terms">Terms of Service</a> | 
          <a href="/privacy-policy">Privacy Policy</a> | 
          <a href="/dmca-notice">DMCA Notice</a> | 
          <a href="/property-listings">Property Listings</a> | 
          <a href="/sitemap">Sitemap</a>
        </p>
        <p>© Copyright 2025 Team Forster. All Rights Reserved.</p>
        <p>Real Estate Websites by <a href="https://sierrainteractive.com" target="_blank" rel="noopener noreferrer">Sierra Interactive</a></p>
      </div>
    </footer>
  );
};

export default Footer;
