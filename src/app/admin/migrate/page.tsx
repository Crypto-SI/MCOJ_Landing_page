'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MigrationPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{text: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [isCheckingBuckets, setIsCheckingBuckets] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [bucketsReady, setBucketsReady] = useState<boolean | null>(null);
  const router = useRouter();

  // Function to ensure authentication cookie is set
  const ensureAuthCookie = async () => {
    try {
      // Call login API to set the cookie if it doesn't exist
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: 'admin', 
          token: 'admin123' 
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to set authentication cookie:', await response.text());
        throw new Error('Failed to set authentication cookie');
      }
      
      return true;
    } catch (err) {
      console.error('Authentication error:', err);
      return false;
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem('mcoj_admin_authenticated');
    if (auth !== 'true') {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      
      // Ensure authentication cookie is set
      ensureAuthCookie().then(success => {
        if (!success) {
          setMessage({
            text: 'Failed to set authentication cookie. API calls may fail.',
            type: 'error'
          });
        }
        setIsLoading(false);
      });
    }
  }, [router]);

  // Function to check bucket status
  const checkBucketStatus = async () => {
    try {
      // First ensure the auth cookie is set
      await ensureAuthCookie();
      
      setIsCheckingBuckets(true);
      setMessage({ text: 'Checking bucket status...', type: 'info' });
      
      const response = await fetch('/api/admin/setup-buckets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        setMessage({ 
          text: 'Authentication required. Please ensure you are properly logged in as an admin.', 
          type: 'error' 
        });
        return;
      }

      if (!response.ok) {
        setMessage({ 
          text: `Server error: ${response.status} ${response.statusText}`, 
          type: 'error' 
        });
        setBucketsReady(false);
        return;
      }

      const data = await response.json();
      
      if (data.message === "Unauthorized") {
        setMessage({ 
          text: 'Authentication required. Please ensure you are properly logged in as an admin.', 
          type: 'error' 
        });
        return;
      }
      
      if (data.success && data.details) {
        const allBucketsExist = data.details.failed.length === 0;
        setBucketsReady(allBucketsExist);
        
        if (allBucketsExist) {
          setMessage({ 
            text: 'All required storage buckets are set up and ready for migration.', 
            type: 'success' 
          });
        } else {
          setMessage({ 
            text: 'Some storage buckets are missing or could not be created. Check the console for details.', 
            type: 'error' 
          });
        }
      } else {
        setBucketsReady(false);
        setMessage({ 
          text: 'Unable to determine bucket status. Please check the console for details.', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error checking bucket status:', error);
      setBucketsReady(false);
      setMessage({ 
        text: 'Error checking bucket status. Please check the console for details.', 
        type: 'error' 
      });
    } finally {
      setIsCheckingBuckets(false);
    }
  };

  // Function to handle migration
  const handleMigration = async () => {
    if (bucketsReady !== true) {
      setMessage({ 
        text: 'Please check bucket status first to ensure all required buckets are ready.', 
        type: 'error' 
      });
      return;
    }

    if (!confirm('Are you sure you want to migrate all data to Supabase? This might overwrite existing database records and will move files to Supabase Storage.')) {
      return;
    }

    try {
      // First ensure the auth cookie is set
      await ensureAuthCookie();
      
      setIsMigrating(true);
      setMessage({ text: 'Starting migration...', type: 'info' });

      const response = await fetch('/api/admin/migrate-to-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setMessage({ 
          text: data.message || 'Migration completed successfully!', 
          type: 'success' 
        });
      } else {
        setMessage({ 
          text: data.message || 'Failed to migrate data. Check console for details.', 
          type: 'error' 
        });
        console.error('Migration error:', data);
      }
    } catch (error) {
      setMessage({ 
        text: 'An error occurred during migration. Check console for details.', 
        type: 'error' 
      });
      console.error('Migration error:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-136px)]">
        <div className="text-xl text-yellow-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-yellow-400">Database Migration Tool</h1>
        <Link 
          href="/admin/dashboard"
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-md font-bold"
        >
          ← Back to Dashboard
        </Link>
      </div>
      
      <div className="mb-6 bg-gray-800/50 p-4 rounded-md">
        <p className="text-gray-300 mb-3">
          This tool allows you to migrate your data from JSON files to Supabase tables and storage buckets.
        </p>
        <p className="text-gray-300">
          Before running the migration, ensure all required storage buckets are set up properly.
        </p>
      </div>

      <div className="p-6 bg-gray-900 rounded-lg shadow-md border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-yellow-400">Migration Control Panel</h2>
        
        {message && (
          <div 
            className={`mb-4 p-3 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-900/50 text-green-300 border border-green-700' 
                : message.type === 'error'
                  ? 'bg-red-900/50 text-red-300 border border-red-700'
                  : 'bg-blue-900/50 text-blue-300 border border-blue-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-2 text-yellow-300">Step 1: Check Storage Buckets</h3>
            <p className="text-yellow-200 mb-4">
              Verify that all required storage buckets are set up in Supabase.
            </p>
            <button
              onClick={checkBucketStatus}
              disabled={isCheckingBuckets}
              className={`px-4 py-2 rounded-md font-medium text-white 
                ${isCheckingBuckets ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'}`}
            >
              {isCheckingBuckets ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </span>
              ) : 'Check Bucket Status'}
            </button>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2 text-yellow-300">Step 2: Run Migration</h3>
            <p className="text-yellow-200 mb-4">
              Migrate data from JSON files to Supabase tables and storage buckets.
            </p>
            <button
              onClick={handleMigration}
              disabled={isMigrating || bucketsReady !== true}
              className={`px-4 py-2 rounded-md font-medium text-white 
                ${isMigrating || bucketsReady !== true ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800'}`}
            >
              {isMigrating ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Migrating...
                </span>
              ) : 'Migrate Data to Supabase'}
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-sm text-yellow-200">
          <p>⚠️ <strong>Important:</strong> The migration process will:</p>
          <ul className="list-disc ml-5 mt-1 space-y-1">
            <li>Transfer gallery images to the Supabase 'gallery' table and 'gallery' bucket</li>
            <li>Transfer events to the Supabase 'events' table and any related files to the 'events' bucket</li>
            <li>Transfer videos to the Supabase 'videos' table and 'videos' bucket</li>
            <li>Transfer video thumbnails to the Supabase 'thumbnails' bucket</li>
            <li>Transfer booking requests to the Supabase 'bookings' table and 'bookings' bucket</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/admin/dashboard" className="text-yellow-400 hover:text-yellow-300">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
} 