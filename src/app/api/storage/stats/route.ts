import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabaseAdmin';
import { REQUIRED_BUCKETS } from '@/utils/setupSupabaseBuckets';

// Disable API route caching to ensure we always get fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    };

    // Verify Supabase connection works
    if (!supabaseAdmin) {
      console.error('Supabase client is not initialized');
      return NextResponse.json({
        success: false,
        error: 'Supabase client is not initialized',
        setupRequired: true,
        missingBuckets: REQUIRED_BUCKETS
      }, { headers });
    }

    // First check if buckets exist
    const missingBuckets = [];
    const existingBuckets = [];
    
    try {
      for (const bucket of REQUIRED_BUCKETS) {
        try {
          const { data, error } = await supabaseAdmin
            .storage
            .getBucket(bucket);
          
          if (error || !data) {
            missingBuckets.push(bucket);
          } else {
            existingBuckets.push(bucket);
          }
        } catch (error) {
          console.error(`Error checking bucket ${bucket}:`, error);
          missingBuckets.push(bucket);
        }
      }
    } catch (error) {
      console.error('Error checking bucket existence:', error);
      // If we can't even check buckets, assume they're all missing
      return NextResponse.json({
        success: false,
        error: 'Error checking storage buckets',
        setupRequired: true,
        missingBuckets: REQUIRED_BUCKETS
      }, { headers });
    }
    
    // If all buckets are missing, return a specific error
    if (missingBuckets.length === REQUIRED_BUCKETS.length) {
      return NextResponse.json({
        success: false,
        error: 'Storage buckets have not been set up',
        setupRequired: true,
        missingBuckets: REQUIRED_BUCKETS
      }, { headers });
    }

    // Initialize stats structure
    const stats = {
      total: {
        size: 0,
        files: 0
      },
      videos: {
        size: 0,
        files: 0
      },
      images: {
        size: 0,
        files: 0
      },
      other: {
        size: 0,
        files: 0
      },
      limit: 50 * 1024 * 1024, // 50MB in bytes
      used_percentage: 0,
      missingBuckets: missingBuckets
    };

    // Add bucket-specific stats
    const bucketsStats = [];

    // Get statistics for each existing bucket
    for (const bucket of existingBuckets) {
      try {
        const { data, error } = await supabaseAdmin
          .storage
          .from(bucket)
          .list('', {
            // Force fresh fetch without caching
            // Add a timestamp to prevent cached responses
            offset: 0,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (error) {
          console.error(`Error fetching ${bucket} bucket:`, error);
          continue;
        }

        // Initialize bucket stats
        const bucketStats = {
          name: bucket,
          size: 0,
          files: 0
        };

        // Process each file in the bucket
        for (const file of data || []) {
          try {
            // Skip folders
            if (file.metadata === null) continue;
            
            const size = file.metadata.size || 0;
            const contentType = file.metadata.mimetype || '';

            // Update total stats
            stats.total.size += size;
            stats.total.files += 1;

            // Update bucket stats
            bucketStats.size += size;
            bucketStats.files += 1;

            // Categorize by file type
            if (contentType.startsWith('video/') || bucket === 'videos') {
              stats.videos.size += size;
              stats.videos.files += 1;
            } else if (contentType.startsWith('image/') || bucket === 'gallery' || bucket === 'thumbnails') {
              stats.images.size += size;
              stats.images.files += 1;
            } else {
              stats.other.size += size;
              stats.other.files += 1;
            }
          } catch (fileError) {
            console.error(`Error processing file in ${bucket}:`, fileError);
            // Continue with next file
            continue;
          }
        }

        // Add bucket stats to the list
        bucketsStats.push(bucketStats);
      } catch (bucketError) {
        console.error(`Error processing bucket ${bucket}:`, bucketError);
        // Continue with the next bucket
        continue;
      }
    }

    // Calculate percentage used
    stats.used_percentage = (stats.total.size / stats.limit) * 100;

    // Return with no-cache headers
    return NextResponse.json({
      success: true,
      stats,
      bucketsStats,
      bucketsStatus: {
        total: REQUIRED_BUCKETS.length,
        existing: existingBuckets.length,
        missing: missingBuckets.length,
        missingBuckets: missingBuckets
      },
      timestamp: new Date().toISOString() // Add timestamp to help verify freshness
    }, { headers });
  } catch (error) {
    console.error('Error fetching storage stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch storage statistics',
      setupRequired: true,
      missingBuckets: REQUIRED_BUCKETS
    }, { status: 500, headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }});
  }
} 