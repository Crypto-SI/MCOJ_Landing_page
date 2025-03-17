'use client';

import { useState, useRef } from 'react';
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
}

export default function StandaloneImageOptimizer({ onAddToGallery }: StandaloneImageOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAddingToGallery, setIsAddingToGallery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number>(1);
  const [optimizedImage, setOptimizedImage] = useState<{
    originalSize: number;
    optimizedSize: number;
    compressionRate: number;
    src: string;
    filename: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    if (!fileInputRef.current?.files?.length) {
      setError('Please select an image to optimize.');
      return;
    }
    
    const file = fileInputRef.current.files[0];
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
  
  // Handle download of optimized image
  const handleDownload = async () => {
    if (!optimizedImage) return;
    
    try {
      // Fetch the actual image data from the URL
      const response = await fetch(optimizedImage.src);
      if (!response.ok) {
        throw new Error('Failed to download the optimized image');
      }
      
      // Get the blob data
      const blob = await response.blob();
      
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
    } catch (error) {
      console.error('Error downloading image:', error);
      setError('Failed to download the optimized image. Please try again or right-click and save image manually.');
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
        {/* File Input */}
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
            disabled={isOptimizing}
          />
        </div>
        
        {/* File Size Display (before optimization) */}
        {selectedFileSize !== null && !optimizedImage && (
          <div className="mt-2 p-3 bg-gray-800 rounded-md text-sm">
            <h4 className="font-medium text-yellow-400 mb-1">Original File</h4>
            <p className="text-white">Size: {formatBytes(selectedFileSize)}</p>
            <p className="text-gray-400 text-xs mt-1">Click "Optimize" to compress this image</p>
          </div>
        )}
        
        {/* Preview */}
        {preview && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-300 mb-1">Preview</p>
            <div className="relative bg-gray-800 rounded-md overflow-hidden" 
                 style={{ height: '300px', maxWidth: '100%' }}>
              <Image
                src={preview}
                alt="Image preview"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        )}
        
        {/* Optimization Stats - After optimization */}
        {optimizedImage && (
          <div className="mt-2 p-4 bg-gray-800 rounded-md text-sm">
            <h4 className="font-medium text-yellow-400 mb-3">Optimization Results</h4>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-2">
              <span className="text-gray-300">Before:</span>
              <span className="text-white">{formatBytes(optimizedImage.originalSize)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-2">
              <span className="text-gray-300">After:</span>
              <span className="text-white">{formatBytes(optimizedImage.optimizedSize)}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-300">Saved:</span>
              <span className="text-green-400 font-medium">{optimizedImage.compressionRate}%</span>
            </div>
            
            <div className="mt-4">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Download Optimized Image
              </button>
              
              {/* Gallery Position Selector and Add to Gallery Button */}
              {onAddToGallery && (
                <div className="mt-3 flex gap-2">
                  <div className="flex-shrink-0 w-1/3">
                    <select
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(Number(e.target.value))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                      disabled={isAddingToGallery}
                    >
                      {Array.from({ length: 8 }, (_, i) => i + 1).map(position => (
                        <option key={position} value={position}>
                          Position {position}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddToGallery}
                    disabled={isAddingToGallery}
                    className="flex-grow bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-md font-medium disabled:opacity-50"
                  >
                    {isAddingToGallery ? 'Adding...' : 'Add to Gallery Now'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mt-2 p-3 bg-red-900/50 border border-red-500 rounded-md">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
        
        {/* Optimize Button */}
        {!optimizedImage && (
          <button
            type="button"
            onClick={handleOptimize}
            disabled={isOptimizing || !preview}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-md font-bold 
                     disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isOptimizing ? 'Optimizing...' : 'Optimize Image'}
          </button>
        )}
        
        {/* New Image Button (after optimization) */}
        {optimizedImage && (
          <button
            type="button"
            onClick={() => {
              setOptimizedImage(null);
              setPreview(null);
              setSelectedFileSize(null);
              setSelectedFileName(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className="mt-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
          >
            Optimize Another Image
          </button>
        )}
      </div>
    </div>
  );
} 