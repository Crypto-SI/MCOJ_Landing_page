'use client';

import { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio('/images/Raving - Arctic Skull ft Mc OJ.mp3');
    
    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error("Audio playback failed:", error);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <button 
      onClick={togglePlayPause} 
      className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-gold/20 border border-brand-gold hover:bg-brand-gold/30 transition-colors"
      aria-label={isPlaying ? "Pause music" : "Play music"}
      title={isPlaying ? "Pause 'Raving - Arctic Skull ft Mc OJ'" : "Play 'Raving - Arctic Skull ft Mc OJ'"}
    >
      {isPlaying ? (
        <PauseIcon className="h-5 w-5 text-brand-gold" />
      ) : (
        <PlayIcon className="h-5 w-5 text-brand-gold" />
      )}
    </button>
  );
} 