import { NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabaseAdmin';

// Enhanced API endpoint to check Supabase storage and database functionality
export async function GET() {
  try {
    console.log('Running diagnostic check for Supabase integration');
    // Check if Supabase admin client is initialized
    if (!supabaseAdmin) {
      console.error('Diagnostic check: Supabase admin client is not initialized');
      return NextResponse.json({
        success: false,
        message: 'Supabase admin client is not initialized',
        env: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
          supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'
        }
      }, { status: 500 });
    }

    // Try to list buckets
    console.log('Diagnostic check: Listing storage buckets');
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Diagnostic check: Failed to list buckets', bucketsError);
      return NextResponse.json({
        success: false,
        message: 'Failed to list buckets',
        error: bucketsError
      }, { status: 500 });
    }
    
    // Check for required buckets
    const requiredBuckets = ['videos', 'thumbnails', 'gallery', 'temp'];
    const missingBuckets = requiredBuckets.filter(
      required => !buckets.some(bucket => bucket.name === required)
    );
    
    console.log(`Diagnostic check: Found ${buckets.length} buckets. Missing: ${missingBuckets.length > 0 ? missingBuckets.join(', ') : 'None'}`);
    
    // Try to list files in the videos bucket
    let videosFiles = null;
    let videosError = null;
    
    if (buckets.some(bucket => bucket.name === 'videos')) {
      console.log('Diagnostic check: Listing files in videos bucket');
      const { data, error } = await supabaseAdmin.storage.from('videos').list();
      videosFiles = data;
      videosError = error;
      
      if (error) {
        console.error('Diagnostic check: Error listing video files', error);
      } else {
        console.log(`Diagnostic check: Found ${data?.length || 0} files in videos bucket`);
      }
    }

    // Try to list files in the thumbnails bucket
    let thumbnailsFiles = null;
    let thumbnailsError = null;
    
    if (buckets.some(bucket => bucket.name === 'thumbnails')) {
      console.log('Diagnostic check: Listing files in thumbnails bucket');
      const { data, error } = await supabaseAdmin.storage.from('thumbnails').list();
      thumbnailsFiles = data;
      thumbnailsError = error;
      
      if (error) {
        console.error('Diagnostic check: Error listing thumbnail files', error);
      } else {
        console.log(`Diagnostic check: Found ${data?.length || 0} files in thumbnails bucket`);
      }
    }
    
    // Try a small test upload to verify permissions
    let testUploadResult = null;
    let testUploadError = null;
    
    try {
      if (buckets.some(bucket => bucket.name === 'temp')) {
        console.log('Diagnostic check: Testing file upload to temp bucket');
        const testData = Buffer.from('test file for upload verification');
        const testFileName = `test-upload-${Date.now()}.txt`;
        
        const { data, error } = await supabaseAdmin
          .storage
          .from('temp')
          .upload(testFileName, testData, {
            contentType: 'text/plain',
            upsert: true
          });
        
        testUploadResult = data;
        testUploadError = error;
        
        if (error) {
          console.error('Diagnostic check: Test upload failed', error);
        } else {
          console.log('Diagnostic check: Test upload successful');
        }
        
        // If upload succeeded, delete the test file
        if (data && !error) {
          await supabaseAdmin
            .storage
            .from('temp')
            .remove([testFileName]);
        }
      }
    } catch (uploadError) {
      console.error('Diagnostic check: Unexpected error during test upload', uploadError);
      testUploadError = uploadError;
    }
    
    // Check database tables
    console.log('Diagnostic check: Checking videos table existence and structure');
    let videosTable = null;
    let videosTableError = null;
    let videosColumns = null;
    let videosColumnsError = null;
    
    try {
      // Check if videos table exists by trying to select a single row
      const { data, error } = await supabaseAdmin
        .from('videos')
        .select('*')
        .limit(1);
      
      videosTable = data;
      videosTableError = error;
      
      if (error) {
        console.error('Diagnostic check: Error checking videos table', error);
      } else {
        console.log(`Diagnostic check: Videos table exists, retrieved ${data?.length || 0} sample rows`);
        
        // Now check for is_archived column specifically
        try {
          const { data: archiveTest, error: archiveError } = await supabaseAdmin
            .from('videos')
            .select('is_archived')
            .limit(1);
          
          if (archiveError) {
            console.error('Diagnostic check: Could not verify is_archived column', archiveError);
            videosColumnsError = `Error checking is_archived column: ${archiveError.message}`;
          } else {
            console.log('Diagnostic check: is_archived column exists in videos table');
            videosColumns = 'is_archived column exists';
          }
        } catch (columnError) {
          console.error('Diagnostic check: Error checking is_archived column', columnError);
          videosColumnsError = String(columnError);
        }
      }
    } catch (tableError) {
      console.error('Diagnostic check: Unexpected error checking videos table', tableError);
      videosTableError = String(tableError);
    }
    
    console.log('Diagnostic check: Tests completed');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
        supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set (hidden)' : 'Not set'
      },
      storage: {
        buckets: buckets,
        missingBuckets: missingBuckets.length > 0 ? missingBuckets : null,
        hasMissingBuckets: missingBuckets.length > 0,
        videosFiles: videosFiles,
        videosError: videosError,
        thumbnailsFiles: thumbnailsFiles,
        thumbnailsError: thumbnailsError,
        testUploadResult: testUploadResult,
        testUploadError: testUploadError
      },
      database: {
        videosTable: videosTable !== null ? 'Exists' : null,
        videosTableError: videosTableError,
        videosColumns: videosColumns,
        videosColumnsError: videosColumnsError
      }
    });
  } catch (error) {
    console.error('Error in diagnostic check endpoint:', error);
    return NextResponse.json({
      success: false,
      message: 'Error running diagnostic checks',
      error: String(error)
    }, { status: 500 });
  }
} 