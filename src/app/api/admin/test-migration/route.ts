import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkRequiredBuckets, migrateGallery, migrateEvents, migrateVideos } from '@/utils/migrateToSupabase';
import supabaseAdmin from '@/utils/supabaseAdmin';
import path from 'path';
import fs from 'fs';

/**
 * API Route to test migration functionality
 * GET /api/admin/test-migration
 */
export async function GET(req: NextRequest) {
  try {
    // Simple authentication check based on cookie
    const cookieStore = cookies();
    const authCookie = cookieStore.get('mcoj_admin_authenticated');
    
    if (!authCookie || authCookie.value !== 'true') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Results object to store all test outcomes
    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      supabase: { success: false, message: '' },
      dataFiles: {},
      buckets: { success: false, data: null },
      migrations: {
        gallery: { success: false, data: null },
        events: { success: false, data: null },
        videos: { success: false, data: null }
      }
    };

    // Step 1: Test Supabase connection
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase client is not initialized');
      }
      
      // Check if environment variables are set
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Supabase environment variables are not properly set');
      }
      
      // Simple query to test connection
      const { data, error } = await supabaseAdmin.from('videos').select('count()', { count: 'exact', head: true });
      
      if (error) {
        throw new Error(`Supabase query error: ${error.message}`);
      }
      
      results.supabase = {
        success: true,
        message: 'Supabase connection successful',
        url: process.env.NEXT_PUBLIC_SUPABASE_URL
      };
    } catch (error) {
      results.supabase = {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
    
    // Step 2: Check required data files
    const dataFiles = ['gallery.json', 'events.json', 'videos.json'];
    const dataFolder = path.join(process.cwd(), 'public', 'data');
    
    for (const file of dataFiles) {
      const filePath = path.join(dataFolder, file);
      results.dataFiles[file] = { exists: false, size: 0, valid: false, items: 0 };
      
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          results.dataFiles[file].exists = true;
          results.dataFiles[file].size = stats.size;
          
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            results.dataFiles[file].valid = true;
            results.dataFiles[file].items = Array.isArray(data) ? data.length : 'unknown';
          } catch (parseError) {
            results.dataFiles[file].parseError = parseError instanceof Error 
              ? parseError.message 
              : String(parseError);
          }
        }
      } catch (error) {
        results.dataFiles[file].error = error instanceof Error 
          ? error.message 
          : String(error);
      }
    }
    
    // Step 3: Check required buckets
    if (results.supabase.success) {
      try {
        const bucketsResult = await checkRequiredBuckets();
        results.buckets = {
          success: bucketsResult.allExist,
          data: bucketsResult
        };
      } catch (error) {
        results.buckets = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    // Step 4: Test each migration function separately
    // Only run if Supabase connection is working
    if (results.supabase.success) {
      // Test Gallery Migration
      try {
        const galleryResult = await migrateGallery();
        results.migrations.gallery = {
          success: true,
          data: galleryResult
        };
      } catch (error) {
        results.migrations.gallery = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
      
      // Test Events Migration
      try {
        const eventsResult = await migrateEvents();
        results.migrations.events = {
          success: true,
          data: eventsResult
        };
      } catch (error) {
        results.migrations.events = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
      
      // Test Videos Migration
      try {
        const videosResult = await migrateVideos();
        results.migrations.videos = {
          success: true,
          data: videosResult
        };
      } catch (error) {
        results.migrations.videos = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Migration test completed',
      results
    });
  } catch (error) {
    console.error('Migration test API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Migration test failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 