'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { fetchVideos, fetchArchivedVideos, toggleVideoArchiveStatus } from '@/utils/videoClientUtils'
import type { GalleryVideo } from '@/utils/videoClientUtils'
import VideoUploader from '@/components/VideoUploader'
import NotificationToast from '@/components/NotificationToast'
import videoPlayerManager from '@/utils/videoPlayerManager'
import supabaseAdmin from '@/utils/supabaseAdmin'

export default function VideoManagement() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeVideos, setActiveVideos] = useState<GalleryVideo[]>([])
  const [archivedVideos, setArchivedVideos] = useState<GalleryVideo[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isArchiving, setIsArchiving] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'orphaned'>('active')
  const [orphanedFiles, setOrphanedFiles] = useState<{
    orphanedVideos: any[];
    orphanedThumbnails: any[];
    totalStorageFiles: number;
    totalDbRecords: number;
  } | null>(null)
  const [isLoadingOrphaned, setIsLoadingOrphaned] = useState(false)
  
  // Toast notification states
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Form refs for title and description
  const titleRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLInputElement>(null)
  const isArchivedRef = useRef<HTMLInputElement>(null)
  
  const router = useRouter()
  
  // Fetch videos
  const loadVideos = async () => {
    try {
      console.log('Fetching videos...');
      setIsLoading(true);
      
      // Fetch both active and archived videos
      const fetchedActiveVideos = await fetchVideos(false);
      const fetchedArchivedVideos = await fetchArchivedVideos();
      
      setActiveVideos(fetchedActiveVideos || []);
      setArchivedVideos(fetchedArchivedVideos || []);
      
      console.log(`Loaded ${fetchedActiveVideos?.length || 0} active videos`);
      console.log(`Loaded ${fetchedArchivedVideos?.length || 0} archived videos`);
      
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
      
      // Flag whether this video should be archived immediately
      if (isArchivedRef.current?.checked) {
        formData.append('is_archived', 'true');
      }
      
      const response = await fetch('/api/videos', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload video');
      }
      
      // Success - clear form and reload videos
      const archivedStatus = isArchivedRef.current?.checked ? ' and archived' : '';
      showSuccess(`Video "${titleRef.current!.value}" uploaded successfully${usesAutoThumbnail ? ' with auto-generated thumbnail' : ''}${archivedStatus}`);
      if (titleRef.current) titleRef.current.value = '';
      if (descriptionRef.current) descriptionRef.current.value = '';
      if (isArchivedRef.current) isArchivedRef.current.checked = false;
      
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
        setActiveVideos(activeVideos.filter(v => v.id !== videoId));
        setArchivedVideos(archivedVideos.filter(v => v.id !== videoId));
      } catch (error) {
        console.error('Error deleting video:', error);
        showError((error as Error).message || 'Failed to delete video');
      } finally {
        setIsDeleting(null);
      }
    }
  };
  
  // Handle toggling archive status
  const handleToggleArchiveStatus = async (video: GalleryVideo) => {
    setIsArchiving(video.id);
    
    try {
      const newArchiveStatus = !video.is_archived;
      const action = newArchiveStatus ? 'archive' : 'unarchive';
      
      const success = await toggleVideoArchiveStatus(video.id, newArchiveStatus);
      
      if (!success) {
        throw new Error(`Failed to ${action} video`);
      }
      
      showSuccess(`Video "${video.title}" ${newArchiveStatus ? 'archived' : 'unarchived'} successfully`);
      
      // Update local state based on the new status
      if (newArchiveStatus) {
        // Video was archived
        setActiveVideos(activeVideos.filter(v => v.id !== video.id));
        setArchivedVideos([...archivedVideos, {...video, is_archived: true}]);
      } else {
        // Video was unarchived
        setArchivedVideos(archivedVideos.filter(v => v.id !== video.id));
        setActiveVideos([...activeVideos, {...video, is_archived: false}]);
      }
    } catch (error) {
      console.error('Error toggling archive status:', error);
      showError((error as Error).message || 'Failed to update video');
    } finally {
      setIsArchiving(null);
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

  // Load orphaned files
  const loadOrphanedFiles = async () => {
    try {
      setIsLoadingOrphaned(true);
      const response = await fetch('/api/videos?storageOnly=true');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orphaned files');
      }
      
      setOrphanedFiles(data);
    } catch (error) {
      console.error('Error loading orphaned files:', error);
      showError((error as Error).message || 'Failed to load orphaned files');
    } finally {
      setIsLoadingOrphaned(false);
    }
  };

  // Clean up orphaned files
  const handleCleanupOrphanedFiles = async () => {
    if (!orphanedFiles) return;
    
    if (!confirm(`Are you sure you want to delete ${orphanedFiles.orphanedVideos.length} orphaned videos and ${orphanedFiles.orphanedThumbnails.length} orphaned thumbnails? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setIsLoadingOrphaned(true);
      
      // Call the API endpoint to clean up orphaned files
      const response = await fetch('/api/videos/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orphanedVideos: orphanedFiles.orphanedVideos,
          orphanedThumbnails: orphanedFiles.orphanedThumbnails
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to clean up orphaned files');
      }
      
      // Check for partial success with some errors
      if (result.errors && result.errors.length > 0) {
        console.warn('Some files could not be deleted:', result.errors);
        showError(`Cleaned up files with some errors. Check console for details.`);
      } else {
        showSuccess(`Cleaned up ${result.deletedVideos.length} orphaned videos and ${result.deletedThumbnails.length} orphaned thumbnails`);
      }
      
      // Reload the orphaned files list
      await loadOrphanedFiles();
    } catch (error) {
      console.error('Error cleaning up orphaned files:', error);
      showError((error as Error).message || 'Failed to clean up orphaned files');
    } finally {
      setIsLoadingOrphaned(false);
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
  
  // Determine which videos to display based on active tab
  const videosToDisplay = activeTab === 'active' ? activeVideos : archivedVideos;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Toast notifications */}
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

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">Video Management</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'active' ? 'bg-yellow-600' : 'bg-gray-700'
              }`}
            >
              Active Videos
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'archived' ? 'bg-yellow-600' : 'bg-gray-700'
              }`}
            >
              Archived Videos
            </button>
            <button
              onClick={() => {
                setActiveTab('orphaned');
                loadOrphanedFiles();
              }}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'orphaned' ? 'bg-yellow-600' : 'bg-gray-700'
              }`}
            >
              Orphaned Files
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-900/30 border border-red-500 rounded-md p-4 mb-6">
            <p className="text-red-300">{errorMessage}</p>
          </div>
        )}

        {activeTab === 'orphaned' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-yellow-400">Orphaned Files</h2>
              {orphanedFiles && (
                <button
                  onClick={handleCleanupOrphanedFiles}
                  disabled={isLoadingOrphaned || (!orphanedFiles.orphanedVideos.length && !orphanedFiles.orphanedThumbnails.length)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingOrphaned ? 'Cleaning up...' : 'Clean up all orphaned files'}
                </button>
              )}
            </div>
            
            {isLoadingOrphaned ? (
              <div className="text-center py-8">Loading orphaned files...</div>
            ) : orphanedFiles ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">Storage Statistics</h3>
                    <p>Total files in storage: {orphanedFiles.totalStorageFiles}</p>
                    <p>Total database records: {orphanedFiles.totalDbRecords}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">Orphaned Files</h3>
                    <p>Orphaned videos: {orphanedFiles.orphanedVideos.length}</p>
                    <p>Orphaned thumbnails: {orphanedFiles.orphanedThumbnails.length}</p>
                  </div>
                </div>
                
                {orphanedFiles.orphanedVideos.length > 0 && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-4">Orphaned Videos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {orphanedFiles.orphanedVideos.map((video) => (
                        <div key={video.name} className="bg-gray-700 rounded-lg p-4">
                          <p className="text-sm text-gray-300">{video.name}</p>
                          <p className="text-xs text-gray-400 mt-1">Size: {(video.metadata.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {orphanedFiles.orphanedThumbnails.length > 0 && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-4">Orphaned Thumbnails</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {orphanedFiles.orphanedThumbnails.map((thumbnail) => (
                        <div key={thumbnail.name} className="bg-gray-700 rounded-lg p-4">
                          <p className="text-sm text-gray-300">{thumbnail.name}</p>
                          <p className="text-xs text-gray-400 mt-1">Size: {(thumbnail.metadata.size / 1024).toFixed(2)} KB</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {!orphanedFiles.orphanedVideos.length && !orphanedFiles.orphanedThumbnails.length && (
                  <div className="text-center py-8 text-gray-400">
                    No orphaned files found. All storage files have corresponding database records.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Click the "Orphaned Files" tab to load the list of orphaned files.
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Existing upload form */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
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
                
                {/* Archive Option */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="archive-new-video"
                    ref={isArchivedRef}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="archive-new-video" className="ml-2 text-sm font-medium text-gray-300">
                    Add to archive (won't appear on public site)
                  </label>
                </div>
                
                {/* Video Uploader Component */}
                <VideoUploader 
                  onFileSelect={handleFileSelection}
                  isUploading={isUploading}
                />
              </div>
            </div>

            {/* Active/Archived videos section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-yellow-400 mb-4">
                {activeTab === 'active' ? 'Active Videos' : 'Archived Videos'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videosToDisplay.map((video) => (
                  <div key={video.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                    <div className="aspect-video relative">
                      <img
                        src={video.thumbnailSrc}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleArchiveStatus(video)}
                            disabled={isArchiving === video.id}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md text-sm disabled:opacity-50"
                          >
                            {isArchiving === video.id ? 'Processing...' : video.is_archived ? 'Unarchive' : 'Archive'}
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(video.id, video.title)}
                            disabled={isDeleting === video.id}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm disabled:opacity-50"
                          >
                            {isDeleting === video.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-yellow-400">{video.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{video.description}</p>
                      {!video.is_archived && video.order_index !== undefined && (
                        <div className="mt-2 flex items-center text-sm text-gray-400">
                          <span>Position: {video.order_index + 1}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 