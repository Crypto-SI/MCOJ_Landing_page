'use client';

import Link from 'next/link';
import { 
  EnvelopeIcon, 
  PhoneIcon 
} from '@heroicons/react/24/outline';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const socialLinks = [
    { name: 'Instagram', svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2H8c-3.771 0-5.657 0-6.828 1.172C0 4.343 0 6.229 0 10v4c0 3.771 0 5.657 1.172 6.828C2.343 22 4.229 22 8 22h4c3.771 0 5.657 0 6.828-1.172C20 19.657 20 17.771 20 14v-4c0-3.771 0-5.657-1.172-6.828C17.657 2 15.771 2 12 2zM16 12a4 4 0 11-8 0 4 4 0 018 0zm2-5a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    ), href: 'https://instagram.com/mc_oj' },
    { name: 'Facebook', svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" />
      </svg>
    ), href: 'https://facebook.com/mcoj' },
    { name: 'Twitter', svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
      </svg>
    ), href: 'https://twitter.com/mc_oj' },
  ];

  const contactInfo = [
    { icon: EnvelopeIcon, text: 'bookings@mcoj.com', href: 'mailto:bookings@mcoj.com' },
    { icon: PhoneIcon, text: '+44 7700 900000', href: 'tel:+447700900000' },
  ];

  return (
    <footer className="bg-brand-navy/30 border-t border-brand-gold/20">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-brand-gold font-bank-gothic text-xl mb-4">MC OJ</h3>
            <p className="text-white/80 mb-4">
              Bringing the golden touch to UK Garage events across the nation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-brand-gold font-bank-gothic text-lg mb-4">Quick Links</h4>
            <nav className="space-y-2">
              {['About', 'Events', 'Gallery', 'Book Now'].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="block text-white/80 hover:text-brand-gold transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector(`#${item.toLowerCase().replace(' ', '-')}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="text-brand-gold font-bank-gothic text-lg mb-4">Get in Touch</h4>
            <div className="space-y-2">
              {contactInfo.map((item) => (
                <Link
                  key={item.text}
                  href={item.href}
                  className="flex items-center text-white/80 hover:text-brand-gold transition-colors"
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  <span>{item.text}</span>
                </Link>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex space-x-4 mt-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-brand-gold transition-colors"
                >
                  {social.svg}
                  <span className="sr-only">{social.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-brand-gold/20 pt-8 text-center text-white/60">
          <p>&copy; {currentYear} MC OJ. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 