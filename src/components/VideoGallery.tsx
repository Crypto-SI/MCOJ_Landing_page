'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { fetchVideos } from '@/utils/videoClientUtils';
import type { GalleryVideo } from '@/utils/videoClientUtils';
import videoPlayerManager from '@/utils/videoPlayerManager';

// Define a type that extends the default Lightbox slide type
type VideoSlide = GalleryVideo;

// Custom Video component for the lightbox
const VideoSlideComponent = ({ slide, index, currentIndex }: { slide: VideoSlide; index: number; currentIndex: number }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Control video playback based on whether this slide is active
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    if (index === currentIndex) {
      // This is the active slide - play the video
      videoElement.currentTime = 0; // Reset to beginning
      
      // Try to autoplay with both sound and muted fallback
      const playPromise = videoElement.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Auto-play was prevented (common in many browsers)
          console.log('Autoplay with sound prevented, trying muted playback');
          
          // Try again with muted option (most browsers allow this)
          videoElement.muted = true;
          videoElement.play().catch(err => {
            console.log('Even muted autoplay was prevented by browser', err);
          });
        });
      }
    } else {
      // This is not the active slide - pause and reset the video
      videoElement.pause();
      videoElement.currentTime = 0;
    }
  }, [index, currentIndex]);
  
  // Register video with manager when component mounts
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoPlayerManager.registerVideo(videoElement);
      
      // Clean up when component unmounts
      return () => {
        videoPlayerManager.unregisterVideo(videoElement);
      };
    }
  }, []);
  
  // Add event listeners for page visibility changes
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    // Function to handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden && index === currentIndex) {
        // If page is hidden and this is the active video, pause it
        videoElement.pause();
      } else if (!document.hidden && index === currentIndex) {
        // If page becomes visible again and this is the active video, try to resume
        videoElement.play().catch(err => {
          console.log('Autoplay prevented on visibility change:', err);
        });
      }
    };
    
    // Add page visibility listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [index, currentIndex]);
  
  return (
    <div className="lightbox-video-container w-full h-full flex items-center justify-center">
      <video
        ref={videoRef}
        src={slide.src}
        controls
        playsInline // Better mobile experience
        autoPlay={index === currentIndex}
        className="max-h-[80vh] max-w-[80vw]"
        title={slide.title}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default function VideoGallery() {
  const [videos, setVideos] = useState<VideoSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);
  // Track current index for video control
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadVideos = async () => {
      setIsLoading(true);
      const fetchedVideos = await fetchVideos();
      setVideos(fetchedVideos);
      setIsLoading(false);
    };

    loadVideos();
    
    // Set up beforeunload event to pause videos when navigating away
    const handleBeforeUnload = () => {
      videoPlayerManager.pauseAllVideos();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Pause all videos when leaving the page
    return () => {
      videoPlayerManager.pauseAllVideos();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // When lightbox opens, set current index and pause all other videos
  useEffect(() => {
    if (isOpen) {
      videoPlayerManager.pauseAllVideos();
      setCurrentIndex(videoIndex);
    } else {
      // When closing the lightbox, pause all videos
      videoPlayerManager.pauseAllVideos();
    }
  }, [isOpen, videoIndex]);
  
  // Handler for when the active slide changes in the lightbox
  const handleViewChange = useCallback((newState: { index: number }) => {
    // Update the current index
    setCurrentIndex(newState.index);
    // Pause all videos to ensure no overlap
    videoPlayerManager.pauseAllVideos();
  }, []);

  // Custom render for video lightbox
  const renderVideoSlide = ({ slide, index }: any) => {
    return (
      <VideoSlideComponent 
        slide={slide as VideoSlide} 
        index={index}
        currentIndex={currentIndex}
      />
    );
  };

  return (
    <section id="videos" className="py-20 bg-brand-navy/30">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center gold-shimmer">Videos</h2>
        <p className="text-xl md:text-2xl font-montserrat text-white mb-12 max-w-3xl mx-auto text-center">
          Watch MC OJ in action with these performance highlights
        </p>

        {isLoading ? (
          <div className="text-center">
            <p className="text-brand-gold">Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center">
            <p className="text-white">No videos available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {videos.map((video, index) => (
              <div
                key={video.id}
                className="relative aspect-video overflow-hidden rounded-lg cursor-pointer group"
                onClick={() => {
                  setVideoIndex(index);
                  setIsOpen(true);
                }}
              >
                {/* Thumbnail image */}
                <Image
                  src={video.thumbnailSrc}
                  alt={video.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                
                {/* Play button overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-brand-gold/80 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-brand-black ml-1">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {/* Video title */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <h3 className="text-white font-semibold">{video.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Lightbox */}
        <Lightbox
          open={isOpen}
          close={() => setIsOpen(false)}
          index={videoIndex}
          slides={videos as any}
          render={{ slide: renderVideoSlide }}
          on={{
            view: handleViewChange
          }}
        />
      </div>
    </section>
  );
} 