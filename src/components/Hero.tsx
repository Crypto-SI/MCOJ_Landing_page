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
      <div className="relative z-20 container mx-auto px-4 text-center h-full flex flex-col">
        {/* Logo - using new image file */}
        <div className="flex justify-center items-center pt-20" style={{ height: '60%' }}>
          <div style={{ width: '65vw', maxWidth: '600px', height: '65vw', maxHeight: '600px' }} className="relative">
            <Image 
              src="/images/OJ.png"
              alt="OJ Logo"
              fill
              priority
              className="object-contain drop-shadow-2xl"
              sizes="65vw"
            />
          </div>
        </div>
        
        {/* Text in separate container with fixed position */}
        <div className="flex-grow flex flex-col justify-end pb-16">
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
              className="btn-primary text-2xl md:text-3xl px-8 py-4 md:px-12 md:py-6"
            >
              Book Now
            </Link>
            <Link 
              href="#events"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#events')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-secondary text-2xl md:text-3xl px-8 py-4 md:px-12 md:py-6"
            >
              View Events
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 