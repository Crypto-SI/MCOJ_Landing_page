import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define the video type for the VideoGallery component
export type GalleryVideo = {
  id: string; // Using the filename as ID
  src: string;
  thumbnailSrc: string;
  title: string;
  description?: string;
  autoThumbnail?: boolean; // Flag to indicate if thumbnail was auto-generated
};

// Directory paths
const dataDirectory = path.join(process.cwd(), 'public', 'data');
const videosDirectory = path.join(process.cwd(), 'public', 'videos');
const thumbnailsDirectory = path.join(process.cwd(), 'public', 'videos', 'thumbnails');

// Ensure directories exist
export function ensureDirectories() {
  [dataDirectory, videosDirectory, thumbnailsDirectory].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Function to get all videos for the gallery
export function getVideos(): GalleryVideo[] {
  try {
    console.log('Video Utils - Reading videos directory');
    ensureDirectories();
    
    // Path to videos JSON file
    const videosJsonPath = path.join(dataDirectory, 'videos.json');
    
    // Check if the videos.json file exists
    if (!fs.existsSync(videosJsonPath)) {
      console.log('Video Utils - videos.json not found, creating empty file');
      fs.writeFileSync(videosJsonPath, JSON.stringify([]));
      return [];
    }
    
    // Read the videos.json file
    const videosData = JSON.parse(fs.readFileSync(videosJsonPath, 'utf8'));
    
    console.log(`Video Utils - Loaded ${videosData.length} videos`);
    return videosData;
  } catch (error) {
    console.error('Video Utils - Error getting videos:', error);
    return [];
  }
}

// Function to save videos data
export function saveVideos(videos: GalleryVideo[]): boolean {
  try {
    ensureDirectories();
    const videosJsonPath = path.join(dataDirectory, 'videos.json');
    fs.writeFileSync(videosJsonPath, JSON.stringify(videos, null, 2));
    return true;
  } catch (error) {
    console.error('Video Utils - Error saving videos:', error);
    return false;
  }
}

// Function to delete a video and its thumbnail
export function deleteVideo(videoId: string): boolean {
  try {
    // Get all videos
    const videos = getVideos();
    
    // Find the video to delete
    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex === -1) {
      console.error(`Video Utils - Video with ID ${videoId} not found`);
      return false;
    }
    
    const video = videos[videoIndex];
    
    // Delete the video file
    const videoPath = path.join(process.cwd(), 'public', video.src);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
    
    // Delete the thumbnail file (only if it's not one of the placeholder images)
    if (!video.thumbnailSrc.includes('default-thumbnail') && 
        !video.thumbnailSrc.includes('placeholder.svg')) {
      const thumbnailPath = path.join(process.cwd(), 'public', video.thumbnailSrc);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }
    
    // Remove from the array
    videos.splice(videoIndex, 1);
    
    // Save the updated list
    saveVideos(videos);
    
    return true;
  } catch (error) {
    console.error('Video Utils - Error deleting video:', error);
    return false;
  }
} 