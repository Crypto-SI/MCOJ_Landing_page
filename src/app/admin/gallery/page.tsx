'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import OptimizedImageUploader from '@/components/OptimizedImageUploader'
import StandaloneImageOptimizer from '@/components/StandaloneImageOptimizer'
import { 
  GalleryImage, 
  GALLERY_PLACEHOLDERS,
  fetchGalleryImages,
  archiveImage as archiveClientImage,
  restoreImage as restoreClientImage,
  deleteArchivedImage as deleteArchivedClientImage,
  findAvailablePosition,
  finalizeGallery
} from '@/utils/galleryClientUtils'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function GalleryManagement() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [archivedImages, setArchivedImages] = useState<GalleryImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isArchiving, setIsArchiving] = useState<number | null>(null)
  const [isRestoring, setIsRestoring] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<number>(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [oversizedFile, setOversizedFile] = useState<File | null>(null)
  const [showOptimizer, setShowOptimizer] = useState(false)
  const [activeTab, setActiveTab] = useState<'gallery' | 'archived' | 'orphaned'>('gallery')
  const [orphanedFiles, setOrphanedFiles] = useState<{
    orphanedFiles: Array<{ name: string; size: number; path: string }>;
    archivedFiles: Array<{ name: string; size: number; path: string }>;
    totalOrphaned: number;
    totalArchived: number;
  } | null>(null)
  const [isLoadingOrphaned, setIsLoadingOrphaned] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  
  // Fetch gallery images including archived ones
  const loadGalleryImages = async () => {
    try {
      console.log('Fetching gallery images...');
      setIsLoading(true);
      
      // Clear existing gallery data to ensure fresh state
      setGalleryImages([]);
      
      const data = await fetchGalleryImages(true);
      
      console.log('Gallery images response:', data);
      
      // Update with fresh gallery data
      setGalleryImages(data.images || []);
      console.log(`Loaded ${data.images?.length || 0} active gallery images`);
      
      setArchivedImages(data.archivedImages || []);
      console.log(`Loaded ${data.archivedImages?.length || 0} archived gallery images`);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
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
      // Fetch gallery images once authenticated
      loadGalleryImages()
    }
  }, [router])

  // Clear all messages after 5 seconds
  useEffect(() => {
    if (successMessage || uploadError || actionError) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setUploadError(null);
        setActionError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage, uploadError, actionError]);

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

  // Handle file selection
  const handleFileSelect = (position: number) => {
    setSelectedPosition(position);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file upload (with size check)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    setSuccessMessage(null)
    setOversizedFile(null)
    
    const file = e.target.files?.[0]
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only JPEG and PNG are supported.')
      return
    }

    // Validate file size (1MB max for direct upload)
    const maxSize = 1 * 1024 * 1024 // 1MB
    if (file.size > maxSize) {
      console.log('File too large, showing optimization option');
      setOversizedFile(file);
      setUploadError(`Image size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds 1MB limit. Please optimize it first.`);
      return
    }

    setIsUploading(true)
    
    try {
      console.log('Creating form data...');
      const formData = new FormData()
      formData.append('file', file)
      
      // If a specific position was selected, include it
      if (selectedPosition !== null) {
        console.log('Using selected position:', selectedPosition);
        formData.append('position', selectedPosition.toString())
      }

      console.log('Sending upload request...');
      const response = await fetch('/api/gallery/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('Upload response status:', response.status);
      const result = await response.json()
      console.log('Upload response data:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload image')
      }

      // Show success message, include warning if present
      if (result.warning) {
        setSuccessMessage(`Image uploaded to position ${result.image.placeholderPosition}, but with a note: ${result.warning}`)
      } else {
        setSuccessMessage(`Image uploaded to position ${result.image.placeholderPosition} successfully!`)
      }
      
      // Refresh gallery images to ensure everything is up to date
      loadGalleryImages();
    } catch (error) {
      console.error('Error uploading image:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
      setSelectedPosition(0)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  
  // Handle optimized image uploaded - fix type safety issue
  const handleOptimizedImageUploaded = async (optimizedFile: File) => {
    if (selectedPosition === 0) {
      console.error('No position selected for optimized image');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadError(null);
      
      // Create a FormData object for the file upload API
      const formData = new FormData();
      formData.append('file', optimizedFile);
      formData.append('position', selectedPosition.toString());
      
      // Use our existing API endpoint for uploads
      console.log('Sending upload request for optimized image...');
      const response = await fetch('/api/gallery/upload', {
        method: 'POST',
        body: formData,
      });
      
      console.log('Upload response status:', response.status);
      const result = await response.json();
      console.log('Upload response data:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload optimized image');
      }
      
      // Show success message
      setSuccessMessage(`Optimized image uploaded to position ${result.image.placeholderPosition} successfully!`);
      
      // Refresh gallery images
      loadGalleryImages();
    } catch (error) {
      console.error('Error uploading optimized image:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload optimized image');
    } finally {
      setIsUploading(false);
      setSelectedPosition(0);
      setOversizedFile(null);
    }
  };

  // Handle archiving an image (move from gallery to archive)
  const handleArchiveImage = async (image: GalleryImage) => {
    setActionError(null)
    setSuccessMessage(null)
    
    if (!image.placeholderPosition) {
      setActionError('Cannot archive this image: missing position information');
      return;
    }
    
    setIsArchiving(image.placeholderPosition);

    if (!confirm(`Are you sure you want to archive this image? It will be removed from the gallery but can be restored later.`)) {
      setIsArchiving(null)
      return
    }

    try {
      console.log('Archiving image at position:', image.placeholderPosition);
      
      const result = await archiveClientImage(image.placeholderPosition);
      
      if (result.success) {
        setSuccessMessage(`Image at position ${image.placeholderPosition} archived successfully`);
        loadGalleryImages();
      } else {
        setActionError(result.message || 'Failed to archive image');
      }
    } catch (error) {
      console.error('Error archiving image:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to archive image');
    } finally {
      setIsArchiving(null);
    }
  }
  
  // Handle restoring an image from archive to gallery
  const handleRestoreImage = async (archivedImage: GalleryImage, position: number) => {
    setActionError(null)
    setSuccessMessage(null)
    
    // Check if the image ID is valid
    if (!archivedImage.id) {
      setActionError('Cannot restore this image: missing ID');
      return;
    }
    
    setIsRestoring(archivedImage.id);

    try {
      console.log('Restoring image to position:', position);
      
      const result = await restoreClientImage(archivedImage.id, position);
      
      if (result.success) {
        setSuccessMessage(`Image restored to position ${position} successfully`);
        loadGalleryImages();
      } else {
        setActionError(result.message || 'Failed to restore image');
      }
    } catch (error) {
      console.error('Error restoring image:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to restore image');
    } finally {
      setIsRestoring(null);
    }
  }

  // Handle permanently deleting an archived image
  const handleDeleteArchivedImage = async (archivedImage: GalleryImage) => {
    setActionError(null)
    setSuccessMessage(null)
    
    // Check if the image ID is valid
    if (!archivedImage.id) {
      setActionError('Cannot delete this image: missing ID');
      return;
    }
    
    if (!confirm(`Are you sure you want to permanently delete this image? This action cannot be undone.`)) {
      return
    }
    
    setIsDeleting(archivedImage.id);

    try {
      console.log('Deleting archived image:', archivedImage.id);
      
      const result = await deleteArchivedClientImage(archivedImage.id);
      
      if (result.success) {
        setSuccessMessage(`Image deleted successfully`);
        loadGalleryImages();
      } else {
        setActionError(result.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to delete image');
    } finally {
      setIsDeleting(null);
    }
  }

  // Handle finalizing the gallery (update the Gallery component)
  const handleFinalizeGallery = async () => {
    setActionError(null)
    setSuccessMessage(null)
    
    if (!confirm(`Are you sure you want to finalize the gallery? This will update the public-facing website.`)) {
      return
    }
    
    setIsFinalizing(true);

    try {
      console.log('Finalizing gallery...');
      
      const result = await finalizeGallery();
      
      if (result.success) {
        setSuccessMessage(`Gallery finalized successfully. Changes are now live on the public site.`);
      } else {
        setActionError(result.message || 'Failed to finalize gallery');
      }
    } catch (error) {
      console.error('Error finalizing gallery:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to finalize gallery');
    } finally {
      setIsFinalizing(false);
    }
  }

  // Load orphaned files
  const loadOrphanedFiles = async () => {
    try {
      setIsLoadingOrphaned(true);
      const response = await fetch('/api/gallery/orphaned');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orphaned files');
      }
      
      setOrphanedFiles(data);
    } catch (error) {
      console.error('Error loading orphaned files:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to load orphaned files');
    } finally {
      setIsLoadingOrphaned(false);
    }
  };

  // Clean up orphaned files
  const handleCleanupOrphanedFiles = async (files: string[]) => {
    if (!confirm(`Are you sure you want to delete ${files.length} orphaned files? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setIsLoadingOrphaned(true);
      
      const response = await fetch('/api/gallery/orphaned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filesToDelete: files
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to clean up orphaned files');
      }
      
      // Check for partial success with some errors
      if (result.errors && result.errors.length > 0) {
        console.warn('Some files could not be deleted:', result.errors);
        setActionError(`Cleaned up files with some errors. Check console for details.`);
      } else {
        setSuccessMessage(`Cleaned up ${result.deletedFiles.length} orphaned files`);
      }
      
      // Reload the orphaned files list
      await loadOrphanedFiles();
    } catch (error) {
      console.error('Error cleaning up orphaned files:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to clean up orphaned files');
    } finally {
      setIsLoadingOrphaned(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Gallery Management</h1>
      
      {/* Hidden file input for image uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
      />
      
      {/* Messages */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-md">
          <p className="text-green-200">{successMessage}</p>
        </div>
      )}
      {uploadError && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-md">
          <div className="flex flex-col gap-3">
            <p className="text-red-200">{uploadError}</p>
            {oversizedFile && (
              <div>
                <button 
                  onClick={() => setShowOptimizer(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-md font-medium"
                >
                  Open Image Optimizer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {actionError && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-md">
          <p className="text-red-200">{actionError}</p>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'gallery' ? 'bg-yellow-600' : 'bg-gray-700'
            }`}
          >
            Gallery
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'archived' ? 'bg-yellow-600' : 'bg-gray-700'
            }`}
          >
            Archived
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

      {/* Content based on active tab */}
      {activeTab === 'orphaned' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-yellow-400">Orphaned Files</h2>
            {orphanedFiles && orphanedFiles.orphanedFiles.length > 0 && (
              <button
                onClick={() => handleCleanupOrphanedFiles(orphanedFiles.orphanedFiles.map(f => f.name))}
                disabled={isLoadingOrphaned}
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
                  <p>Total orphaned files: {orphanedFiles.totalOrphaned}</p>
                  <p>Total archived files: {orphanedFiles.totalArchived}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">Total Storage</h3>
                  <p>Orphaned: {(orphanedFiles.orphanedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB</p>
                  <p>Archived: {(orphanedFiles.archivedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              
              {orphanedFiles.orphanedFiles.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-4">Orphaned Files</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orphanedFiles.orphanedFiles.map((file) => (
                      <div key={file.name} className="bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-300">{file.name}</p>
                        <p className="text-xs text-gray-400 mt-1">Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        <button
                          onClick={() => handleCleanupOrphanedFiles([file.name])}
                          className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {orphanedFiles.archivedFiles.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-4">Archived Files</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orphanedFiles.archivedFiles.map((file) => (
                      <div key={file.name} className="bg-gray-700 rounded-lg p-4">
                        <p className="text-sm text-gray-300">{file.name}</p>
                        <p className="text-xs text-gray-400 mt-1">Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!orphanedFiles.orphanedFiles.length && !orphanedFiles.archivedFiles.length && (
                <div className="text-center py-8 text-gray-400">
                  No orphaned or archived files found.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Click the "Orphaned Files" tab to load the list of orphaned files.
            </div>
          )}
        </div>
      ) : activeTab === 'archived' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-yellow-400">Archived Images</h2>
          </div>
          
          {archivedImages.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {archivedImages.map((image) => (
                  <div 
                    key={image.id || 'unknown'} 
                    className="relative aspect-video bg-gray-800 rounded-md overflow-hidden"
                  >
                    <Image
                      src={image.src}
                      alt="Archived image"
                      fill
                      className="object-cover"
                    />
                    
                    {/* Restore and Delete buttons */}
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white mb-2">Restore to position:</p>
                      <div className="flex flex-wrap justify-center gap-1 mb-3">
                        {GALLERY_PLACEHOLDERS.map((filename, index) => {
                          const position = index + 1;
                          const isUsed = galleryImages.some(img => img.placeholderPosition === position);
                          return (
                            <button
                              key={`restore-${image.id || 'unknown'}-to-${position}`}
                              type="button"
                              onClick={() => handleRestoreImage(image, position)}
                              disabled={isUsed || isRestoring === image.id}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                                ${isUsed 
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                  : 'bg-green-600 text-white hover:bg-green-700'}`}
                            >
                              {position}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteArchivedImage(image)}
                        disabled={isDeleting === image.id}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm mt-2"
                      >
                        {isDeleting === image.id ? 'Deleting...' : 'Delete Permanently'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No archived images found.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-yellow-400">Current Gallery Layout</h2>
            <div className="flex items-center gap-4">
              {isLoading && (
                <div className="text-yellow-400 text-sm flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing Gallery...
                </div>
              )}
              <button
                onClick={handleFinalizeGallery}
                disabled={isFinalizing}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFinalizing ? 'FINALISING...' : 'FINALISE GALLERY'}
              </button>
            </div>
          </div>
          
          <p className="text-gray-300 mb-4">
            Click on any position to upload a new image or replace the existing one. Images over 1MB will be automatically optimized.
            Changes will not appear on the public site until you click &quot;FINALISE GALLERY&quot;.
          </p>
          
          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {GALLERY_PLACEHOLDERS.map((filename, index) => {
              const position = index + 1;
              const image = galleryImages.find(img => img.placeholderPosition === position);
              
              return (
                <div 
                  key={`position-${position}`} 
                  className="relative aspect-video bg-gray-800 rounded-md overflow-hidden"
                >
                  {/* Position Number */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md z-10">
                    {position}
                  </div>
                  
                  {/* Image or Placeholder */}
                  {image ? (
                    <>
                      {/* This is the image */}
                      <Image
                        src={image.src}
                        alt={`Gallery position ${position}`}
                        fill
                        className="object-cover"
                      />
                      
                      {/* Control Buttons */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <button 
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            onClick={() => handleFileSelect(position)}
                          >
                            Replace Image
                          </button>
                          <button
                            type="button"
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            onClick={() => handleArchiveImage(image)}
                          >
                            {isArchiving === position ? 'Archiving...' : 'Archive Image'}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Empty slot
                    <div 
                      className="flex flex-col items-center justify-center h-full cursor-pointer p-4"
                      onClick={() => handleFileSelect(position)}
                    >
                      <div className="text-gray-400 mb-3">Empty Position</div>
                      <button 
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Upload Image
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="mt-8 text-center">
        <Link href="/admin/dashboard" className="text-yellow-400 hover:text-yellow-300">
          ← Back to Dashboard
        </Link>
      </div>
      
      {/* Image Optimizer Modal */}
      {showOptimizer && oversizedFile && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-yellow-400">Image Optimizer</h3>
              <button 
                onClick={() => setShowOptimizer(false)}
                className="text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>
            
            <StandaloneImageOptimizer 
              initialFile={oversizedFile}
              position={selectedPosition}
              onSuccess={(optimizedImage) => {
                setShowOptimizer(false);
                handleOptimizedImageUploaded(optimizedImage);
              }}
              onCancel={() => setShowOptimizer(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
} 