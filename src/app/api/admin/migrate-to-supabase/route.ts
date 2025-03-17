import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { migrateAllDataToSupabase, checkRequiredTables, checkRequiredBuckets } from '@/utils/migrateToSupabase';
import supabaseAdmin from '@/utils/supabaseAdmin';

// Define the migration result type to match what migrateAllDataToSupabase returns
interface MigrationResult {
  success: boolean;
  results: Record<string, any>;
  error?: string;
}

/**
 * API Route to migrate data from JSON files to Supabase
 * POST /api/admin/migrate-to-supabase
 */
export async function POST(req: NextRequest) {
  try {
    // Simple authentication check based on cookie
    // This matches the localStorage-based auth approach used in the admin pages
    const cookieStore = cookies();
    const authCookie = cookieStore.get('mcoj_admin_authenticated');
    
    if (!authCookie || authCookie.value !== 'true') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify Supabase URL and Service Role are configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!serviceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
      
      console.error(`Missing environment variables: ${missingVars.join(', ')}`);
      return NextResponse.json({
        success: false,
        message: `Missing Supabase environment variables: ${missingVars.join(', ')}`,
        results: {
          gallery: false,
          events: false,
          videos: false,
          bookings: false
        }
      }, { status: 500 });
    }

    // Verify Supabase client is initialized
    if (!supabaseAdmin) {
      console.error('Supabase client is not initialized');
      return NextResponse.json({
        success: false,
        message: 'Supabase client is not properly initialized. Check your environment variables.',
        results: {
          gallery: false,
          events: false,
          videos: false,
          bookings: false
        }
      }, { status: 500 });
    }
    
    // Test Supabase connection before proceeding - start with storage buckets
    try {
      console.log('Testing Supabase connection...');
      
      // First check storage access
      const { data: buckets, error: storageError } = await supabaseAdmin.storage.listBuckets();
      
      if (storageError) {
        console.error('Supabase storage access failed:', storageError);
        return NextResponse.json({
          success: false,
          message: 'Failed to access Supabase storage: ' + storageError.message,
          error: JSON.stringify(storageError),
          results: {
            gallery: false,
            events: false,
            videos: false,
            bookings: false
          }
        }, { status: 500 });
      }
      
      // Log buckets for debugging
      const bucketNames = buckets.map(bucket => bucket.name);
      console.log('Available buckets:', bucketNames.join(', '));
      
      // Check if required buckets exist
      const bucketCheck = await checkRequiredBuckets();
      if (!bucketCheck.allExist) {
        return NextResponse.json({
          success: false,
          message: `Missing required storage buckets: ${bucketCheck.missing.join(', ')}. Please create them in the Supabase dashboard first.`,
          bucketCheck,
          results: {
            gallery: false,
            events: false,
            videos: false,
            bookings: false
          }
        }, { status: 400 }); // 400 Bad Request - client needs to create buckets
      }
      
      // Then check database tables
      console.log('Checking database tables...');
      const tablesCheck = await checkRequiredTables();
      
      if (!tablesCheck.allExist) {
        return NextResponse.json({
          success: false,
          message: `Missing required database tables: ${tablesCheck.missing.join(', ')}. The system will attempt to create them automatically during migration.`,
          tablesCheck,
          results: {
            gallery: false,
            events: false,
            videos: false,
            bookings: false
          }
        }, { status: 200 }); // 200 OK - we'll create tables during migration
      }
      
      console.log('Supabase connection test successful');
    } catch (connectionError) {
      console.error('Error testing Supabase connection:', connectionError);
      return NextResponse.json({
        success: false,
        message: 'Error connecting to Supabase: ' + String(connectionError),
        error: connectionError instanceof Error ? connectionError.stack : null,
        results: {
          gallery: false,
          events: false,
          videos: false,
          bookings: false
        }
      }, { status: 500 });
    }

    // Run migration
    console.log('Starting data migration to Supabase...');
    const migrationResult = await migrateAllDataToSupabase() as MigrationResult;
    const { success, results, error } = migrationResult;

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Data successfully migrated to Supabase!',
        results
      });
    } else {
      console.error('Migration error:', error);
      return NextResponse.json({
        success: false,
        message: error || 'Migration completed with some errors. Check server logs for details.',
        results
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Migration failed',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      results: {
        gallery: false,
        events: false,
        videos: false,
        bookings: false
      }
    }, { status: 500 });
  }
} 