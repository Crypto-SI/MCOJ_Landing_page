'use client';

import { useState, useEffect } from 'react';

interface BucketInfo {
  name: string;
  size: number;
  files: number;
  color: string;
}

interface StorageStatsData {
  totalSize: number;
  totalFiles: number;
  buckets: BucketInfo[];
  limit: number;
  usedPercentage: number;
}

export default function SimpleStorageStats() {
  const [stats, setStats] = useState<StorageStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTime, setLoadingTime] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Default colors for buckets
  const bucketColors: Record<string, string> = {
    videos: 'bg-red-600',
    gallery: 'bg-blue-600',
    thumbnails: 'bg-green-600',
    temp: 'bg-purple-600',
    events: 'bg-amber-500',
    bookings: 'bg-teal-500',
    default: 'bg-gray-600'
  };

  // Format bytes to human-readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0 || isNaN(bytes)) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchStats = async () => {
    let loadingTimer: NodeJS.Timeout | undefined;
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (!isRefreshing) {
        // Only start the loading timer for initial loads, not refreshes
        loadingTimer = setInterval(() => {
          setLoadingTime(prev => prev + 1);
        }, 1000);
      }
      
      // Add a timestamp query parameter to bust cache
      const fetchPromise = fetch('/api/storage/stats', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch storage stats: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.success && data.stats) {
            // Initialize default stats
            const storageStats: StorageStatsData = {
              totalSize: 0,
              totalFiles: 0,
              buckets: [],
              limit: data.stats.limit || 50 * 1024 * 1024, // Default 50MB
              usedPercentage: 0
            };
            
            // Calculate total size and files from buckets
            const bucketList = data.bucketsStats || [];
            
            // If we have bucket-level stats
            if (data.bucketsStats && Array.isArray(data.bucketsStats)) {
              storageStats.buckets = data.bucketsStats.map((bucket: any) => ({
                name: bucket.name,
                size: bucket.size || 0,
                files: bucket.files || 0,
                color: bucketColors[bucket.name] || bucketColors.default
              }));
              
              // Calculate totals from buckets
              storageStats.totalSize = storageStats.buckets.reduce((sum, bucket) => sum + bucket.size, 0);
              storageStats.totalFiles = storageStats.buckets.reduce((sum, bucket) => sum + bucket.files, 0);
            } 
            // If we have totals but not bucket stats
            else if (data.stats.total) {
              storageStats.totalSize = data.stats.total.size || 0;
              storageStats.totalFiles = data.stats.total.files || 0;
              
              // Create mock bucket data based on content types
              if (data.stats.videos) {
                storageStats.buckets.push({
                  name: 'videos',
                  size: data.stats.videos.size || 0,
                  files: data.stats.videos.files || 0,
                  color: bucketColors.videos
                });
              }
              
              if (data.stats.images) {
                storageStats.buckets.push({
                  name: 'images',
                  size: data.stats.images.size || 0,
                  files: data.stats.images.files || 0,
                  color: bucketColors.gallery
                });
              }
              
              if (data.stats.other) {
                storageStats.buckets.push({
                  name: 'other',
                  size: data.stats.other.size || 0,
                  files: data.stats.other.files || 0,
                  color: bucketColors.default
                });
              }
            }
            
            // Calculate percentage
            storageStats.usedPercentage = (storageStats.totalSize / storageStats.limit) * 100;
            
            setStats(storageStats);
          } else if (data.error) {
            throw new Error(data.error);
          } else {
            throw new Error('Failed to load storage statistics');
          }
        });
        
      // Add timeout to prevent blocking
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Fetch timed out after 5 seconds')), 5000)
      );
      
      await Promise.race([fetchPromise, timeoutPromise]);
    } catch (err) {
      console.error('Error fetching storage stats:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      if (loadingTimer) clearInterval(loadingTimer);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Wrapped in setTimeout to prevent blocking render
    timer = setTimeout(() => {
      fetchStats().catch(err => {
        console.error('Unhandled error in fetchStats:', err);
        setIsLoading(false);
        setIsRefreshing(false);
        setError('An unexpected error occurred');
      });
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Reset loading time for refreshes
    setLoadingTime(0);
    try {
      await fetchStats();
    } catch (err) {
      console.error('Error refreshing storage stats:', err);
      setIsRefreshing(false);
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-yellow-300">Loading storage statistics...</span>
        </div>
        
        {loadingTime > 3 && (
          <div className="mt-3 text-yellow-200 text-sm">
            <p>This is taking longer than usual. Supabase connection might be slow.</p>
            {loadingTime > 8 && (
              <p className="mt-1">If this persists, please refresh the page or check your Supabase configuration.</p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-yellow-400">Storage Usage</h3>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-yellow-700 hover:bg-yellow-600 text-white rounded-md flex items-center text-sm"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <svg className="animate-spin h-3 w-3 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
        
        <div className="p-3 bg-red-900/30 border border-red-500 rounded-md mb-4">
          <p className="text-red-300 text-sm">Error: {error}</p>
          <p className="text-yellow-300 mt-2 text-sm">
            Storage statistics are unavailable. The buckets may not be properly set up 
            or there might be connection issues with Supabase.
          </p>
        </div>
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 mt-4">
          <p className="text-yellow-300 font-bold">Required Buckets:</p>
          <ul className="list-disc pl-5 mt-2 text-yellow-200">
            <li>videos: Stores uploaded video files</li>
            <li>gallery: Stores gallery images (public)</li>
            <li>thumbnails: Stores video thumbnails (public)</li>
            <li>temp: Temporary storage during file processing</li>
            <li>events: Stores event-related files</li>
            <li>bookings: Stores booking request attachments</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-yellow-400">Storage Usage</h3>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-yellow-700 hover:bg-yellow-600 text-white rounded-md flex items-center text-sm"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <svg className="animate-spin h-3 w-3 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
        
        <p className="text-yellow-300">No storage data available.</p>
        <div className="p-4 bg-gray-800 rounded-md mt-4">
          <p className="text-yellow-300 font-bold">Required Buckets:</p>
          <ul className="list-disc pl-5 mt-2 text-yellow-200">
            <li>videos: Stores uploaded video files <span className="w-3 h-3 inline-block bg-red-600 ml-2 rounded-full"></span></li>
            <li>gallery: Stores gallery images <span className="w-3 h-3 inline-block bg-blue-600 ml-2 rounded-full"></span></li>
            <li>thumbnails: Stores video thumbnails <span className="w-3 h-3 inline-block bg-green-600 ml-2 rounded-full"></span></li>
            <li>temp: Temporary storage <span className="w-3 h-3 inline-block bg-purple-600 ml-2 rounded-full"></span></li>
            <li>events: Stores event-related files <span className="w-3 h-3 inline-block bg-amber-500 ml-2 rounded-full"></span></li>
            <li>bookings: Stores booking attachments <span className="w-3 h-3 inline-block bg-teal-500 ml-2 rounded-full"></span></li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-yellow-400">Storage Usage</h3>
        <button
          onClick={handleRefresh}
          className="px-3 py-1 bg-yellow-700 hover:bg-yellow-600 text-white rounded-md flex items-center text-sm"
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <svg className="animate-spin h-3 w-3 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>
      
      {isRefreshing && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg z-10">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-yellow-300">Refreshing storage data...</span>
          </div>
        </div>
      )}
      
      {/* Color legend */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-600 rounded-full mr-1"></div>
          <span className="text-yellow-200">Videos</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-600 rounded-full mr-1"></div>
          <span className="text-yellow-200">Gallery</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-600 rounded-full mr-1"></div>
          <span className="text-yellow-200">Thumbnails</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-600 rounded-full mr-1"></div>
          <span className="text-yellow-200">Temp</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-amber-500 rounded-full mr-1"></div>
          <span className="text-yellow-200">Events</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-teal-500 rounded-full mr-1"></div>
          <span className="text-yellow-200">Bookings</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-600 rounded-full mr-1"></div>
          <span className="text-yellow-200">Other</span>
        </div>
      </div>
      
      {/* Main progress bar */}
      <div className="w-full h-8 bg-gray-800 rounded-full overflow-hidden mb-4">
        <div className="h-full flex">
          {stats.buckets.length > 0 ? (
            stats.buckets.map((bucket, index) => (
              <div 
                key={index}
                className={`${bucket.color} h-full`} 
                style={{ width: `${(bucket.size / stats.limit) * 100}%` }}
                title={`${bucket.name}: ${formatBytes(bucket.size)}`}
              ></div>
            ))
          ) : (
            <div className="bg-yellow-600 h-full" style={{ width: `${stats.usedPercentage}%` }}></div>
          )}
        </div>
      </div>
      
      {/* Usage summary */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-yellow-300 font-medium">
          {formatBytes(stats.totalSize)} of {formatBytes(stats.limit)} used
        </span>
        <span className={`font-bold ${stats.usedPercentage > 80 ? 'text-red-500' : 'text-yellow-400'}`}>
          {stats.usedPercentage.toFixed(1)}%
        </span>
      </div>
      
      {/* Category breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {stats.buckets.length > 0 ? (
          stats.buckets.map((bucket, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-4 h-4 ${bucket.color} rounded-full mr-2`}></div>
              <div>
                <div className="text-sm text-yellow-300">{bucket.name}</div>
                <div className="text-yellow-400 font-medium">{formatBytes(bucket.size)}</div>
                <div className="text-xs text-yellow-200/70">{bucket.files} files</div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-4 text-center text-yellow-300">
            No detailed bucket data available
          </div>
        )}
      </div>
      
      {/* Warning message for high usage */}
      {stats.usedPercentage > 80 && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded-md">
          <p className="text-red-300 text-sm">
            <span className="font-bold">Warning:</span> Storage usage is high. Consider deleting unused files.
          </p>
        </div>
      )}
    </div>
  );
} 