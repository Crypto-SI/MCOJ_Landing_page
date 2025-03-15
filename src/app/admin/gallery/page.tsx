'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  
  // Fetch gallery images including archived ones
  const loadGalleryImages = async () => {
    try {
      console.log('Fetching gallery images...');
      setIsLoading(true);
      
      const data = await fetchGalleryImages(true);
      
      console.log('Gallery images response:', data);
      
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
  const handleFileSelect = (position?: number) => {
    setSelectedPosition(position || null);
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    setSuccessMessage(null)
    
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

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setUploadError('File size exceeds 5MB limit.')
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
      setSelectedPosition(null)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

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
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to archive image');
      }

      setSuccessMessage(result.message || 'Image archived successfully!');
      
      // Refresh gallery images to ensure everything is up to date
      loadGalleryImages();
    } catch (error) {
      console.error('Error archiving image:', error)
      setActionError(error instanceof Error ? error.message : 'Failed to archive image')
    } finally {
      setIsArchiving(null)
    }
  }
  
  // Handle restoring an archived image to a specific position
  const handleRestoreImage = async (archivedImage: GalleryImage, position: number) => {
    setActionError(null)
    setSuccessMessage(null)
    setIsRestoring(archivedImage.id);

    try {
      console.log('Restoring archived image:', archivedImage.id, 'to position:', position);
      
      const result = await restoreClientImage(archivedImage.id, position);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to restore image');
      }

      setSuccessMessage(result.message || `Image restored to position ${position} successfully!`);
      
      // Refresh gallery images to ensure everything is up to date
      loadGalleryImages();
    } catch (error) {
      console.error('Error restoring image:', error)
      setActionError(error instanceof Error ? error.message : 'Failed to restore image')
    } finally {
      setIsRestoring(null)
    }
  }

  // Handle permanent deletion of an archived image
  const handleDeleteArchivedImage = async (archivedImage: GalleryImage) => {
    setActionError(null)
    setSuccessMessage(null)
    setIsDeleting(archivedImage.id);

    if (!confirm(`Are you sure you want to PERMANENTLY delete this archived image? This action cannot be undone.`)) {
      setIsDeleting(null)
      return
    }

    try {
      console.log('Deleting archived image:', archivedImage.id);
      
      const result = await deleteArchivedClientImage(archivedImage.id);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete archived image');
      }

      setSuccessMessage(result.message || 'Archived image permanently deleted!');
      
      // Refresh gallery images to ensure everything is up to date
      loadGalleryImages();
    } catch (error) {
      console.error('Error deleting archived image:', error)
      setActionError(error instanceof Error ? error.message : 'Failed to delete archived image')
    } finally {
      setIsDeleting(null)
    }
  }

  // Handle finalizing the gallery (update the public website)
  const handleFinalizeGallery = async () => {
    setActionError(null);
    setSuccessMessage(null);
    setIsFinalizing(true);

    if (galleryImages.length === 0) {
      setActionError('No images to finalize. Please add at least one image to the gallery.');
      setIsFinalizing(false);
      return;
    }

    if (!confirm('Are you sure you want to update the public website with these gallery images? This will replace the current gallery shown to visitors.')) {
      setIsFinalizing(false);
      return;
    }

    try {
      console.log('Finalizing gallery...');
      
      const result = await finalizeGallery();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to finalize gallery');
      }

      setSuccessMessage(`Gallery finalized successfully! The website now displays your ${result.imageCount} curated images.`);
      
    } catch (error) {
      console.error('Error finalizing gallery:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to finalize gallery');
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="space-y-6 text-yellow-400">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-yellow-400">Gallery Management</h1>
        <Link 
          href="/admin/dashboard"
          className="bg-gray-800 hover:bg-gray-900 text-yellow-400 px-4 py-2 rounded-md"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-900 border border-green-700 text-yellow-400 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}
      
      {uploadError && (
        <div className="bg-red-900 border border-red-700 text-yellow-400 px-4 py-3 rounded">
          Upload Error: {uploadError}
        </div>
      )}
      
      {actionError && (
        <div className="bg-red-900 border border-red-700 text-yellow-400 px-4 py-3 rounded">
          Action Error: {actionError}
        </div>
      )}

      {/* Image Upload Section */}
      <div className="bg-gray-900 p-6 rounded-lg shadow-md border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-yellow-400">Upload New Image</h2>
        <div className="mb-4 bg-black p-4 rounded-md border border-gray-700">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Image Requirements:</h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-300">
            <li>Formats: JPG or PNG (JPEG preferred for photos)</li>
            <li>Ideal resolution: 1200×800 pixels (landscape orientation)</li>
            <li>Minimum resolution: 800×600 pixels</li>
            <li>Maximum file size: 5MB</li>
            <li>Maximum 8 images in the gallery at once</li>
            <li>Images will be automatically resized to fit if needed (aspect ratio preserved)</li>
          </ul>
        </div>
        <div 
          className="border-dashed border-2 border-gray-600 p-6 rounded-md text-center bg-black"
          onClick={() => handleFileSelect()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/jpeg,image/jpg,image/png"
          />
          <p className="mb-4 text-yellow-300">Drag and drop an image here, or click to select a file</p>
          <button 
            onClick={(e) => {
              e.stopPropagation() // Prevent double selection
              handleFileSelect()
            }}
            disabled={isUploading || galleryImages.length >= 8}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-md font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : galleryImages.length >= 8 ? 'Gallery Full' : 'Select Image'}
          </button>
          {galleryImages.length >= 8 && (
            <p className="mt-2 text-red-400">Gallery is full. Archive some images to make space.</p>
          )}
          <p className="mt-2 text-sm text-yellow-200">Images will be processed automatically to fit the gallery</p>
        </div>
      </div>

      {/* Gallery Status */}
      <div className="bg-black p-4 rounded-md border border-gray-700 my-4">
        <div className="flex justify-between items-center">
          <p className="text-yellow-400 font-semibold">Gallery Status: {galleryImages.length}/8 images active, {archivedImages.length} images in archive</p>
          
          {/* Finalize Gallery Button */}
          <button
            onClick={handleFinalizeGallery}
            disabled={isFinalizing || galleryImages.length === 0}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-md font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFinalizing ? 'Finalizing...' : 'FINALISE GALLERY'}
          </button>
        </div>
        {galleryImages.length === 0 && (
          <p className="text-red-400 mt-2">Add at least one image to finalize the gallery.</p>
        )}
      </div>

      {/* Gallery Images Grid */}
      <div className="bg-gray-900 p-6 rounded-lg shadow-md border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-yellow-400">Active Gallery Images ({galleryImages.length}/8)</h2>
        
        {isLoading ? (
          <p className="text-yellow-300 text-center py-6">Loading gallery images...</p>
        ) : galleryImages.length === 0 ? (
          <p className="text-yellow-300 text-center py-6">No images in the gallery yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {GALLERY_PLACEHOLDERS.map((placeholder, index) => {
              const position = index + 1;
              const image = galleryImages.find(img => img.placeholderPosition === position);
              
              return (
                <div key={position} className="flex flex-col p-4 border border-gray-700 rounded-md bg-black">
                  <div className="relative w-full h-48 mb-2 bg-gray-800 flex items-center justify-center">
                    {image ? (
                      <Image 
                        src={image.src} 
                        alt={image.alt}
                        fill
                        className="object-cover rounded-md"
                      />
                    ) : (
                      <div className="text-gray-600">Empty Slot {position}</div>
                    )}
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-sm">
                      Position {position}
                    </div>
                  </div>
                  <div className="mt-2 flex-grow">
                    {image ? (
                      <>
                        <p className="font-medium text-yellow-400">Gallery Image {position}</p>
                        <p className="text-sm text-yellow-300 truncate">{image.id}</p>
                      </>
                    ) : (
                      <p className="font-medium text-gray-500">Empty Position</p>
                    )}
                  </div>
                  <div className="mt-4 flex justify-between">
                    {image ? (
                      <button 
                        onClick={() => handleArchiveImage(image)}
                        disabled={isArchiving === position}
                        className="px-3 py-1 text-red-400 hover:bg-red-900 hover:text-red-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isArchiving === position ? 'Archiving...' : 'Archive'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleFileSelect(position)}
                        disabled={isUploading}
                        className="px-3 py-1 text-green-400 hover:bg-green-900 hover:text-green-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading && selectedPosition === position ? 'Uploading...' : 'Add Image'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Archived Images Section */}
      <div className="bg-gray-900 p-6 rounded-lg shadow-md border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-yellow-400">
          Archived Images ({archivedImages.length})
          <span className="text-sm font-normal ml-2 text-yellow-300">
            Images that have been removed from the gallery but are still available to restore
          </span>
        </h2>
        
        {isLoading ? (
          <p className="text-yellow-300 text-center py-6">Loading archived images...</p>
        ) : archivedImages.length === 0 ? (
          <p className="text-yellow-300 text-center py-6">No archived images.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {archivedImages.map((image) => {
              // Find available positions for restoring
              const usedPositions = galleryImages.map(img => img.placeholderPosition || 0);
              const nextAvailable = findAvailablePosition(usedPositions);
              
              return (
                <div key={image.id} className="flex flex-col p-4 border border-gray-700 rounded-md bg-black">
                  <div className="relative w-full h-48 mb-2">
                    <Image 
                      src={image.src} 
                      alt={image.alt}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  <div className="mt-2 flex-grow">
                    <p className="font-medium text-yellow-400">Archived Image</p>
                    <p className="text-sm text-yellow-300 truncate">{image.id}</p>
                  </div>
                  <div className="mt-4 space-y-2">
                    {nextAvailable ? (
                      <button 
                        onClick={() => handleRestoreImage(image, nextAvailable)}
                        disabled={isRestoring === image.id}
                        className="w-full px-3 py-1 text-green-400 bg-gray-800 hover:bg-green-900 hover:text-green-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRestoring === image.id ? 'Restoring...' : `Restore to Position ${nextAvailable}`}
                      </button>
                    ) : (
                      <p className="text-sm text-red-400">Gallery full. Archive an image first.</p>
                    )}
                    
                    <button 
                      onClick={() => handleDeleteArchivedImage(image)}
                      disabled={isDeleting === image.id}
                      className="w-full px-3 py-1 text-red-400 bg-gray-800 hover:bg-red-900 hover:text-red-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting === image.id ? 'Deleting...' : 'Delete Permanently'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
} 