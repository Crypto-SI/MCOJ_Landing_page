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
    src: '/images/gallery_image_1.jpg',
    alt: 'Gallery image 1'
  },
  {
    src: '/images/gallery_image_2.jpg',
    alt: 'Gallery image 2'
  },
  {
    src: '/images/gallery_image_3.jpg',
    alt: 'Gallery image 3'
  },
  {
    src: '/images/gallery_image_4.jpg',
    alt: 'Gallery image 4'
  },
  {
    src: '/images/gallery_image_5.jpg',
    alt: 'Gallery image 5'
  },
  {
    src: '/images/gallery_image_6.jpg',
    alt: 'Gallery image 6'
  },
  {
    src: '/images/gallery_image_7.jpg',
    alt: 'Gallery image 7'
  },
  {
    src: '/images/gallery_image_8.jpg',
    alt: 'Gallery image 8'
  }
];

export default function Gallery() {
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  return (
    <section id="gallery" className="py-20 bg-brand-black">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center gold-shimmer">Gallery</h2>
        <p className="text-xl md:text-2xl font-montserrat text-white mb-12 max-w-3xl mx-auto text-center">
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