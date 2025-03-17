import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import supabaseAdmin from '@/utils/supabaseAdmin';

// GET /api/videos - Fetch all videos
// Can filter with ?archived=true|false query parameter
export async function GET(request: NextRequest) {
  try {
    // Check if Supabase client is initialized
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase client is not initialized' }, { status: 500 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const archivedParam = searchParams.get('archived');
    const storageOnly = searchParams.get('storageOnly') === 'true';
    
    if (storageOnly) {
      // List all files in storage
      const { data: videoFiles, error: videoError } = await supabaseAdmin
        .storage
        .from('videos')
        .list();
      
      if (videoError) {
        console.error('Error listing video files:', videoError);
        return NextResponse.json({ error: 'Failed to list video files' }, { status: 500 });
      }
      
      const { data: thumbnailFiles, error: thumbnailError } = await supabaseAdmin
        .storage
        .from('thumbnails')
        .list();
      
      if (thumbnailError) {
        console.error('Error listing thumbnail files:', thumbnailError);
        return NextResponse.json({ error: 'Failed to list thumbnail files' }, { status: 500 });
      }
      
      // Get all video records from database
      const { data: dbVideos, error: dbError } = await supabaseAdmin
        .from('videos')
        .select('*');
      
      if (dbError) {
        console.error('Error fetching video records:', dbError);
        return NextResponse.json({ error: 'Failed to fetch video records' }, { status: 500 });
      }
      
      // Create a map of video IDs from the database
      const dbVideoIds = new Set(dbVideos.map(v => v.id));
      
      // Filter out files that don't have corresponding database records
      const orphanedVideos = videoFiles.filter(file => {
        const videoId = file.name.split('.')[0];
        return !dbVideoIds.has(videoId);
      });
      
      const orphanedThumbnails = thumbnailFiles.filter(file => {
        const videoId = file.name.split('-thumb')[0];
        return !dbVideoIds.has(videoId) && file.name !== 'placeholder.svg';
      });
      
      return NextResponse.json({
        orphanedVideos,
        orphanedThumbnails,
        totalStorageFiles: videoFiles.length + thumbnailFiles.length,
        totalDbRecords: dbVideos.length
      });
    }
    
    // Build query for database records
    let query = supabaseAdmin
      .from('videos')
      .select('*');
    
    // Filter by archive status if specified
    if (archivedParam !== null) {
      const isArchived = archivedParam === 'true';
      query = query.eq('is_archived', isArchived);
    }
    
    // Execute the query with ordering
    const { data, error } = await query.order('order_index', { ascending: true });
    
    if (error) {
      console.error('Error fetching videos:', error);
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }
    
    return NextResponse.json({ videos: data });
  } catch (error) {
    console.error('Error in GET /api/videos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/videos - Upload a new video
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/videos: Starting video upload');
    
    // Check if Supabase client is initialized
    if (!supabaseAdmin) {
      console.error('POST /api/videos: Supabase client is not initialized');
      return NextResponse.json({ error: 'Supabase client is not initialized' }, { status: 500 });
    }
    
    // Parse the FormData
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const videoFile = formData.get('video') as File;
    const thumbnailFile = formData.get('thumbnail') as File | null;
    const isArchived = formData.get('is_archived') === 'true';
    
    console.log(`POST /api/videos: Received form data - title: ${title}, has video: ${!!videoFile}, has thumbnail: ${!!thumbnailFile}`);
    
    // Validate required fields
    if (!title || !videoFile) {
      console.error('POST /api/videos: Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Generate unique IDs
    const videoId = uuidv4();
    const videoFileName = `${videoId}.${videoFile.name.split('.').pop()}`;
    let thumbnailFileName = '';
    
    console.log(`POST /api/videos: Generated video ID: ${videoId}, filename: ${videoFileName}`);
    
    try {
      // Upload video to Supabase Storage
      console.log('POST /api/videos: Uploading video to storage');
      const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
      const { error: videoUploadError } = await supabaseAdmin
        .storage
        .from('videos')
        .upload(videoFileName, videoBuffer, {
          contentType: videoFile.type,
          upsert: false
        });
      
      if (videoUploadError) {
        console.error('POST /api/videos: Error uploading video:', videoUploadError);
        return NextResponse.json({ 
          error: 'Failed to upload video', 
          details: videoUploadError 
        }, { status: 500 });
      }
      
      console.log('POST /api/videos: Video upload successful');
      
      // Get the public URL for the video
      const { data: videoUrlData } = supabaseAdmin
        .storage
        .from('videos')
        .getPublicUrl(videoFileName);
      
      const videoUrl = videoUrlData.publicUrl;
      let thumbnailUrl = '';
      
      // Handle thumbnail upload
      if (thumbnailFile) {
        console.log('POST /api/videos: Uploading thumbnail');
        thumbnailFileName = `${videoId}-thumb.${thumbnailFile.name.split('.').pop()}`;
        const thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
        
        const { error: thumbnailUploadError } = await supabaseAdmin
          .storage
          .from('thumbnails')
          .upload(thumbnailFileName, thumbnailBuffer, {
            contentType: thumbnailFile.type,
            upsert: false
          });
        
        if (thumbnailUploadError) {
          console.error('POST /api/videos: Error uploading thumbnail:', thumbnailUploadError);
          // Continue without thumbnail, will use placeholder
        } else {
          // Get the public URL for the thumbnail
          const { data: thumbnailUrlData } = supabaseAdmin
            .storage
            .from('thumbnails')
            .getPublicUrl(thumbnailFileName);
          
          thumbnailUrl = thumbnailUrlData.publicUrl;
          console.log('POST /api/videos: Thumbnail upload successful');
        }
      }
      
      // If no thumbnail was provided or upload failed, use a placeholder
      if (!thumbnailUrl) {
        console.log('POST /api/videos: Using placeholder thumbnail');
        thumbnailFileName = 'placeholder.svg';
        const { data: placeholderUrlData } = supabaseAdmin
          .storage
          .from('thumbnails')
          .getPublicUrl(thumbnailFileName);
        
        thumbnailUrl = placeholderUrlData.publicUrl;
      }
      
      // Get the current count of videos for the order index
      console.log('POST /api/videos: Getting current video count for order_index');
      const { count, error: countError } = await supabaseAdmin
        .from('videos')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('POST /api/videos: Error getting video count:', countError);
      }
      
      const orderIndex = count || 0;
      
      // Build the video record
      const videoRecord = {
        id: videoId,
        title,
        description: description || '',
        src: videoUrl,
        thumbnailSrc: thumbnailUrl,
        order_index: orderIndex,
        is_archived: isArchived || false
      };
      
      console.log('POST /api/videos: Inserting video record:', JSON.stringify(videoRecord, null, 2));
      
      // Insert video data into the database
      const { data: insertedVideo, error: insertError } = await supabaseAdmin
        .from('videos')
        .insert([videoRecord])
        .select();
      
      if (insertError) {
        console.error('POST /api/videos: Error saving video data:', insertError);
        return NextResponse.json({ 
          error: 'Failed to save video data', 
          details: insertError 
        }, { status: 500 });
      }
      
      console.log('POST /api/videos: Video record inserted successfully');
      
      return NextResponse.json({ 
        success: true, 
        video: insertedVideo[0]
      });
    } catch (uploadError) {
      console.error('POST /api/videos: Error during upload process:', uploadError);
      return NextResponse.json({ 
        error: 'Error during upload process', 
        details: String(uploadError) 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST /api/videos:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: String(error) 
    }, { status: 500 });
  }
}

// PUT /api/videos/{id} - Update a video (for toggling archive status)
export async function PUT(request: NextRequest) {
  try {
    // Check if Supabase client is initialized
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase client is not initialized' }, { status: 500 });
    }
    
    // Get the video ID from the URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing video ID' }, { status: 400 });
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Check if is_archived is provided
    if (body.is_archived === undefined) {
      return NextResponse.json({ error: 'Missing is_archived parameter' }, { status: 400 });
    }
    
    // Update the video's archive status
    const { data, error } = await supabaseAdmin
      .from('videos')
      .update({ is_archived: body.is_archived })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating video archive status:', error);
      return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      video: data[0]
    });
  } catch (error) {
    console.error('Error in PUT /api/videos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/videos - Delete a video and its files
export async function DELETE(request: NextRequest) {
  try {
    // Check if Supabase client is initialized
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase client is not initialized' }, { status: 500 });
    }
    
    // Get the video ID from the URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing video ID' }, { status: 400 });
    }
    
    // First get the video to find the file paths
    const { data: video, error: fetchError } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching video to delete:', fetchError);
      return NextResponse.json({ error: 'Failed to find video' }, { status: 404 });
    }

    // Type check video object
    if (!video || typeof video !== 'object') {
      console.error('Invalid video data returned from database');
      return NextResponse.json({ error: 'Invalid video data' }, { status: 500 });
    }
    
    // Extract filenames from URLs
    const videoSrc = video.src as string;
    const thumbnailSrc = video.thumbnailSrc as string;
    const videoFileName = videoSrc ? videoSrc.split('/').pop() : '';
    const thumbnailFileName = thumbnailSrc ? thumbnailSrc.split('/').pop() : '';
    
    // Delete files from storage (don't delete placeholder thumbnail)
    if (videoFileName) {
      const { error: videoDeleteError } = await supabaseAdmin
        .storage
        .from('videos')
        .remove([videoFileName]);
      
      if (videoDeleteError) {
        console.error('Error deleting video file:', videoDeleteError);
        // Continue with record deletion even if file deletion fails
      }
    }
    
    if (thumbnailFileName && thumbnailFileName !== 'placeholder.svg') {
      const { error: thumbnailDeleteError } = await supabaseAdmin
        .storage
        .from('thumbnails')
        .remove([thumbnailFileName]);
      
      if (thumbnailDeleteError) {
        console.error('Error deleting thumbnail file:', thumbnailDeleteError);
        // Continue with record deletion even if file deletion fails
      }
    }
    
    // Delete record from database
    const { error: deleteError } = await supabaseAdmin
      .from('videos')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting video record:', deleteError);
      return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/videos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 