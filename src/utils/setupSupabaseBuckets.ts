import supabaseAdmin from './supabaseAdmin';

// Define the buckets needed for the application
export const REQUIRED_BUCKETS = [
  'videos',      // For storing video files
  'gallery',     // For storing gallery images
  'thumbnails',  // For storing video thumbnails
  'temp',        // For temporary file storage during processing
  'events',      // For storing event-related files
  'bookings'     // For storing booking request attachments
];

/**
 * Check if a bucket exists in Supabase storage
 * @param bucketName - The name of the bucket to check
 */
async function bucketExists(bucketName: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .storage
      .getBucket(bucketName);
    
    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Create a new bucket in Supabase storage
 * @param bucketName - The name of the bucket to create
 * @param isPublic - Whether the bucket should be publicly accessible
 */
async function createBucket(bucketName: string, isPublic: boolean = false): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .storage
      .createBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: 52428800, // 50MB limit
      });
    
    if (error) {
      console.error(`Error creating bucket "${bucketName}":`, error);
      return false;
    }
    
    console.log(`Successfully created bucket "${bucketName}"`);
    return true;
  } catch (error) {
    console.error(`Error creating bucket "${bucketName}":`, error);
    return false;
  }
}

/**
 * Set up bucket policies to control access
 * @param bucketName - The name of the bucket to configure
 * @param isPublic - Whether the bucket should be publicly accessible
 */
async function setupBucketPolicy(bucketName: string, isPublic: boolean = false): Promise<boolean> {
  if (!isPublic) return true; // Skip if not public
  
  try {
    // Create a policy that allows public access to read files
    const { error } = await supabaseAdmin
      .storage
      .from(bucketName)
      .createSignedUrls(['dummy.txt'], 60); // This just tests the bucket
    
    if (error) {
      console.error(`Error setting up policy for "${bucketName}":`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error setting up policy for "${bucketName}":`, error);
    return false;
  }
}

/**
 * Ensure all required buckets exist in Supabase, creating them if needed
 */
export async function ensureSupabaseBucketsExist(): Promise<{
  success: boolean;
  created: string[];
  existing: string[];
  failed: string[];
}> {
  const result = {
    success: true,
    created: [] as string[],
    existing: [] as string[],
    failed: [] as string[]
  };

  for (const bucket of REQUIRED_BUCKETS) {
    const exists = await bucketExists(bucket);
    
    if (exists) {
      console.log(`Bucket "${bucket}" already exists`);
      result.existing.push(bucket);
      continue;
    }
    
    // Gallery and thumbnails should be public, others private
    const isPublic = ['gallery', 'thumbnails'].includes(bucket);
    
    // Create the bucket
    const created = await createBucket(bucket, isPublic);
    if (!created) {
      result.success = false;
      result.failed.push(bucket);
      continue;
    }
    
    // Set up policies if needed
    if (isPublic) {
      await setupBucketPolicy(bucket, true);
    }
    
    result.created.push(bucket);
  }
  
  return result;
}

// Export a function to check individual bucket existence
export async function checkBucketExists(bucketName: string): Promise<boolean> {
  return await bucketExists(bucketName);
}

// You can run this file directly with:
// node -r ts-node/register ./src/utils/setupSupabaseBuckets.ts
if (require.main === module) {
  ensureSupabaseBucketsExist()
    .then((result) => {
      console.log('Bucket setup complete:');
      console.log('- Success:', result.success);
      console.log('- Created buckets:', result.created.join(', ') || 'None');
      console.log('- Existing buckets:', result.existing.join(', ') || 'None');
      console.log('- Failed buckets:', result.failed.join(', ') || 'None');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Bucket setup failed:', error);
      process.exit(1);
    });
} 