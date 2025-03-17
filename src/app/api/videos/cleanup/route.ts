import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabaseAdmin';

// POST /api/videos/cleanup - Clean up orphaned files
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase client is initialized
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase client is not initialized' }, { status: 500 });
    }
    
    // Get the list of orphaned files from the request body
    const { orphanedVideos, orphanedThumbnails } = await request.json();
    
    // Track deleted files
    const deletedVideos: string[] = [];
    const deletedThumbnails: string[] = [];
    const errors: string[] = [];
    
    // Delete orphaned videos
    if (orphanedVideos && orphanedVideos.length > 0) {
      for (const video of orphanedVideos) {
        try {
          const { error } = await supabaseAdmin
            .storage
            .from('videos')
            .remove([video.name]);
          
          if (error) {
            console.error('Error deleting orphaned video:', error);
            errors.push(`Error deleting video ${video.name}: ${error.message}`);
          } else {
            deletedVideos.push(video.name);
          }
        } catch (error) {
          console.error('Error in video deletion:', error);
          errors.push(`Exception deleting video ${video.name}: ${error}`);
        }
      }
    }
    
    // Delete orphaned thumbnails
    if (orphanedThumbnails && orphanedThumbnails.length > 0) {
      for (const thumbnail of orphanedThumbnails) {
        try {
          const { error } = await supabaseAdmin
            .storage
            .from('thumbnails')
            .remove([thumbnail.name]);
          
          if (error) {
            console.error('Error deleting orphaned thumbnail:', error);
            errors.push(`Error deleting thumbnail ${thumbnail.name}: ${error.message}`);
          } else {
            deletedThumbnails.push(thumbnail.name);
          }
        } catch (error) {
          console.error('Error in thumbnail deletion:', error);
          errors.push(`Exception deleting thumbnail ${thumbnail.name}: ${error}`);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      deletedVideos,
      deletedThumbnails,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Error in POST /api/videos/cleanup:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: String(error)
    }, { status: 500 });
  }
} 