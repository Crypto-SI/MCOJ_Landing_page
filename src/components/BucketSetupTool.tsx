import React, { useState, useEffect } from 'react';
import { REQUIRED_BUCKETS } from '@/utils/setupSupabaseBuckets';

/**
 * A component that allows admins to set up required Supabase storage buckets
 */
const BucketSetupTool: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [message, setMessage] = useState<{text: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [bucketStatus, setBucketStatus] = useState<{
    bucket: string;
    status: 'unknown' | 'existing' | 'created' | 'failed';
  }[]>(REQUIRED_BUCKETS.map(bucket => ({ bucket, status: 'unknown' })));

  // Check bucket status on component mount, but don't block rendering
  useEffect(() => {
    // Wrap in try-catch to ensure dashboard doesn't break
    try {
      // Don't block initial render with this check
      const timer = setTimeout(() => {
        checkBucketStatus().catch(err => {
          console.error('Error in initial bucket check:', err);
          // Set a user-friendly message
          setMessage({
            text: 'Could not check bucket status. Please try the setup button below.',
            type: 'error'
          });
          setInitialCheckDone(true);
        });
      }, 100);
      
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('Unhandled error in BucketSetupTool mount:', err);
      setInitialCheckDone(true);
    }
  }, []);

  // Function to check the status of all buckets
  const checkBucketStatus = async () => {
    setIsLoading(true);
    setMessage({ text: 'Checking bucket status...', type: 'info' });

    try {
      const response = await fetch('/api/admin/setup-buckets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(err => {
        console.error('Network error checking buckets:', err);
        throw new Error('Failed to connect to bucket setup API');
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json().catch(err => {
        console.error('Error parsing bucket response:', err);
        throw new Error('Failed to parse bucket setup response');
      });
      
      if (data.success) {
        // Update bucket status based on response
        const newStatus = REQUIRED_BUCKETS.map(bucket => {
          if (data.details.existing.includes(bucket)) {
            return { bucket, status: 'existing' as const };
          }
          if (data.details.created.includes(bucket)) {
            return { bucket, status: 'created' as const };
          }
          if (data.details.failed.includes(bucket)) {
            return { bucket, status: 'failed' as const };
          }
          return { bucket, status: 'unknown' as const };
        });
        
        setBucketStatus(newStatus);
        
        // Determine message based on results
        if (data.details.failed.length > 0) {
          setMessage({ 
            text: `Some buckets could not be created: ${data.details.failed.join(', ')}`,
            type: 'error' 
          });
        } else if (data.details.created.length > 0) {
          setMessage({ 
            text: `Successfully created buckets: ${data.details.created.join(', ')}`,
            type: 'success'
          });
        } else {
          setMessage({ 
            text: 'All required buckets already exist!',
            type: 'success' 
          });
        }
      } else {
        setMessage({ text: data.message || 'Failed to set up buckets', type: 'error' });
        console.error('Bucket setup error:', data);
      }
    } catch (error) {
      setMessage({ 
        text: 'An error occurred during bucket setup. Check console for details.',
        type: 'error' 
      });
      console.error('Bucket setup error:', error);
    } finally {
      setIsLoading(false);
      setInitialCheckDone(true);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mt-4">
      <h2 className="text-xl font-bold mb-4">Storage Bucket Setup</h2>
      <p className="mb-4 text-gray-700">
        This tool will check and create the required Supabase storage buckets for your application.
      </p>
      
      {message && (
        <div 
          className={`mb-4 p-3 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : message.type === 'error'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}
        >
          {message.text}
        </div>
      )}
      
      {initialCheckDone && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Required Buckets:</h3>
          <ul className="space-y-2">
            {bucketStatus.map(({ bucket, status }) => (
              <li 
                key={bucket} 
                className="flex items-center space-x-2 p-2 border rounded-md"
              >
                {status === 'unknown' && (
                  <span className="w-4 h-4 rounded-full bg-gray-300"></span>
                )}
                {status === 'existing' && (
                  <span className="w-4 h-4 rounded-full bg-green-500"></span>
                )}
                {status === 'created' && (
                  <span className="w-4 h-4 rounded-full bg-blue-500"></span>
                )}
                {status === 'failed' && (
                  <span className="w-4 h-4 rounded-full bg-red-500"></span>
                )}
                
                <span className="flex-1 font-mono">{bucket}</span>
                
                <span className="text-sm">
                  {status === 'unknown' && 'Unknown'}
                  {status === 'existing' && 'Already exists'}
                  {status === 'created' && 'Created successfully'}
                  {status === 'failed' && 'Failed to create'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex items-center space-x-4">
        <button
          onClick={checkBucketStatus}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md font-medium text-white 
            ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Setting up buckets...
            </span>
          ) : initialCheckDone ? 'Setup Storage Buckets' : 'Check Bucket Status'}
        </button>
        
        <span className="text-sm text-gray-500">
          This will create any missing buckets in your Supabase project.
        </span>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>ℹ️ <strong>Bucket Information:</strong></p>
        <ul className="list-disc ml-5 mt-1 space-y-1">
          <li><strong>videos</strong>: Stores uploaded video files</li>
          <li><strong>gallery</strong>: Stores gallery images (public)</li>
          <li><strong>thumbnails</strong>: Stores video thumbnails (public)</li>
          <li><strong>temp</strong>: Temporary storage during file processing</li>
        </ul>
      </div>
    </div>
  );
};

export default BucketSetupTool; 