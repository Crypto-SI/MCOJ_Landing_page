'use client';

import { MicrophoneIcon, SparklesIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';

export default function About() {
  const features = [
    {
      icon: MicrophoneIcon,
      title: 'Experienced MC',
      description: 'Over a decade of experience commanding crowds and creating unforgettable moments.',
    },
    {
      icon: SparklesIcon,
      title: 'Unique Style',
      description: 'Distinctive flow and energy that sets the perfect vibe for any UK Garage event.',
    },
    {
      icon: MusicalNoteIcon,
      title: 'Genre Expert',
      description: 'Deep knowledge of UK Garage music and culture, bringing authenticity to every performance.',
    },
  ];

  return (
    <section id="about" className="py-20 bg-brand-black">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center hover:gold-shimmer">About MC OJ</h2>
        <p className="text-xl md:text-2xl font-montserrat text-white mb-12 max-w-3xl mx-auto text-center">
          A legendary UK Garage MC, bringing high-energy performances and smooth lyrical flow to the underground and mainstream club scene.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="bg-brand-navy/30 p-6 rounded-lg border border-brand-gold/20 hover:border-brand-gold/40 transition-colors"
            >
              <feature.icon className="h-12 w-12 text-brand-gold mb-4" />
              <h3 className="text-xl font-bank-gothic text-brand-gold mb-2 hover:gold-shimmer">{feature.title}</h3>
              <p className="text-white/80">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 