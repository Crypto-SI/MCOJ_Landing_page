'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Database, HardDrive, CheckCircle, XCircle, Wrench } from 'lucide-react';
import DatabaseMigrationTool from '@/components/DatabaseMigrationTool';
import Navigation from '@/components/Navigation';

export default function MigrationPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);

  useEffect(() => {
    // Check if user is authenticated as admin
    const isAuthenticated = localStorage.getItem('mcoj_admin_authenticated') === 'true';
    setIsAdmin(isAuthenticated);
    setLoading(false);

    if (!isAuthenticated) {
      router.push('/admin/login');
    }

    // Ensure auth cookie is set if localStorage is set
    ensureAuthCookie();
  }, [router]);

  const ensureAuthCookie = async () => {
    const isAuthenticatedInLocalStorage = localStorage.getItem('mcoj_admin_authenticated') === 'true';
    
    if (isAuthenticatedInLocalStorage) {
      try {
        // Set the auth cookie using the API
        const response = await fetch('/api/admin/set-auth-cookie', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important for cookies
        });
        
        if (!response.ok) {
          console.error('Failed to set auth cookie');
        }
      } catch (error) {
        console.error('Error setting auth cookie:', error);
      }
    }
  };

  const runDiagnosticTest = async () => {
    setTestLoading(true);
    setShowTestResults(true);
    setTestResults(null);
    
    try {
      const response = await fetch('/api/admin/test-migration', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTestResults(data.results);
    } catch (error) {
      setTestResults({ 
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setTestLoading(false);
    }
  };

  const toggleTestResults = () => {
    setShowTestResults(!showTestResults);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Router will redirect, but this prevents flash of content
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/30">
            <div className="flex items-center">
              <Database className="h-6 w-6 text-amber-500 mr-3" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Database Migration Tool
              </h1>
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Migrate data from local JSON files to Supabase buckets and tables.
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-300">Before you begin</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Make sure that all required Supabase buckets (gallery, events, videos, thumbnails, temp, bookings) 
                  are created and that your Supabase credentials are correctly set in your environment variables.
                </p>
              </div>
            </div>
            
            {/* Troubleshooting Guide */}
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800">
              <h3 className="font-medium text-amber-800 dark:text-amber-300 flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                Troubleshooting Guide
              </h3>
              <div className="mt-3 space-y-3 text-sm text-amber-700 dark:text-amber-400">
                <p>If you encounter migration errors, check the following:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li><strong>Environment Variables</strong> - Ensure your <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env.local</code> file contains valid Supabase URL and service role key.</li>
                  <li><strong>Supabase Buckets</strong> - All required buckets must exist. Run the diagnostic test to verify.</li>
                  <li><strong>Data Files</strong> - JSON files should exist in the <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">public/data</code> directory.</li>
                  <li><strong>Table Structure</strong> - Ensure your Supabase tables match the expected schema.</li>
                </ol>
                <p className="mt-2">
                  Use the "Run Migration Diagnostics" button to identify specific issues. The detailed report will help you 
                  pinpoint and resolve problems before attempting a full migration.
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <button 
                onClick={runDiagnosticTest}
                disabled={testLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Running Diagnostics...
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4 mr-2" />
                    Run Migration Diagnostics
                  </>
                )}
              </button>
              
              {testResults && (
                <button 
                  onClick={toggleTestResults}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md flex items-center"
                >
                  {showTestResults ? 'Hide Test Results' : 'Show Test Results'}
                </button>
              )}
            </div>
            
            {showTestResults && testResults && (
              <div className="border rounded-lg overflow-hidden mb-6">
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b">
                  <h3 className="font-medium">Diagnostic Results</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(testResults.timestamp).toLocaleString()}
                  </p>
                </div>
                
                <div className="p-4 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  {/* Supabase Connection */}
                  <div className="py-3">
                    <div className="flex items-center mb-2">
                      {testResults.supabase?.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <h4 className="font-medium">Supabase Connection</h4>
                    </div>
                    <p className="text-sm ml-7 text-gray-600 dark:text-gray-400">
                      {testResults.supabase?.message || 'No data available'}
                    </p>
                    {testResults.supabase?.url && (
                      <p className="text-xs ml-7 text-gray-500 dark:text-gray-500 mt-1">
                        URL: {testResults.supabase.url}
                      </p>
                    )}
                  </div>
                  
                  {/* Data Files */}
                  <div className="py-3">
                    <h4 className="font-medium mb-2">Data Files</h4>
                    <div className="ml-2 space-y-2">
                      {Object.entries(testResults.dataFiles || {}).map(([file, data]: [string, any]) => (
                        <div key={file} className="flex items-start">
                          {data.exists && data.valid ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{file}</p>
                            {data.exists ? (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Size: {data.size} bytes, 
                                Valid JSON: {data.valid ? 'Yes' : 'No'}, 
                                Items: {data.items}
                              </p>
                            ) : (
                              <p className="text-xs text-red-500">File not found</p>
                            )}
                            {data.parseError && (
                              <p className="text-xs text-red-500">Parse error: {data.parseError}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Buckets */}
                  <div className="py-3">
                    <div className="flex items-center mb-2">
                      {testResults.buckets?.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <h4 className="font-medium">Storage Buckets</h4>
                    </div>
                    
                    {testResults.buckets?.data ? (
                      <div className="ml-7">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {testResults.buckets.data.allExist ? 
                            'All required buckets exist' : 
                            'Some required buckets are missing'}
                        </p>
                        
                        {testResults.buckets.data.missing && testResults.buckets.data.missing.length > 0 && (
                          <div className="mt-1">
                            <p className="text-xs font-medium text-red-500">Missing buckets:</p>
                            <ul className="list-disc list-inside text-xs text-red-500">
                              {testResults.buckets.data.missing.map((bucket: string) => (
                                <li key={bucket}>{bucket}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : testResults.buckets?.error ? (
                      <p className="text-sm ml-7 text-red-500">
                        Error: {testResults.buckets.error}
                      </p>
                    ) : (
                      <p className="text-sm ml-7 text-gray-500">No data available</p>
                    )}
                  </div>
                  
                  {/* Migration Functions */}
                  <div className="py-3">
                    <h4 className="font-medium mb-2">Migration Functions</h4>
                    
                    {/* Gallery */}
                    <div className="ml-2 mb-3">
                      <div className="flex items-center">
                        {testResults.migrations?.gallery?.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <p className="text-sm font-medium">Gallery Migration</p>
                      </div>
                      
                      {testResults.migrations?.gallery?.error ? (
                        <p className="text-xs ml-7 text-red-500">
                          Error: {testResults.migrations.gallery.error}
                        </p>
                      ) : testResults.migrations?.gallery?.data ? (
                        <pre className="text-xs ml-7 p-2 bg-gray-50 dark:bg-gray-800 rounded mt-1 overflow-auto max-h-24">
                          {JSON.stringify(testResults.migrations.gallery.data, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                    
                    {/* Events */}
                    <div className="ml-2 mb-3">
                      <div className="flex items-center">
                        {testResults.migrations?.events?.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <p className="text-sm font-medium">Events Migration</p>
                      </div>
                      
                      {testResults.migrations?.events?.error ? (
                        <p className="text-xs ml-7 text-red-500">
                          Error: {testResults.migrations.events.error}
                        </p>
                      ) : testResults.migrations?.events?.data ? (
                        <pre className="text-xs ml-7 p-2 bg-gray-50 dark:bg-gray-800 rounded mt-1 overflow-auto max-h-24">
                          {JSON.stringify(testResults.migrations.events.data, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                    
                    {/* Videos */}
                    <div className="ml-2">
                      <div className="flex items-center">
                        {testResults.migrations?.videos?.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <p className="text-sm font-medium">Videos Migration</p>
                      </div>
                      
                      {testResults.migrations?.videos?.error ? (
                        <p className="text-xs ml-7 text-red-500">
                          Error: {testResults.migrations.videos.error}
                        </p>
                      ) : testResults.migrations?.videos?.data ? (
                        <pre className="text-xs ml-7 p-2 bg-gray-50 dark:bg-gray-800 rounded mt-1 overflow-auto max-h-24">
                          {JSON.stringify(testResults.migrations.videos.data, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  </div>
                  
                  {/* Other Errors */}
                  {testResults.error && (
                    <div className="py-3">
                      <div className="flex items-center mb-2">
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        <h4 className="font-medium text-red-500">Error</h4>
                      </div>
                      <p className="text-sm ml-7 text-red-500">
                        {testResults.error}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
              <ErrorBoundary
                fallback={
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
                    <h3 className="font-medium text-lg">Failed to load Migration Tool</h3>
                    <p className="mt-2">Please check the console for errors.</p>
                  </div>
                }
              >
                <DatabaseMigrationTool />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error in component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
} 