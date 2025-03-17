'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StorageStatus {
  success: boolean;
  message?: string;
  buckets?: any[];
  missingBuckets?: string[];
  hasMissingBuckets?: boolean;
  videosFiles?: any[];
  videosError?: any;
  thumbnailsFiles?: any[];
  thumbnailsError?: any;
  testUploadResult?: any;
  testUploadError?: any;
  env?: {
    supabaseUrl: string;
    supabaseServiceRoleKey: string;
  };
  testVideoUpload?: {
    success: boolean;
    data?: any;
    error?: string;
  };
}

export default function DebugPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is authenticated
  useEffect(() => {
    const auth = localStorage.getItem('mcoj_admin_authenticated');
    if (auth !== 'true') {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      checkStorage();
    }
  }, [router]);
  
  // Function to check storage status
  const checkStorage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/videos/check');
      const data = await response.json();
      
      setStorageStatus(data);
    } catch (err) {
      setError(`Error checking storage status: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to test video upload
  const testSmallVideoUpload = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create a small test video
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw a simple gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, 'red');
        gradient.addColorStop(1, 'blue');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Test Video', canvas.width / 2, canvas.height / 2);
        
        // Convert canvas to video blob
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95);
        });
        
        if (!blob) {
          throw new Error('Failed to create test video blob');
        }
        
        // Create form data for upload
        const formData = new FormData();
        formData.append('title', 'Test Video Upload');
        formData.append('description', 'This is a test upload to diagnose issues');
        
        // Create a video file from the image (not a real video but enough to test the upload)
        const videoFile = new File([blob], 'test-video.mp4', { type: 'video/mp4' });
        formData.append('video', videoFile);
        
        // Create a thumbnail file
        const thumbnailFile = new File([blob], 'test-thumbnail.jpg', { type: 'image/jpeg' });
        formData.append('thumbnail', thumbnailFile);
        
        // Send the upload request
        const response = await fetch('/api/videos', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload test video');
        }
        
        setStorageStatus((prev: StorageStatus | null) => {
          if (!prev) return {
            success: true,
            testVideoUpload: {
              success: true,
              data: data
            }
          };
          
          return {
            ...prev,
            testVideoUpload: {
              success: true,
              data: data
            }
          };
        });
        
        // After successful test upload, refresh storage status
        checkStorage();
      }
    } catch (err) {
      setError(`Error testing video upload: ${err instanceof Error ? err.message : String(err)}`);
      setStorageStatus((prev: StorageStatus | null) => {
        if (!prev) return {
          success: false,
          testVideoUpload: {
            success: false,
            error: err instanceof Error ? err.message : String(err)
          }
        };
        
        return {
          ...prev,
          testVideoUpload: {
            success: false,
            error: err instanceof Error ? err.message : String(err)
          }
        };
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isAuthenticated) {
    return null; // Don't render anything until auth check completes
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400">Storage Debug</h1>
          <Link href="/admin" className="px-4 py-2 bg-gray-800 text-yellow-400 rounded hover:bg-gray-700">
            Back to Admin
          </Link>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-yellow-400">Supabase Storage Status</h2>
            <button
              onClick={checkStorage}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Checking...' : 'Refresh'}
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded text-red-100">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
            </div>
          ) : storageStatus ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
                <div className="p-3 bg-gray-700 rounded">
                  <p>Success: {storageStatus.success ? '✅' : '❌'}</p>
                  {!storageStatus.success && storageStatus.message && (
                    <p className="text-red-400">Error: {storageStatus.message}</p>
                  )}
                  {storageStatus.env && (
                    <div className="mt-2">
                      <p>Environment Variables:</p>
                      <ul className="list-disc list-inside pl-4">
                        <li>NEXT_PUBLIC_SUPABASE_URL: {storageStatus.env.supabaseUrl}</li>
                        <li>SUPABASE_SERVICE_ROLE_KEY: {storageStatus.env.supabaseServiceRoleKey}</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              {storageStatus.buckets && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Storage Buckets</h3>
                  <div className="p-3 bg-gray-700 rounded">
                    <ul className="space-y-2">
                      {storageStatus.buckets.map((bucket: any) => (
                        <li key={bucket.name} className="flex items-center">
                          <span className="mr-2 text-green-400">✓</span>
                          <span>{bucket.name}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {storageStatus.missingBuckets && (
                      <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded">
                        <p className="font-semibold text-red-300">Missing Required Buckets:</p>
                        <ul className="list-disc list-inside pl-4 text-red-300">
                          {storageStatus.missingBuckets.map((bucket: string) => (
                            <li key={bucket}>{bucket}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Test Upload Result</h3>
                <div className="p-3 bg-gray-700 rounded">
                  {storageStatus.testUploadError ? (
                    <div className="text-red-400">
                      <p>Test Upload Failed: {JSON.stringify(storageStatus.testUploadError)}</p>
                    </div>
                  ) : storageStatus.testUploadResult ? (
                    <div className="text-green-400">
                      <p>Test Upload Successful</p>
                    </div>
                  ) : (
                    <p>No test upload performed</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Video Files</h3>
                <div className="p-3 bg-gray-700 rounded">
                  {storageStatus.videosError ? (
                    <div className="text-red-400">
                      <p>Error listing video files: {JSON.stringify(storageStatus.videosError)}</p>
                    </div>
                  ) : storageStatus.videosFiles ? (
                    storageStatus.videosFiles.length > 0 ? (
                      <ul className="max-h-40 overflow-y-auto">
                        {storageStatus.videosFiles.map((file: any) => (
                          <li key={file.name}>{file.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No video files found</p>
                    )
                  ) : (
                    <p>Could not list video files</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Thumbnail Files</h3>
                <div className="p-3 bg-gray-700 rounded">
                  {storageStatus.thumbnailsError ? (
                    <div className="text-red-400">
                      <p>Error listing thumbnail files: {JSON.stringify(storageStatus.thumbnailsError)}</p>
                    </div>
                  ) : storageStatus.thumbnailsFiles ? (
                    storageStatus.thumbnailsFiles.length > 0 ? (
                      <ul className="max-h-40 overflow-y-auto">
                        {storageStatus.thumbnailsFiles.map((file: any) => (
                          <li key={file.name}>{file.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No thumbnail files found</p>
                    )
                  ) : (
                    <p>Could not list thumbnail files</p>
                  )}
                </div>
              </div>
              
              {storageStatus.testVideoUpload && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Test Video Upload Result</h3>
                  <div className={`p-3 rounded ${storageStatus.testVideoUpload.success ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                    {storageStatus.testVideoUpload.success ? (
                      <div>
                        <p className="text-green-400">Test video upload successful!</p>
                        <pre className="mt-2 text-xs overflow-x-auto">
                          {JSON.stringify(storageStatus.testVideoUpload.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div>
                        <p className="text-red-400">Test video upload failed: {storageStatus.testVideoUpload.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p>No storage status information available. Click Refresh to check.</p>
          )}
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">Test Video Upload</h2>
          <p className="mb-4">This will attempt to upload a small test video to diagnose any issues with the upload process.</p>
          
          <button
            onClick={testSmallVideoUpload}
            disabled={isLoading}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Run Test Upload'}
          </button>
        </div>
      </div>
    </div>
  );
} 