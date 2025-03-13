'use client';

import { useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

// Define the image type
type GalleryImage = {
  src: string;
  alt: string;
};

// Gallery images data
const galleryImages: GalleryImage[] = [
  {
    src: '/images/Flux_Dev_A_suave_charismatic_black_man_exudes_cool_confidence__0.jpeg',
    alt: 'MC OJ performing live'
  },
  {
    src: '/images/Flux_Dev_A_suave_charismatic_black_man_exudes_cool_confidence__1.jpeg',
    alt: 'MC OJ in action'
  },
  {
    src: '/images/Flux_Dev_A_suave_charismatic_black_man_exudes_cool_confidence__2.jpeg',
    alt: 'MC OJ on stage'
  },
  {
    src: '/images/Flux_Dev_A_suave_charismatic_black_man_exudes_cool_confidence__3.jpeg',
    alt: 'MC OJ performing'
  },
  {
    src: '/images/Flux_Dev_A_strikingly_handsome_40yearold_Black_man_exudes_conf_0.jpeg',
    alt: 'MC OJ portrait'
  },
  {
    src: '/images/Flux_Dev_A_strikingly_handsome_40yearold_Black_man_exudes_conf_1.jpeg',
    alt: 'MC OJ in studio'
  },
  {
    src: '/images/Flux_Dev_A_strikingly_handsome_40yearold_Black_man_exudes_conf_2.jpeg',
    alt: 'MC OJ behind the scenes'
  },
  {
    src: '/images/Flux_Dev_A_strikingly_handsome_40yearold_Black_man_exudes_conf_3.jpeg',
    alt: 'MC OJ in action'
  }
];

export default function Gallery() {
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  return (
    <section id="gallery" className="py-20 bg-brand-black">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center">Gallery</h2>
        <p className="section-subtitle text-center max-w-3xl mx-auto">
          Capturing the energy and charisma of MC OJ's performances
        </p>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-12">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => {
                setPhotoIndex(index);
                setIsOpen(true);
              }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Click to view
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        <Lightbox
          open={isOpen}
          close={() => setIsOpen(false)}
          index={photoIndex}
          slides={galleryImages}
        />
      </div>
    </section>
  );
} 