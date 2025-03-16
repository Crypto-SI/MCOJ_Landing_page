'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import videoPlayerManager from '@/utils/videoPlayerManager';

interface VideoUploaderProps {
  onFileSelect: (videoFile: File, thumbnailBlob: Blob | null, usesAutoThumbnail: boolean) => void;
  isUploading: boolean;
}

export default function VideoUploader({ onFileSelect, isUploading }: VideoUploaderProps) {
  const [useAutoThumbnail, setUseAutoThumbnail] = useState(true);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailGenerationFailed, setThumbnailGenerationFailed] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);
  
  // Register preview video with manager when component mounts
  useEffect(() => {
    const videoElement = previewVideoRef.current;
    if (videoElement) {
      videoPlayerManager.registerVideo(videoElement);
      
      // Clean up when component unmounts
      return () => {
        videoPlayerManager.unregisterVideo(videoElement);
      };
    }
  }, [videoPreview]);
  
  // Handle video file selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setVideoFile(file);
    setThumbnailGenerationFailed(false);
    
    // Create a preview of the video
    const videoUrl = URL.createObjectURL(file);
    setVideoPreview(videoUrl);
    
    // If auto-thumbnail is enabled, generate a thumbnail
    if (useAutoThumbnail) {
      generateThumbnailFromVideo(videoUrl, file.name);
    }
  };
  
  // Function to handle thumbnail generation from video URL
  const generateThumbnailFromVideo = (videoUrl: string, fileName: string) => {
    setThumbnailLoading(true);
    setThumbnailGenerationFailed(false);
    
    const video = videoRef.current;
    if (video) {
      video.src = videoUrl;
      video.onloadeddata = () => {
        // Set a timeout to ensure we have video data
        setTimeout(() => generateThumbnail(), 1000);
      };
      
      // Set a fallback timer in case video loading fails
      const fallbackTimer = setTimeout(() => {
        if (thumbnailLoading) {
          console.warn('Video thumbnail generation timed out, using fallback');
          setThumbnailGenerationFailed(true);
          setThumbnailLoading(false);
          createFallbackThumbnail(fileName);
        }
      }, 5000);
      
      return () => clearTimeout(fallbackTimer);
    }
  };
  
  // Create a fallback thumbnail if video thumbnail generation fails
  const createFallbackThumbnail = (filename: string) => {
    // Create a canvas with text showing the video name
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas dimensions
    canvas.width = 640;
    canvas.height = 360;
    
    // Draw background
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw a dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw a golden border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    
    // Draw text with video name
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Thumbnail Generation Failed', canvas.width / 2, canvas.height / 2 - 20);
    
    const truncatedName = filename.length > 30 ? filename.substring(0, 27) + '...' : filename;
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText(truncatedName, canvas.width / 2, canvas.height / 2 + 20);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      // Create a thumbnail preview URL
      const thumbnailUrl = URL.createObjectURL(blob);
      setThumbnailPreview(thumbnailUrl);
      
      // Create a File object from the blob
      const thumbnailFile = new File([blob], 'auto-thumbnail.jpg', { type: 'image/jpeg' });
      setThumbnailFile(thumbnailFile);
    }, 'image/jpeg', 0.8);
  };
  
  // Handle thumbnail file selection
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setThumbnailFile(file);
    setThumbnailGenerationFailed(false);
    
    // Create a preview of the thumbnail
    const thumbnailUrl = URL.createObjectURL(file);
    setThumbnailPreview(thumbnailUrl);
  };
  
  // Generate thumbnail from video using canvas
  const generateThumbnail = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;
    
    try {
      // Only proceed if the video has loaded data
      if (video.readyState < 2) {
        console.log('Video not ready, waiting...');
        // Try again in 500ms
        setTimeout(() => generateThumbnail(), 500);
        return;
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      
      // Draw the current frame of the video onto the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Try to seek to 2 seconds for thumbnail
      if (video.duration > 2) {
        video.currentTime = 2;
      } else {
        // If video is shorter than 2 seconds, use the middle
        video.currentTime = video.duration / 2;
      }
      
      // Wait for seeking to complete before drawing
      video.onseeked = () => {
        // Draw video frame onto canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          setThumbnailLoading(false);
          
          if (!blob) {
            createFallbackThumbnail(videoFile?.name || 'video');
            setThumbnailGenerationFailed(true);
            return;
          }
          
          // Create a thumbnail preview URL
          const thumbnailUrl = URL.createObjectURL(blob);
          setThumbnailPreview(thumbnailUrl);
          
          // Create a File object from the blob
          const thumbnailFile = new File([blob], 'auto-thumbnail.jpg', { type: 'image/jpeg' });
          setThumbnailFile(thumbnailFile);
        }, 'image/jpeg', 0.8); // JPEG format with 80% quality
      };
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      setThumbnailLoading(false);
      setThumbnailGenerationFailed(true);
      createFallbackThumbnail(videoFile?.name || 'video');
    }
  };
  
  // Toggle between auto and manual thumbnail
  const toggleAutoThumbnail = () => {
    const newValue = !useAutoThumbnail;
    setUseAutoThumbnail(newValue);
    
    if (newValue && videoPreview) {
      // If switching to auto-thumbnail and we have a video, generate thumbnail
      generateThumbnailFromVideo(videoPreview, videoFile?.name || 'video');
    } else {
      // If switching to manual thumbnail, clear the thumbnail
      setThumbnailPreview(null);
      setThumbnailFile(null);
      setThumbnailGenerationFailed(false);
      setThumbnailLoading(false);
    }
  };
  
  // Retry thumbnail generation
  const retryThumbnailGeneration = () => {
    if (!videoPreview || !videoFile) return;
    
    // Reset states
    setThumbnailGenerationFailed(false);
    
    // Re-trigger the thumbnail generation by simulating a toggle off and on
    if (useAutoThumbnail) {
      generateThumbnailFromVideo(videoPreview, videoFile.name);
    }
  };
  
  // Submit the files to the parent component
  const handleSubmit = () => {
    if (!videoFile) return;
    
    // If auto thumbnail is enabled, we should have a thumbnail file from canvas
    // If manual thumbnail is enabled, we should have a thumbnail file from file input
    // If neither has a file, pass null for the thumbnail
    onFileSelect(
      videoFile, 
      thumbnailFile ? thumbnailFile : null,
      useAutoThumbnail
    );
  };
  
  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Hidden video element for processing */}
      <video 
        ref={videoRef} 
        style={{ display: 'none' }} 
        controls={false} 
        muted 
        playsInline
      />
      
      {/* Hidden canvas element for thumbnail extraction */}
      <canvas 
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      {/* Video File Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Video File</label>
        <input 
          type="file" 
          ref={videoFileInputRef}
          accept="video/*"
          className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
          onChange={handleVideoChange}
          disabled={isUploading}
          required
        />
      </div>
      
      {/* Thumbnail Option */}
      <div>
        <div className="flex items-center mb-2">
          <input
            id="autoThumbnail"
            type="checkbox"
            checked={useAutoThumbnail}
            onChange={toggleAutoThumbnail}
            className="mr-2 h-4 w-4 text-yellow-500 focus:ring-yellow-400 rounded"
            disabled={isUploading}
          />
          <label htmlFor="autoThumbnail" className="text-sm font-medium text-gray-300">
            Automatically generate thumbnail from video
          </label>
        </div>
        
        {!useAutoThumbnail && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Thumbnail Image</label>
            <input 
              type="file" 
              ref={thumbnailFileInputRef}
              accept="image/*"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
              onChange={handleThumbnailChange}
              disabled={isUploading}
              required
            />
          </div>
        )}
        
        {useAutoThumbnail && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {thumbnailLoading 
                ? "Generating thumbnail from video..."
                : thumbnailGenerationFailed 
                  ? "Couldn't extract frame from video - using a fallback thumbnail instead."
                  : "A thumbnail will be automatically extracted from your video."}
            </p>
            
            {thumbnailGenerationFailed && (
              <button
                type="button"
                onClick={retryThumbnailGeneration}
                disabled={isUploading || thumbnailLoading}
                className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 text-sm rounded-md font-medium disabled:opacity-50"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Preview Section */}
      {(videoPreview || thumbnailPreview) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {/* Video Preview */}
          {videoPreview && (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-1">Video Preview</p>
              <div className="relative aspect-video bg-gray-800 rounded-md overflow-hidden">
                <video
                  ref={previewVideoRef}
                  src={videoPreview}
                  className="w-full h-full object-contain"
                  controls
                />
              </div>
            </div>
          )}
          
          {/* Thumbnail Preview */}
          {thumbnailPreview && (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-1">
                {thumbnailGenerationFailed 
                  ? 'Fallback Thumbnail' 
                  : (useAutoThumbnail ? 'Auto-Generated Thumbnail' : 'Thumbnail Preview')}
              </p>
              <div className="relative aspect-video bg-gray-800 rounded-md overflow-hidden">
                <Image
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Submit Button - This will be managed by the parent component */}
      <div className="mt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!videoFile || (!thumbnailFile && !useAutoThumbnail) || isUploading}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-md font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Processing...' : 'Confirm Selection'}
        </button>
      </div>
    </div>
  );
} 