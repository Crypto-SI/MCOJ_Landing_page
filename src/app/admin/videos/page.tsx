'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { fetchVideos } from '@/utils/videoClientUtils'
import type { GalleryVideo } from '@/utils/videoClientUtils'
import VideoUploader from '@/components/VideoUploader'
import NotificationToast from '@/components/NotificationToast'
import videoPlayerManager from '@/utils/videoPlayerManager'

export default function VideoManagement() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [videos, setVideos] = useState<GalleryVideo[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  
  // Toast notification states
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Form refs for title and description
  const titleRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLInputElement>(null)
  
  const router = useRouter()
  
  // Fetch videos
  const loadVideos = async () => {
    try {
      console.log('Fetching videos...');
      setIsLoading(true);
      
      const fetchedVideos = await fetchVideos();
      
      setVideos(fetchedVideos || []);
      console.log(`Loaded ${fetchedVideos?.length || 0} videos`);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem('mcoj_admin_authenticated')
    if (auth !== 'true') {
      router.push('/admin/login')
    } else {
      setIsAuthenticated(true)
      // Fetch videos once authenticated
      loadVideos()
    }
  }, [router])

  // Handle file selection from the VideoUploader component
  const handleFileSelection = async (
    videoFile: File,
    thumbnailBlob: Blob | null,
    usesAutoThumbnail: boolean
  ) => {
    if (!titleRef.current?.value) {
      showError("Title is required");
      return;
    }
    
    await handleVideoUpload(videoFile, thumbnailBlob, usesAutoThumbnail);
  };

  // Display a success toast
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
  };
  
  // Display an error toast
  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorToast(true);
  };

  // Handle video upload
  const handleVideoUpload = async (
    videoFile: File,
    thumbnailBlob: Blob | null,
    usesAutoThumbnail: boolean
  ) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('title', titleRef.current!.value);
      
      if (descriptionRef.current?.value) {
        formData.append('description', descriptionRef.current.value);
      }
      
      formData.append('video', videoFile);
      
      // Add the thumbnail if provided
      if (thumbnailBlob) {
        // Convert Blob to File to maintain compatibility with the API
        const thumbnailFile = new File([thumbnailBlob], 'thumbnail.jpg', { type: 'image/jpeg' });
        formData.append('thumbnail', thumbnailFile);
      }
      
      // Flag whether this is an auto-generated thumbnail
      formData.append('autoThumbnail', usesAutoThumbnail.toString());
      
      const response = await fetch('/api/videos', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload video');
      }
      
      // Success - clear form and reload videos
      showSuccess(`Video "${titleRef.current!.value}" uploaded successfully${usesAutoThumbnail ? ' with auto-generated thumbnail' : ''}`);
      if (titleRef.current) titleRef.current.value = '';
      if (descriptionRef.current) descriptionRef.current.value = '';
      
      // Reload videos
      loadVideos();
    } catch (error) {
      console.error('Error uploading video:', error);
      showError((error as Error).message || 'Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle video deletion
  const handleDeleteVideo = async (videoId: string, videoTitle: string) => {
    if (confirm(`Are you sure you want to delete the video "${videoTitle}"?`)) {
      setIsDeleting(videoId);
      
      try {
        const response = await fetch(`/api/videos?id=${videoId}`, {
          method: 'DELETE',
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete video');
        }
        
        showSuccess(`Video "${videoTitle}" deleted successfully`);
        
        // Remove from local state
        setVideos(videos.filter(v => v.id !== videoId));
      } catch (error) {
        console.error('Error deleting video:', error);
        showError((error as Error).message || 'Failed to delete video');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Preview video handler with safety checks
  const handlePreviewVideo = (videoSrc: string, videoTitle: string) => {
    // Before opening a new window or tab, pause all other videos playing in the current UI
    videoPlayerManager.pauseAllVideos();
    
    // Open the video in a new window
    const newWindow = window.open(videoSrc, '_blank');
    if (!newWindow) {
      // If popup is blocked, show a message
      showError('Unable to open video preview. Please check your popup blocker settings.');
    }
  };

  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-136px)]">
        <div className="text-xl text-yellow-400">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">Video Management</h1>
          <Link href="/admin/dashboard" className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700">
            Back to Dashboard
          </Link>
        </div>

        {/* Toast Notifications */}
        <NotificationToast
          message={successMessage || ''}
          type="success"
          isVisible={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
          autoClose={true}
          autoCloseDelay={5000}
        />
        
        <NotificationToast
          message={errorMessage || ''}
          type="error"
          isVisible={showErrorToast}
          onClose={() => setShowErrorToast(false)}
          autoClose={true}
          autoCloseDelay={5000}
        />

        {/* Video Upload Form */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 mb-8">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Upload New Video</h2>
          <div className="space-y-4">
            {/* Title and Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Video Title</label>
                <input 
                  type="text" 
                  ref={titleRef}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  placeholder="Enter video title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Video Description</label>
                <input 
                  type="text" 
                  ref={descriptionRef}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  placeholder="Enter video description"
                />
              </div>
            </div>
            
            {/* Video Uploader Component */}
            <VideoUploader 
              onFileSelect={handleFileSelection}
              isUploading={isUploading}
            />
          </div>
        </div>

        {/* Videos List */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Manage Videos ({videos.length})</h2>
          
          {isLoading ? (
            <p className="text-yellow-300 text-center py-6">Loading videos...</p>
          ) : videos.length === 0 ? (
            <p className="text-yellow-300 text-center py-6">No videos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((video) => (
                <div key={video.id} className="flex flex-col p-4 border border-gray-700 rounded-md bg-black">
                  <div className="relative w-full h-48 mb-2 bg-gray-800 flex items-center justify-center">
                    <Image 
                      src={video.thumbnailSrc} 
                      alt={video.title}
                      fill
                      className="object-cover rounded-md"
                    />
                    {video.autoThumbnail && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded">
                        Auto Thumbnail
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-yellow-400">{video.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{video.description}</p>
                  
                  <div className="flex justify-between mt-auto pt-2 border-t border-gray-700">
                    <button 
                      className="text-white hover:text-yellow-400"
                      onClick={() => handlePreviewVideo(video.src, video.title)}
                    >
                      Preview
                    </button>
                    <button 
                      className="text-red-400 hover:text-red-300"
                      disabled={isDeleting === video.id}
                      onClick={() => handleDeleteVideo(video.id, video.title)}
                    >
                      {isDeleting === video.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 