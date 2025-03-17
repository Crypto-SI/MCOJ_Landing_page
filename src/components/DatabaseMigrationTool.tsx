'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Check, X, Database } from 'lucide-react';
import { REQUIRED_BUCKETS } from '@/utils/setupSupabaseBuckets';

/**
 * A component that allows admins to migrate data from JSON files to Supabase
 * This version is simplified to avoid crashing the dashboard
 */
const DatabaseMigrationTool: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [results, setResults] = useState<Record<string, boolean> | null>(null);
  const [tablesNeedCreation, setTablesNeedCreation] = useState(false);
  const [missingTables, setMissingTables] = useState<string[]>([]);

  // New state for setup process
  const [isSettingUpDatabase, setIsSettingUpDatabase] = useState(false);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState(false);

  // Check bucket status on demand rather than automatically
  const checkBucketStatus = async () => {
    try {
      setIsLoading(true);
      setMessage('Checking bucket status...');
      setError(null);
      setSuccess(false);
      setResults(null);
      
      const response = await fetch('/api/admin/setup-buckets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(err => {
        console.error('Network error checking buckets:', err);
        throw new Error('Failed to connect to bucket setup API');
      });

      if (response.status === 401) {
        console.error('Unauthorized access to setup buckets API');
        setMessage('Authentication required. Please ensure you are properly logged in as an admin.');
        setError('Authentication required. Please ensure you are properly logged in as an admin.');
        return;
      }

      if (!response.ok) {
        console.error(`Server returned ${response.status}: ${response.statusText}`);
        setMessage(`Server error: ${response.status} ${response.statusText}`);
        setError(`Server error: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json().catch(err => {
        console.error('Error parsing bucket response:', err);
        throw new Error('Failed to parse bucket setup response');
      });
      
      // Check if response indicates authorization issue
      if (data.message === "Unauthorized") {
        setMessage('Authentication required. Please ensure you are properly logged in as an admin.');
        setError('Authentication required. Please ensure you are properly logged in as an admin.');
        return;
      }
      
      // Determine if buckets are ready
      if (data.success && data.details) {
        const ready = data.success && 
                    data.details.failed.length === 0 && 
                    (data.details.existing.length + data.details.created.length) === REQUIRED_BUCKETS.length;
        
        if (ready) {
          setMessage('All required storage buckets are set up and ready for migration.');
          setSuccess(true);
        } else {
          setMessage('Some storage buckets are missing or could not be created. Please check the console for details.');
          setError('Some storage buckets are missing or could not be created. Please check the console for details.');
        }
      } else {
        setMessage('Unable to determine bucket status. Please check the console for details.');
        setError('Unable to determine bucket status. Please check the console for details.');
      }
    } catch (error) {
      console.error('Error checking bucket status:', error);
      setMessage('Error checking bucket status. Please check the console for details.');
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for checking table status
  const checkTableStatus = async () => {
    setIsLoading(true);
    setMessage('Checking Supabase table status...');
    setError(null);
    setSuccess(false);
    setResults(null);
    
    try {
      const response = await fetch('/api/admin/migrate-to-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
      });
      
      const data = await response.json();
      
      if (response.status === 200 && !data.success && data.tablesCheck) {
        // Tables need to be created
        setTablesNeedCreation(true);
        setMissingTables(data.tablesCheck.missing || []);
        setMessage('Database tables need to be created before migration.');
        setError(data.message);
      } else if (!response.ok) {
        throw new Error(data.message || `Server returned ${response.status}: ${response.statusText}`);
      } else if (data.success) {
        // Migration already succeeded
        setSuccess(true);
        setMessage(data.message || 'All tables are ready for migration!');
        setResults(data.results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for running the migration
  const handleMigration = async () => {
    if (!success) {
      setMessage('Please check bucket status first to ensure all required buckets are ready.');
      return;
    }

    if (!confirm('Are you sure you want to migrate all data to Supabase? This might overwrite existing database records and will move files to Supabase Storage.')) {
      return;
    }

    setIsLoading(true);
    setMessage('Starting migration...');
    setError(null);
    setSuccess(false);
    setResults(null);
    
    try {
      const response = await fetch('/api/admin/migrate-to-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setMessage(data.message || 'Migration completed successfully!');
        setResults(data.results);
      } else {
        throw new Error(data.message || 'An error occurred during migration. Check console for details.');
      }
    } catch (err) {
      console.error('Migration error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // New handler for setting up database tables and functions
  const setupDatabase = async () => {
    setIsSettingUpDatabase(true);
    setSetupMessage('Setting up database tables and functions...');
    setSetupError(null);
    setSetupSuccess(false);
    
    try {
      const response = await fetch('/api/admin/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Server returned ${response.status}: ${response.statusText}`);
      }
      
      setSetupSuccess(true);
      setSetupMessage(data.message || 'Database set up successfully!');
      
      // After setup, check tables again
      setTimeout(() => {
        checkTableStatus();
      }, 1000);
      
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSettingUpDatabase(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-xl font-semibold flex items-center">
          <Database className="h-5 w-5 text-amber-500 mr-2" />
          Database Migration Tool
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This tool will migrate data from JSON files to Supabase buckets and tables.
        </p>
      </div>
      
      {/* Setup Database Section */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">Database Setup</h3>
        <p className="mb-4">If you're having issues with tables, set up the database structure first.</p>
        
        <button
          onClick={setupDatabase}
          disabled={isSettingUpDatabase}
          className={`px-4 py-2 rounded text-white font-medium ${
            isSettingUpDatabase ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSettingUpDatabase ? 'Setting Up...' : 'Setup Database Tables'}
        </button>
        
        {setupMessage && (
          <div className={`mt-4 p-3 rounded ${setupSuccess ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            {setupMessage}
          </div>
        )}
        
        {setupError && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
            <strong>Error:</strong> {setupError}
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={checkBucketStatus}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          Check Bucket Status
        </button>
        
        <button
          onClick={checkTableStatus}
          disabled={isLoading}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          Check Table Status
        </button>
        
        <button
          onClick={handleMigration}
          disabled={isLoading}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          Run Migration
        </button>
      </div>
      
      {/* Status messages */}
      {message && (
        <div className={`p-4 rounded-md ${success ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {success ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-blue-500" />
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${success ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}`}>
                {success ? 'Success' : 'Status Update'}
              </h3>
              <div className={`mt-2 text-sm ${success ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
                <p>{message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-100 dark:border-red-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {tablesNeedCreation ? 'Tables Need Creation' : 'Error'}
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
                
                {tablesNeedCreation && missingTables.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Missing tables:</p>
                    <ul className="list-disc list-inside mt-1">
                      {missingTables.map(table => (
                        <li key={table}>{table}</li>
                      ))}
                    </ul>
                    <p className="mt-2">
                      Click "Run Migration" to create these tables automatically and run the migration.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Results */}
      {results && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
            Migration Results
          </h3>
          <div className="space-y-2">
            {Object.entries(results).map(([key, value]) => (
              <div key={key} className="flex items-center">
                {value ? (
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <X className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className="text-sm capitalize">{key}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseMigrationTool; 