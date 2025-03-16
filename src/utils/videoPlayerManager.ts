/**
 * VideoPlayerManager
 * A simple utility to manage video playback across the application
 * This ensures that only one video plays at a time
 */

// Store references to all video elements that should be managed
class VideoPlayerManager {
  private videoElements: HTMLVideoElement[] = [];
  private static instance: VideoPlayerManager;
  private initialized = false;

  // Singleton pattern to ensure we have only one manager
  public static getInstance(): VideoPlayerManager {
    if (!VideoPlayerManager.instance) {
      VideoPlayerManager.instance = new VideoPlayerManager();
    }
    return VideoPlayerManager.instance;
  }

  private constructor() {
    // Set up global event listeners when the manager is first instantiated
    if (typeof window !== 'undefined') {
      this.setupGlobalListeners();
    }
  }

  private setupGlobalListeners(): void {
    if (this.initialized) return;
    
    // Listen for page visibility changes (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAllVideos();
      }
    });
    
    // Listen for page navigation/unload
    window.addEventListener('beforeunload', () => {
      this.pauseAllVideos();
    });
    
    // Listen for page blur (user switches to another app/window)
    window.addEventListener('blur', () => {
      this.pauseAllVideos();
    });
    
    this.initialized = true;
  }

  // Register a video element to be managed
  public registerVideo(videoElement: HTMLVideoElement): void {
    if (!this.videoElements.includes(videoElement)) {
      // Add play event listener to pause other videos when this one plays
      videoElement.addEventListener('play', () => {
        this.pauseOtherVideos(videoElement);
      });
      
      this.videoElements.push(videoElement);
    }
  }

  // Unregister a video element when it's not needed anymore
  public unregisterVideo(videoElement: HTMLVideoElement): void {
    const index = this.videoElements.indexOf(videoElement);
    if (index !== -1) {
      this.videoElements.splice(index, 1);
    }
  }

  // Pause all videos except the one that is currently playing
  private pauseOtherVideos(currentVideo: HTMLVideoElement): void {
    this.videoElements.forEach(video => {
      if (video !== currentVideo && !video.paused) {
        video.pause();
      }
    });
  }

  // Pause all videos (useful when navigating away)
  public pauseAllVideos(): void {
    this.videoElements.forEach(video => {
      if (!video.paused) {
        video.pause();
      }
    });
  }
}

export default VideoPlayerManager.getInstance(); 