'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

// Add a GalleryAddCallback type for the callback function
type GalleryAddCallback = (data: {
  src: string;
  position: number;
  filename: string;
}) => Promise<void>;

// Update the component props to include the callback function
interface StandaloneImageOptimizerProps {
  onAddToGallery?: GalleryAddCallback;
  initialFile?: File;
  position?: number;
  onSuccess?: (optimizedFile: File) => void;
  onCancel?: () => void;
}

export default function StandaloneImageOptimizer({ 
  onAddToGallery, 
  initialFile, 
  position = 1,
  onSuccess,
  onCancel
}: StandaloneImageOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAddingToGallery, setIsAddingToGallery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number>(position);
  const [optimizedImage, setOptimizedImage] = useState<{
    originalSize: number;
    optimizedSize: number;
    compressionRate: number;
    src: string;
    filename: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Determine if we're in standalone mode or modal/callback mode
  const isCallbackMode = !!onSuccess;
  
  // Process the initialFile when provided
  useEffect(() => {
    if (initialFile) {
      // Set file info
      setSelectedFileSize(initialFile.size);
      setSelectedFileName(initialFile.name);
      
      // Create preview
      const previewUrl = URL.createObjectURL(initialFile);
      setPreview(previewUrl);
      
      // Clean up preview URL when component unmounts
      return () => {
        URL.revokeObjectURL(previewUrl);
      };
    }
  }, [initialFile]);
  
  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }
    
    // Validate file size - allow up to 15MB for optimization
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      setError(`File size exceeds 15MB limit.`);
      return;
    }
    
    // Store the file size and name for display and download
    setSelectedFileSize(file.size);
    setSelectedFileName(file.name);
    setOptimizedImage(null);
    
    // Clear previous errors and set preview
    setError(null);
    
    // Create local preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  };
  
  // Handle form submission
  const handleOptimize = async () => {
    // Use initialFile or get from input
    const file = initialFile || (fileInputRef.current?.files?.[0]);
    
    if (!file) {
      setError('Please select an image to optimize.');
      return;
    }
    
    setIsOptimizing(true);
    setError(null);
    
    try {
      // Create FormData for API request
      const formData = new FormData();
      formData.append('image', file);
      formData.append('destination', 'gallery'); // Use existing gallery bucket
      
      // Call the optimization API
      const response = await fetch('/api/optimize-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to optimize image');
      }
      
      const data = await response.json();
      
      // Update optimization stats
      setOptimizedImage({
        originalSize: data.originalSize,
        optimizedSize: data.optimizedSize,
        compressionRate: data.compressionRate,
        src: data.src,
        filename: data.filename
      });
      
    } catch (err) {
      console.error('Error optimizing image:', err);
      setError(err instanceof Error ? err.message : 'Failed to optimize image');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handle adding the optimized image to the gallery
  const handleAddToGallery = async () => {
    if (!optimizedImage || !onAddToGallery) return;
    
    setIsAddingToGallery(true);
    setError(null);
    
    try {
      await onAddToGallery({
        src: optimizedImage.src,
        position: selectedPosition,
        filename: optimizedImage.filename
      });
      
      // Show success message
      setError(null);
      alert(`Image successfully added to gallery position ${selectedPosition}`);
      
      // Reset form to allow optimizing another image
      setOptimizedImage(null);
      setPreview(null);
      setSelectedFileSize(null);
      setSelectedFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error adding to gallery:', err);
      setError(err instanceof Error ? err.message : 'Failed to add image to gallery');
    } finally {
      setIsAddingToGallery(false);
    }
  };
  
  // Format bytes to human-readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Modified download function to also support sending back the optimized file
  const handleDownload = async (saveLocally = true) => {
    if (!optimizedImage) return;
    
    try {
      // Fetch the actual image data from the URL
      const response = await fetch(optimizedImage.src);
      if (!response.ok) {
        throw new Error('Failed to download the optimized image');
      }
      
      // Get the blob data
      const blob = await response.blob();
      
      if (saveLocally) {
        // Create a local URL for the blob
        const blobUrl = URL.createObjectURL(blob);
        
        // Create a temporary link to download the image
        const link = document.createElement('a');
        link.href = blobUrl;
        
        // Process the original filename - remove UUID and timestamp
        // Extract original file name from the Supabase filename
        const originalFilename = imageNameFromFilePath(selectedFileName || optimizedImage.filename);
        
        // Add _optimized before the extension
        const filenameParts = originalFilename.split('.');
        const extension = filenameParts.pop() || 'jpg';
        const nameWithoutExtension = filenameParts.join('.');
        const cleanName = `${nameWithoutExtension}_optimized.${extension}`;
        
        link.download = cleanName;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }
      
      // If onSuccess callback is provided, call it with the optimized file
      if (onSuccess) {
        // Convert blob to File object
        const optimizedFile = new File([blob], 
          optimizedImage.filename || 'optimized_image.jpg', 
          { type: 'image/jpeg' }
        );
        onSuccess(optimizedFile);
      }
    } catch (error) {
      console.error('Error processing optimized image:', error);
      setError('Failed to process the optimized image.');
    }
  };
  
  // Helper function to get clean filename from path
  const imageNameFromFilePath = (filepath: string): string => {
    // Remove any path information (in case there's a path)
    let filename = filepath.split('/').pop() || filepath;
    
    // Remove any timestamp or UUID parts (anything with underscore followed by numbers)
    const timestampPattern = /_\d+\./;
    if (timestampPattern.test(filename)) {
      const parts = filename.split('_');
      // Keep only the parts before the timestamp
      const relevantParts = [];
      for (const part of parts) {
        if (/^\d+\./.test(part)) {
          // This part starts with numbers followed by a dot - it's likely our timestamp
          // Add the extension and break
          relevantParts.push(part.substring(part.indexOf('.')));
          break;
        }
        relevantParts.push(part);
      }
      filename = relevantParts.join('_');
    }
    
    // If it starts with 'optimized_', remove it
    if (filename.startsWith('optimized_')) {
      filename = filename.substring(10);
    }
    
    return filename;
  };
  
  return (
    <div className="standalone-image-optimizer p-5 bg-gray-900 rounded-lg border border-gray-800">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">Image Optimizer</h2>
      
      <div className="flex flex-col gap-4">
        {/* File Input - only show in standalone mode */}
        {!initialFile && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Select Image (Max 15MB)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            />
          </div>
        )}
        
        {/* Image preview */}
        {preview && (
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-300 mb-2">Preview</h3>
            <div className="relative w-full h-64 bg-gray-800 rounded-md overflow-hidden">
              <Image 
                src={preview} 
                alt="Image preview" 
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
            {selectedFileSize && selectedFileName && (
              <div className="mt-2 text-sm text-gray-400">
                {selectedFileName} - {formatBytes(selectedFileSize)}
              </div>
            )}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-md">
            <p className="text-red-200">{error}</p>
          </div>
        )}
        
        {/* Optimize button - show if we have a preview but no optimized result yet */}
        {preview && !optimizedImage && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOptimizing ? 'Optimizing...' : 'Optimize Image'}
            </button>
          </div>
        )}
        
        {/* Optimization results */}
        {optimizedImage && (
          <div className="mb-4 p-4 bg-gray-800 rounded-md">
            <h3 className="text-lg font-medium text-yellow-400 mb-2">Optimization Complete</h3>
            
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-4 mb-2">
                <div className="text-center">
                  <div className="text-sm text-gray-400">Original</div>
                  <div className="text-md text-white">{formatBytes(optimizedImage.originalSize)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Optimized</div>
                  <div className="text-md text-white">{formatBytes(optimizedImage.optimizedSize)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Saved</div>
                  <div className="text-md text-green-400">{optimizedImage.compressionRate}%</div>
                </div>
              </div>
            </div>
            
            <div className="relative w-full h-64 bg-gray-800 rounded-md overflow-hidden mb-4">
              <Image 
                src={optimizedImage.src} 
                alt="Optimized image" 
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
            
            <div className="flex space-x-4">
              {/* Different buttons based on mode */}
              {isCallbackMode ? (
                <>
                  {/* In callback mode, show Use Image and Cancel buttons */}
                  <button
                    type="button"
                    onClick={() => handleDownload(false)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    Use Optimized Image
                  </button>
                  
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* In standalone mode, show Download and Add to Gallery buttons */}
                  <button
                    type="button"
                    onClick={() => handleDownload(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    Download
                  </button>
                  
                  {onAddToGallery && (
                    <button
                      type="button"
                      onClick={handleAddToGallery}
                      disabled={isAddingToGallery}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAddingToGallery ? 'Adding...' : 'Add to Gallery'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Position selector - only show in non-callback mode with onAddToGallery */}
        {!isCallbackMode && onAddToGallery && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Gallery Position
            </label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(parseInt(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                <option key={pos} value={pos}>
                  Position {pos}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
} 