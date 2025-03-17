'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface OptimizedImageUploaderProps {
  onImageUploaded: (imageData: {
    filename: string;
    src: string;
    originalSize: number;
    optimizedSize: number;
    compressionRate: number;
  }) => void;
  destination?: string; // Supabase bucket name
  maxSizeMB?: number; // Maximum file size in MB
  className?: string;
  buttonText?: string;
  showPreview?: boolean;
  previewWidth?: number;
  previewHeight?: number;
  customFilename?: string;
  initialFile?: File;
}

export default function OptimizedImageUploader({
  onImageUploaded,
  destination = 'gallery',
  maxSizeMB = 5,
  className = '',
  buttonText = 'Upload & Optimize Image',
  showPreview = true,
  previewWidth = 300,
  previewHeight = 200,
  customFilename = '',
  initialFile,
}: OptimizedImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [optimization, setOptimization] = useState<{
    originalSize: number;
    optimizedSize: number;
    compressionRate: number;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle initial file if provided
  useEffect(() => {
    if (initialFile) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(initialFile.type)) {
        setError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
        return;
      }
      
      // Validate file size
      const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
      if (initialFile.size > maxSize) {
        setError(`File size exceeds ${maxSizeMB}MB limit.`);
        return;
      }
      
      // Store the file size for display
      setSelectedFileSize(initialFile.size);
      
      // Clear previous errors and set preview
      setError(null);
      
      // Create local preview
      const previewUrl = URL.createObjectURL(initialFile);
      setPreview(previewUrl);
      
      // Create a new DataTransfer and add our file to it
      if (fileInputRef.current) {
        try {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(initialFile);
          fileInputRef.current.files = dataTransfer.files;
        } catch (err) {
          console.error('Error setting initial file:', err);
        }
      }
    }
  }, [initialFile, maxSizeMB]);
  
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
    
    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    if (file.size > maxSize) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      return;
    }
    
    // Store the file size for display
    setSelectedFileSize(file.size);
    
    // Clear previous errors and set preview
    setError(null);
    
    // Create local preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!fileInputRef.current?.files?.length) {
      setError('Please select an image to upload.');
      return;
    }
    
    const file = fileInputRef.current.files[0];
    setIsUploading(true);
    setError(null);
    
    try {
      // Create FormData for API request
      const formData = new FormData();
      formData.append('image', file);
      formData.append('destination', destination);
      
      if (customFilename) {
        formData.append('filename', customFilename);
      }
      
      // Call the optimization API
      const response = await fetch('/api/optimize-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload and optimize image');
      }
      
      const data = await response.json();
      
      // Update optimization stats
      setOptimization({
        originalSize: data.originalSize,
        optimizedSize: data.optimizedSize,
        compressionRate: data.compressionRate
      });
      
      // Call the callback with the uploaded image data
      onImageUploaded({
        filename: data.filename,
        src: data.src,
        originalSize: data.originalSize,
        optimizedSize: data.optimizedSize,
        compressionRate: data.compressionRate
      });
      
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
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
  
  return (
    <div className={`optimized-image-uploader ${className}`}>
      <div className="flex flex-col gap-4">
        {/* File Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Select Image (Max {maxSizeMB}MB)
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            disabled={isUploading}
          />
        </div>
        
        {/* File Size Display (before optimization) */}
        {selectedFileSize !== null && !optimization && (
          <div className="mt-2 p-3 bg-gray-800 rounded-md text-sm">
            <h4 className="font-medium text-brand-gold mb-1">Original File</h4>
            <p className="text-white">Size: {formatBytes(selectedFileSize)}</p>
            <p className="text-gray-400 text-xs mt-1">Upload to optimize this image</p>
          </div>
        )}
        
        {/* Preview */}
        {showPreview && preview && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-300 mb-1">Preview</p>
            <div className="relative bg-gray-800 rounded-md overflow-hidden" 
                 style={{ width: previewWidth, height: previewHeight }}>
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
        {optimization && (
          <div className="mt-2 p-3 bg-gray-800 rounded-md text-sm">
            <h4 className="font-medium text-brand-gold mb-2">Optimization Results</h4>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-2">
              <span className="text-gray-300">Before:</span>
              <span className="text-white">{formatBytes(optimization.originalSize)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-2">
              <span className="text-gray-300">After:</span>
              <span className="text-white">{formatBytes(optimization.optimizedSize)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Saved:</span>
              <span className="text-green-400 font-medium">{optimization.compressionRate}%</span>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mt-2 p-3 bg-red-900/50 border border-red-500 rounded-md">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}
        
        {/* Upload Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isUploading || !preview}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-md font-bold 
                   disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isUploading ? 'Optimizing & Uploading...' : buttonText}
        </button>
      </div>
    </div>
  );
} 