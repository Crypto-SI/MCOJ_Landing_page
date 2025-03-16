// Define the video type for the VideoGallery component
export type GalleryVideo = {
  id: string; // Using the filename as ID
  src: string;
  thumbnailSrc: string;
  title: string;
  description?: string;
  autoThumbnail?: boolean; // Flag to indicate if thumbnail was auto-generated
};

// Fetch videos from the API endpoint
export async function fetchVideos(): Promise<GalleryVideo[]> {
  try {
    const response = await fetch('/api/videos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.status}`);
    }
    
    const data = await response.json();
    return data.videos || [];
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
} 