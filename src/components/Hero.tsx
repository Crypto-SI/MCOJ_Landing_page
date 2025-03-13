'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-brand-navy opacity-90 z-10" />
      
      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 text-center">
        <h1 className="text-6xl md:text-8xl font-bank-gothic text-brand-gold mb-6">
          MC OJ
        </h1>
        <p className="text-xl md:text-2xl font-montserrat text-white mb-8">
          Bringing the golden touch to UK Garage
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="#booking" 
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#booking')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-primary"
          >
            Book Now
          </Link>
          <Link 
            href="#events"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#events')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-secondary"
          >
            View Events
          </Link>
        </div>
      </div>
    </section>
  );
} 