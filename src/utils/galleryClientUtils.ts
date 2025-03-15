// Define the image type used in the Gallery component
export type GalleryImage = {
  id: string; // Using the filename as ID
  src: string;
  alt: string;
  placeholderPosition?: number; // The position in the gallery (1-8)
  isArchived?: boolean; // Whether the image is archived
};

// Define placeholders (8 total slots for gallery)
export const GALLERY_PLACEHOLDERS = [
  'gallery_image_1.jpg',
  'gallery_image_2.jpg',
  'gallery_image_3.jpg',
  'gallery_image_4.jpg',
  'gallery_image_5.jpg',
  'gallery_image_6.jpg',
  'gallery_image_7.jpg',
  'gallery_image_8.jpg',
];

// Client-side function to get gallery images
export async function fetchGalleryImages(includeArchived: boolean = false): Promise<{
  images: GalleryImage[],
  archivedImages?: GalleryImage[],
  totalActive: number,
  totalArchived?: number,
  maxGallerySize: number
}> {
  try {
    const response = await fetch(`/api/gallery${includeArchived ? '?includeArchived=true' : ''}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch gallery images: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return {
      images: [],
      totalActive: 0,
      maxGallerySize: 8
    };
  }
}

// Client-side function to archive an image
export async function archiveImage(position: number): Promise<{ success: boolean, message: string }> {
  try {
    const response = await fetch('/api/gallery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'archive',
        position
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to archive image');
    }
    
    return {
      success: true,
      message: result.message || 'Image archived successfully'
    };
  } catch (error) {
    console.error('Error archiving image:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to archive image'
    };
  }
}

// Client-side function to restore an archived image
export async function restoreImage(
  archivedFile: string, 
  placeholderPosition: number
): Promise<{ success: boolean, message: string }> {
  try {
    const response = await fetch('/api/gallery/restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        archivedFile,
        placeholderPosition
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to restore image');
    }
    
    return {
      success: true,
      message: result.message || 'Image restored successfully'
    };
  } catch (error) {
    console.error('Error restoring image:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to restore image'
    };
  }
}

// Client-side function to delete an archived image permanently
export async function deleteArchivedImage(
  archivedFileName: string
): Promise<{ success: boolean, message: string }> {
  try {
    const encodedFilename = encodeURIComponent(archivedFileName);
    const response = await fetch(`/api/gallery?filename=${encodedFilename}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete archived image');
    }
    
    return {
      success: true,
      message: result.message || 'Archived image deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting archived image:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete archived image'
    };
  }
}

// Find an available position (1-8) from a list of used positions
export function findAvailablePosition(usedPositions: number[]): number | null {
  for (let i = 1; i <= 8; i++) {
    if (!usedPositions.includes(i)) {
      return i;
    }
  }
  return null;
}

// Client-side function to finalize the gallery (update the public website)
export async function finalizeGallery(): Promise<{ success: boolean, message: string, imageCount?: number }> {
  try {
    const response = await fetch('/api/gallery/finalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to finalize gallery');
    }
    
    return {
      success: true,
      message: result.message || 'Gallery finalized successfully',
      imageCount: result.imageCount
    };
  } catch (error) {
    console.error('Error finalizing gallery:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to finalize gallery'
    };
  }
}

// Helper function to get alt text from a filename
export function getAltTextFromFilename(filename: string): string {
  // Remove file extension
  const nameWithoutExtension = filename.replace(/\.[^/.]+$/, "");
  
  // Replace underscores with spaces and make it more readable
  let altText = nameWithoutExtension.replace(/_/g, ' ');
  
  // For our specific file naming convention, make it more readable
  altText = altText.replace('Flux Dev A', 'MC OJ');
  
  return altText;
} 