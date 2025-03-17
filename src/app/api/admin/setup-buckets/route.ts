import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ensureSupabaseBucketsExist, REQUIRED_BUCKETS } from '@/utils/setupSupabaseBuckets';
import supabaseAdmin from '@/utils/supabaseAdmin';

/**
 * API Route to set up required Supabase storage buckets
 * POST /api/admin/setup-buckets
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const authCookie = cookieStore.get('mcoj_admin_authenticated');
    
    if (!authCookie || authCookie.value !== 'true') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify Supabase client is initialized
    if (!supabaseAdmin) {
      console.error('Supabase client is not initialized');
      return NextResponse.json({
        success: false,
        message: 'Supabase client is not properly initialized. Check your environment variables.',
        details: {
          requiredBuckets: REQUIRED_BUCKETS,
          created: [],
          existing: [],
          failed: REQUIRED_BUCKETS
        }
      }, { status: 500 });
    }

    try {
      // Test Supabase connection before proceeding
      await supabaseAdmin.auth.getSession();
    } catch (connectionError) {
      console.error('Supabase connection test failed:', connectionError);
      return NextResponse.json({
        success: false,
        message: 'Could not connect to Supabase. Check your environment variables and network connectivity.',
        details: {
          requiredBuckets: REQUIRED_BUCKETS,
          created: [],
          existing: [],
          failed: REQUIRED_BUCKETS
        }
      }, { status: 500 });
    }

    // Set up required buckets
    const result = await ensureSupabaseBucketsExist().catch(error => {
      console.error('Error in bucket setup:', error);
      return {
        success: false,
        created: [],
        existing: [],
        failed: REQUIRED_BUCKETS
      };
    });

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'All required storage buckets are set up successfully!' 
        : 'Some buckets could not be created. Check server logs for details.',
      details: {
        requiredBuckets: REQUIRED_BUCKETS,
        created: result.created,
        existing: result.existing,
        failed: result.failed
      }
    });
  } catch (error) {
    console.error('Bucket setup API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to set up storage buckets',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        requiredBuckets: REQUIRED_BUCKETS,
        created: [],
        existing: [],
        failed: REQUIRED_BUCKETS
      }
    }, { status: 500 });
  }
} 