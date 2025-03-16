import { NextRequest, NextResponse } from 'next/server';
import { getVideos, saveVideos, deleteVideo } from '@/utils/videoUtils';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Directory paths
const dataDirectory = path.join(process.cwd(), 'public', 'data');
const videosDirectory = path.join(process.cwd(), 'public', 'videos');
const thumbnailsDirectory = path.join(process.cwd(), 'public', 'videos', 'thumbnails');

// Ensure directories exist
function ensureDirectories() {
  [dataDirectory, videosDirectory, thumbnailsDirectory].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// GET handler for videos
export async function GET() {
  try {
    console.log('GET request for videos');
    const videos = getVideos();

    return NextResponse.json({ videos }, { status: 200 });
  } catch (error) {
    console.error('Error handling GET request for videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

// POST handler for video uploads
export async function POST(request: NextRequest) {
  try {
    console.log('POST request to upload video');
    ensureDirectories();
    
    const formData = await request.formData();
    
    // Get form fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const videoFile = formData.get('video') as File;
    const thumbnailFile = formData.get('thumbnail') as File | null;
    const autoThumbnailStr = formData.get('autoThumbnail') as string || 'false';
    const autoThumbnail = autoThumbnailStr === 'true';
    
    if (!title || !videoFile) {
      return NextResponse.json(
        { error: 'Title and video file are required' },
        { status: 400 }
      );
    }
    
    // Generate a unique ID for the video
    const videoId = uuidv4();
    
    // Determine file extension
    const videoExtMatch = videoFile.name.match(/\.([^.]+)$/);
    const videoExt = videoExtMatch ? videoExtMatch[1] : 'mp4';
    
    // Define file paths
    const videoFileName = `${videoId}.${videoExt}`;
    const videoFilePath = path.join(videosDirectory, videoFileName);
    
    // Save the video file
    const videoBuffer = await videoFile.arrayBuffer();
    fs.writeFileSync(videoFilePath, Buffer.from(videoBuffer));
    
    // Handle thumbnail
    let thumbnailSrc = '';
    
    if (thumbnailFile) {
      // Use the provided thumbnail
      const thumbExtMatch = thumbnailFile.name.match(/\.([^.]+)$/);
      const thumbExt = thumbExtMatch ? thumbExtMatch[1] : 'jpg';
      const thumbnailFileName = `${videoId}-thumb.${thumbExt}`;
      const thumbnailFilePath = path.join(thumbnailsDirectory, thumbnailFileName);
      
      const thumbnailBuffer = await thumbnailFile.arrayBuffer();
      fs.writeFileSync(thumbnailFilePath, Buffer.from(thumbnailBuffer));
      thumbnailSrc = `/videos/thumbnails/${thumbnailFileName}`;
    } else {
      // Use placeholder image
      thumbnailSrc = '/videos/thumbnails/placeholder.svg';
    }
    
    // Create and save the video entry
    const newVideo = {
      id: videoId,
      src: `/videos/${videoFileName}`,
      thumbnailSrc,
      title,
      description,
      autoThumbnail
    };
    
    // Add to videos.json
    const videos = getVideos();
    videos.push(newVideo);
    saveVideos(videos);
    
    return NextResponse.json(
      { 
        message: 'Video uploaded successfully',
        video: newVideo,
        autoThumbnail
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error handling POST request for video upload:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}

// DELETE handler for videos
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id');
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }
    
    const success = deleteVideo(videoId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete video' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Video deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error handling DELETE request for video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
} 