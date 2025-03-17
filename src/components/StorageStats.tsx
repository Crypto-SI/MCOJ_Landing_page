'use client';

import { useState, useEffect } from 'react';

interface StorageCategory {
  size: number;
  files: number;
}

interface StorageStats {
  total: StorageCategory;
  videos: StorageCategory;
  images: StorageCategory;
  other: StorageCategory;
  limit: number;
  used_percentage: number;
  missingBuckets?: string[];
}

export default function StorageStats() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [missingBuckets, setMissingBuckets] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSetupRequired(false);
      
      const response = await fetch('/api/storage/stats', {
        // Add cache-busting query parameter to force a fresh request
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }).catch(err => {
        console.error('Network error fetching storage stats:', err);
        // Return a mock response to prevent breaking the dashboard
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to connect to storage stats API',
          setupRequired: true,
          missingBuckets: ['videos', 'gallery', 'thumbnails', 'temp']
        }));
      });
      
      if (!response.ok && response.status !== 200) {
        throw new Error(`Failed to fetch storage stats: ${response.status}`);
      }
      
      const data = await response.json().catch(err => {
        console.error('Error parsing stats response:', err);
        // Return a fallback object
        return { 
          success: false,
          error: 'Failed to parse storage statistics',
          setupRequired: true
        };
      });
      
      if (data.success && data.stats) {
        setStats(data.stats);
        // Check if some buckets are missing
        if (data.stats.missingBuckets && data.stats.missingBuckets.length > 0) {
          setMissingBuckets(data.stats.missingBuckets);
        }
      } else if (data.setupRequired) {
        setSetupRequired(true);
        setMissingBuckets(data.missingBuckets || []);
      } else {
        throw new Error(data.error || 'Failed to load storage statistics');
      }
    } catch (err) {
      console.error('Error fetching storage stats:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      // Don't let this error break the dashboard
      setSetupRequired(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Wrap in try-catch to ensure dashboard doesn't break
    try {
      fetchStats();
    } catch (err) {
      console.error('Unhandled error in StorageStats:', err);
      setIsLoading(false);
      setIsRefreshing(false);
      setSetupRequired(true);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchStats();
    } catch (err) {
      console.error('Error refreshing storage stats:', err);
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
      </div>
    );
  }

  if (setupRequired) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
        <p className="text-yellow-300 font-bold">Storage Setup Required</p>
        <p className="text-yellow-200 mt-2">The storage buckets need to be set up before you can view storage statistics.</p>
        <p className="text-yellow-200 mt-1">Please use the Bucket Setup Tool below to create the required storage buckets:</p>
        <ul className="list-disc pl-5 mt-2 text-yellow-200">
          {missingBuckets.length > 0 ? (
            missingBuckets.map(bucket => (
              <li key={bucket} className="text-sm">{bucket}</li>
            ))
          ) : (
            <li className="text-sm">Required storage buckets</li>
          )}
        </ul>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-md flex items-center justify-center"
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </>
          ) : (
            <>Refresh Storage Information</>
          )}
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
        <p className="text-red-500">Error: {error}</p>
        <p className="text-yellow-300 mt-2">Unable to load storage statistics. Please try again later.</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-md flex items-center justify-center"
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </>
          ) : (
            <>Refresh Storage Information</>
          )}
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
        <p className="text-yellow-300">No storage data available.</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-md flex items-center justify-center"
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </>
          ) : (
            <>Refresh Storage Information</>
          )}
        </button>
      </div>
    );
  }

  // Show message if some buckets are missing
  if (missingBuckets.length > 0) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-yellow-400">Storage Usage (Partial Data)</h3>
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
        
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500 rounded-md">
          <p className="text-yellow-300 text-sm font-bold">
            Some storage buckets are missing
          </p>
          <p className="text-yellow-200 text-sm mt-1">
            The following buckets need to be created using the Bucket Setup Tool:
          </p>
          <ul className="list-disc pl-5 mt-1 text-yellow-200 text-sm">
            {missingBuckets.map(bucket => (
              <li key={bucket}>{bucket}</li>
            ))}
          </ul>
        </div>
        
        {isRefreshing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-yellow-300">Refreshing storage data...</span>
            </div>
          </div>
        )}
        
        {/* Main progress bar */}
        <div className="w-full h-8 bg-gray-800 rounded-full overflow-hidden mb-4">
          <div className="h-full flex">
            <div 
              className="bg-red-600 h-full" 
              style={{ width: `${(stats.videos.size / stats.limit) * 100}%` }}
              title={`Videos: ${formatBytes(stats.videos.size)}`}
            ></div>
            <div 
              className="bg-blue-600 h-full" 
              style={{ width: `${(stats.images.size / stats.limit) * 100}%` }}
              title={`Images: ${formatBytes(stats.images.size)}`}
            ></div>
            <div 
              className="bg-green-600 h-full" 
              style={{ width: `${(stats.other.size / stats.limit) * 100}%` }}
              title={`Other: ${formatBytes(stats.other.size)}`}
            ></div>
          </div>
        </div>
        
        {/* Usage summary */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-yellow-300 font-medium">
            {formatBytes(stats.total.size)} of {formatBytes(stats.limit)} used
          </span>
          <span className="font-bold text-yellow-400">
            {stats.used_percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  }

  // Calculate percentages for the progress bar segments
  const videoPercentage = (stats.videos.size / stats.limit) * 100;
  const imagePercentage = (stats.images.size / stats.limit) * 100;
  const otherPercentage = (stats.other.size / stats.limit) * 100;

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
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-yellow-300">Refreshing storage data...</span>
          </div>
        </div>
      )}
      
      {/* Main progress bar */}
      <div className="w-full h-8 bg-gray-800 rounded-full overflow-hidden mb-4">
        <div className="h-full flex">
          <div 
            className="bg-red-600 h-full" 
            style={{ width: `${videoPercentage}%` }}
            title={`Videos: ${formatBytes(stats.videos.size)}`}
          ></div>
          <div 
            className="bg-blue-600 h-full" 
            style={{ width: `${imagePercentage}%` }}
            title={`Images: ${formatBytes(stats.images.size)}`}
          ></div>
          <div 
            className="bg-green-600 h-full" 
            style={{ width: `${otherPercentage}%` }}
            title={`Other: ${formatBytes(stats.other.size)}`}
          ></div>
        </div>
      </div>
      
      {/* Usage summary */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-yellow-300 font-medium">
          {formatBytes(stats.total.size)} of {formatBytes(stats.limit)} used
        </span>
        <span className={`font-bold ${stats.used_percentage > 80 ? 'text-red-500' : 'text-yellow-400'}`}>
          {stats.used_percentage.toFixed(1)}%
        </span>
      </div>
      
      {/* Category breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-600 rounded-full mr-2"></div>
          <div>
            <div className="text-sm text-yellow-300">Videos</div>
            <div className="text-yellow-400 font-medium">{formatBytes(stats.videos.size)}</div>
            <div className="text-xs text-yellow-200/70">{stats.videos.files} files</div>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
          <div>
            <div className="text-sm text-yellow-300">Images</div>
            <div className="text-yellow-400 font-medium">{formatBytes(stats.images.size)}</div>
            <div className="text-xs text-yellow-200/70">{stats.images.files} files</div>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-600 rounded-full mr-2"></div>
          <div>
            <div className="text-sm text-yellow-300">Other</div>
            <div className="text-yellow-400 font-medium">{formatBytes(stats.other.size)}</div>
            <div className="text-xs text-yellow-200/70">{stats.other.files} files</div>
          </div>
        </div>
      </div>
      
      {/* Warning message for high usage */}
      {stats.used_percentage > 80 && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500 rounded-md">
          <p className="text-red-300 text-sm">
            <span className="font-bold">Warning:</span> Storage usage is high. Consider deleting unused files.
          </p>
        </div>
      )}
    </div>
  );
} 