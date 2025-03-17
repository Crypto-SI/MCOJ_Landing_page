'use client';

import ErrorBoundary from './ErrorBoundary';
import StorageStats from './StorageStats';
import BucketSetupTool from './BucketSetupTool';
import DatabaseMigrationTool from './DatabaseMigrationTool';

// Custom fallback UI for storage stats
const StorageStatsFallback = () => (
  <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
    <p className="text-yellow-300 font-bold">Storage Statistics</p>
    <p className="text-yellow-200 mt-2">Unable to load storage statistics. This could be due to:</p>
    <ul className="list-disc pl-5 mt-2 text-yellow-200">
      <li>Supabase configuration issues</li>
      <li>Network connectivity problems</li>
      <li>Missing storage buckets</li>
    </ul>
    <p className="text-yellow-200 mt-2">You can still use other dashboard features.</p>
  </div>
);

// Custom fallback UI for bucket setup tool
const BucketSetupFallback = () => (
  <div className="p-6 bg-white rounded-lg shadow-md mt-4">
    <h2 className="text-xl font-bold mb-4">Storage Bucket Setup</h2>
    <p className="mb-4 text-gray-700">
      The bucket setup tool could not be loaded. Please create the following buckets manually in your Supabase dashboard:
    </p>
    <ul className="list-disc pl-5 mb-4 text-gray-700">
      <li><strong>videos</strong>: Stores uploaded video files</li>
      <li><strong>gallery</strong>: Stores gallery images (public)</li>
      <li><strong>thumbnails</strong>: Stores video thumbnails (public)</li>
      <li><strong>temp</strong>: Temporary storage during file processing</li>
    </ul>
  </div>
);

// Custom fallback UI for database migration tool
const MigrationToolFallback = () => (
  <div className="p-6 bg-white rounded-lg shadow-md">
    <h2 className="text-xl font-bold mb-4">Database Migration Tool</h2>
    <p className="mb-4 text-gray-700">
      The database migration tool could not be loaded. Please ensure your Supabase buckets are set up properly.
    </p>
  </div>
);

// Wrapped components with error boundaries
export const SafeStorageStats = () => (
  <ErrorBoundary fallback={<StorageStatsFallback />}>
    <StorageStats />
  </ErrorBoundary>
);

export const SafeBucketSetupTool = () => (
  <ErrorBoundary fallback={<BucketSetupFallback />}>
    <BucketSetupTool />
  </ErrorBoundary>
);

export const SafeDatabaseMigrationTool = () => (
  <ErrorBoundary fallback={<MigrationToolFallback />}>
    <DatabaseMigrationTool />
  </ErrorBoundary>
); 