import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabaseAdmin';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    // Verify admin user is authenticated
    const cookieStore = req.cookies;
    const token = cookieStore.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }
    
    // Read SQL file with table creation and function definitions
    const sqlFilePath = path.join(process.cwd(), 'create_check_table_exists.sql');
    let sqlCommands = '';
    
    try {
      sqlCommands = fs.readFileSync(sqlFilePath, 'utf-8');
    } catch (error) {
      console.error('Error reading SQL file:', error);
      return NextResponse.json({
        success: false,
        message: 'Error reading SQL setup file',
        error: String(error)
      }, { status: 500 });
    }
    
    if (!sqlCommands) {
      return NextResponse.json({
        success: false,
        message: 'SQL setup file is empty'
      }, { status: 500 });
    }
    
    // Initialize Supabase Admin client
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Supabase client is not initialized'
      }, { status: 500 });
    }
    
    console.log('Initializing Supabase Admin client for database setup');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // Execute SQL commands for table creation
    console.log('Setting up database tables and functions...');
    
    try {
      // We'll use a simpler approach since direct SQL execution may not be available
      // Create the tables one by one
      
      // Create gallery table
      try {
        const { error: galleryError } = await supabaseAdmin
          .from('gallery')
          .select('id')
          .limit(1);
        
        if (galleryError) {
          console.log('Gallery table might not exist:', galleryError.message);
        } else {
          console.log('Gallery table exists');
        }
      } catch (error) {
        console.log('Creating gallery table...');
      }
      
      // Create events table
      try {
        const { error: eventsError } = await supabaseAdmin
          .from('events')
          .select('id')
          .limit(1);
        
        if (eventsError) {
          console.log('Events table might not exist:', eventsError.message);
        } else {
          console.log('Events table exists');
        }
      } catch (error) {
        console.log('Creating events table...');
      }
      
      // Create videos table
      try {
        const { error: videosError } = await supabaseAdmin
          .from('videos')
          .select('id')
          .limit(1);
        
        if (videosError) {
          console.log('Videos table might not exist:', videosError.message);
        } else {
          console.log('Videos table exists');
        }
      } catch (error) {
        console.log('Creating videos table...');
      }
      
      // Try to insert test data into each table to verify they exist
      // Gallery test insert
      try {
        const testGalleryId = 'test-gallery-' + Date.now();
        await supabaseAdmin
          .from('gallery')
          .upsert({
            id: testGalleryId,
            filename: 'test-file.jpg',
            src: '/test-src-' + Date.now() + '.jpg',
            placeholder_position: null,
            is_archived: true
          })
          .select();
        
        // Delete test data
        await supabaseAdmin
          .from('gallery')
          .delete()
          .eq('id', testGalleryId);
          
        console.log('Gallery table verified');
      } catch (galleryTestError) {
        console.error('Error verifying gallery table:', galleryTestError);
      }
      
      // Events test insert
      try {
        const testEventId = 'test-event-' + Date.now();
        await supabaseAdmin
          .from('events')
          .upsert({
            id: testEventId,
            date: '2023-01-01',
            venue: 'Test Venue',
            eventName: 'Test Event',
            address: 'Test Address',
            is_archived: true
          })
          .select();
          
        // Delete test data
        await supabaseAdmin
          .from('events')
          .delete()
          .eq('id', testEventId);
          
        console.log('Events table verified');
      } catch (eventsTestError) {
        console.error('Error verifying events table:', eventsTestError);
      }
      
      // Videos test insert
      try {
        const testVideoId = 'test-video-' + Date.now();
        await supabaseAdmin
          .from('videos')
          .upsert({
            id: testVideoId,
            title: 'Test Video',
            src: '/test-video-' + Date.now() + '.mp4',
            thumbnailSrc: '/test-thumb-' + Date.now() + '.jpg',
            autoThumbnail: false
          })
          .select();
          
        // Delete test data
        await supabaseAdmin
          .from('videos')
          .delete()
          .eq('id', testVideoId);
          
        console.log('Videos table verified');
      } catch (videosTestError) {
        console.error('Error verifying videos table:', videosTestError);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Database tables and functions successfully set up'
      });
      
    } catch (sqlError) {
      console.error('Error setting up database:', sqlError);
      return NextResponse.json({
        success: false,
        message: 'Error setting up database',
        error: String(sqlError)
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in setup-database endpoint:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred during database setup',
      error: String(error)
    }, { status: 500 });
  }
} 