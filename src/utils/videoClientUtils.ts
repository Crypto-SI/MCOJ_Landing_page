import supabase from './supabaseClient';

// Define the video type for the VideoGallery component
export interface GalleryVideo {
  id: string;
  title: string;
  description: string;
  src: string;
  thumbnailSrc: string;
  is_archived?: boolean;
  order_index?: number;
}

// Fetch videos from the API endpoint
export async function fetchVideos(includeArchived: boolean = false): Promise<GalleryVideo[]> {
  try {
    // Fetch videos from Supabase with archive filtering
    let query = supabase
      .from('videos')
      .select('*');
    
    // Only include non-archived videos by default
    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }
    
    const { data, error } = await query.order('order_index', { ascending: true });
    
    if (error) {
      console.error('Error fetching videos:', error);
      return [];
    }
    
    // Map database records to GalleryVideo interface
    return data.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description || '',
      src: video.src,
      thumbnailSrc: video.thumbnailSrc,
      is_archived: video.is_archived || false
    }));
  } catch (error) {
    console.error('Error in fetchVideos:', error);
    return [];
  }
}

// Fetch archived videos only
export async function fetchArchivedVideos(): Promise<GalleryVideo[]> {
  try {
    // Fetch archived videos from Supabase
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('is_archived', true)
      .order('order_index', { ascending: true });
    
    if (error) {
      console.error('Error fetching archived videos:', error);
      return [];
    }
    
    // Map database records to GalleryVideo interface
    return data.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description || '',
      src: video.src,
      thumbnailSrc: video.thumbnailSrc,
      is_archived: true
    }));
  } catch (error) {
    console.error('Error in fetchArchivedVideos:', error);
    return [];
  }
}

// Toggle the archive status of a video
export async function toggleVideoArchiveStatus(videoId: string, isArchived: boolean): Promise<boolean> {
  try {
    const { error } = await fetch(`/api/videos?id=${videoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_archived: isArchived }),
    }).then(res => res.json());
    
    if (error) {
      console.error('Error toggling video archive status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in toggleVideoArchiveStatus:', error);
    return false;
  }
} 