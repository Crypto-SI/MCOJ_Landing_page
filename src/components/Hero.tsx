'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image 
          src="/images/OJ announcing.jpg"
          alt="MC OJ performing"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>
      
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-black/80 via-brand-navy/70 to-brand-black/80 z-10" />
      
      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 text-center">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-40 h-40 md:w-60 md:h-60">
            <Image 
              src="/images/ojsparkles.png-removebg-preview.png"
              alt="MC OJ Logo"
              fill
              priority
              className="object-contain drop-shadow-2xl"
              sizes="(max-width: 768px) 160px, 240px"
            />
          </div>
        </div>
        <h1 className="text-6xl md:text-8xl font-bank-gothic text-brand-gold mb-6 drop-shadow-lg hover:gold-shimmer">
          MC OJ
        </h1>
        <p className="text-xl md:text-2xl font-montserrat text-white mb-8 drop-shadow-md">
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