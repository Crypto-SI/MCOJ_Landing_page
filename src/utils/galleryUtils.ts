import fs from 'fs';
import path from 'path';

// Define the image type to match what's in the Gallery component
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

// Directory paths
const publicDir = path.join(process.cwd(), 'public');
const imagesDirectory = path.join(publicDir, 'images');
const archiveDirectory = path.join(publicDir, 'images/archive');

console.log('Gallery Utils - Images directory path:', imagesDirectory);
console.log('Gallery Utils - Archive directory path:', archiveDirectory);

// Create directories if they don't exist
const ensureDirectories = () => {
  try {
    if (!fs.existsSync(imagesDirectory)) {
      console.log('Gallery Utils - Images directory does not exist, creating it');
      fs.mkdirSync(imagesDirectory, { recursive: true });
    }
    
    if (!fs.existsSync(archiveDirectory)) {
      console.log('Gallery Utils - Archive directory does not exist, creating it');
      fs.mkdirSync(archiveDirectory, { recursive: true });
    }
  } catch (error) {
    console.error('Gallery Utils - Error creating directories:', error);
  }
};

// Function to get all gallery images (active ones in the main gallery)
export function getGalleryImages(): GalleryImage[] {
  try {
    console.log('Gallery Utils - Reading main gallery directory');
    ensureDirectories();
    
    // Create placeholder array with empty images
    const placeholderImages: (GalleryImage | null)[] = Array(8).fill(null);
    
    // Read both directories
    const mainFiles = fs.readdirSync(imagesDirectory).filter(f => 
      !f.startsWith('.') && !fs.statSync(path.join(imagesDirectory, f)).isDirectory()
    );
    
    console.log('Gallery Utils - Found files in main directory:', mainFiles.length);
    
    // Find the real images that have been assigned to placeholders
    GALLERY_PLACEHOLDERS.forEach((placeholder, index) => {
      const placeholderPath = path.join(imagesDirectory, placeholder);
      
      if (fs.existsSync(placeholderPath)) {
        // Placeholder exists, it's a symlink or real file
        placeholderImages[index] = {
          id: placeholder,
          src: `/images/${placeholder}`,
          alt: `Gallery image ${index + 1}`,
          placeholderPosition: index + 1
        };
      }
    });
    
    // Filter out null values from placeholder array
    const images = placeholderImages.filter(img => img !== null) as GalleryImage[];
    
    console.log('Gallery Utils - Returning gallery images:', images.length);
    return images;
  } catch (error) {
    console.error('Gallery Utils - Error getting gallery images:', error);
    return [];
  }
}

// Function to get all archived images
export function getArchivedImages(): GalleryImage[] {
  try {
    console.log('Gallery Utils - Reading archive directory');
    ensureDirectories();
    
    const files = fs.readdirSync(archiveDirectory);
    console.log('Gallery Utils - Found files in archive directory:', files.length);
    
    // Filter for valid image files
    const imageFiles = files.filter(filename => 
      (filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.png'))
    );
    
    console.log('Gallery Utils - Filtered archived image files:', imageFiles.length);
    
    // Map filenames to GalleryImage objects
    const images: GalleryImage[] = imageFiles.map(filename => {
      return {
        id: filename,
        src: `/images/archive/${filename}`,
        alt: getAltTextFromFilename(filename),
        isArchived: true
      };
    });
    
    return images;
  } catch (error) {
    console.error('Gallery Utils - Error getting archived images:', error);
    return [];
  }
}

// Find the next available placeholder position (1-8)
export function getNextAvailablePlaceholder(): number | null {
  try {
    ensureDirectories();
    
    for (let i = 0; i < GALLERY_PLACEHOLDERS.length; i++) {
      const placeholderPath = path.join(imagesDirectory, GALLERY_PLACEHOLDERS[i]);
      if (!fs.existsSync(placeholderPath)) {
        return i + 1; // Return 1-based position
      }
    }
    
    return null; // No available positions
  } catch (error) {
    console.error('Gallery Utils - Error finding available placeholder:', error);
    return null;
  }
}

// Archive an image (move it from gallery to archive)
export function archiveImage(placeholderPosition: number): boolean {
  try {
    if (placeholderPosition < 1 || placeholderPosition > 8) {
      console.error('Gallery Utils - Invalid placeholder position:', placeholderPosition);
      return false;
    }
    
    const placeholder = GALLERY_PLACEHOLDERS[placeholderPosition - 1];
    const sourcePath = path.join(imagesDirectory, placeholder);
    
    if (!fs.existsSync(sourcePath)) {
      console.error('Gallery Utils - Placeholder does not exist:', placeholder);
      return false;
    }
    
    // Create a unique name for the archived file
    const timestamp = new Date().getTime();
    const fileExt = path.extname(sourcePath);
    const archivedFileName = `archived_${timestamp}${fileExt}`;
    const destPath = path.join(archiveDirectory, archivedFileName);
    
    // Copy the file to archive
    fs.copyFileSync(sourcePath, destPath);
    console.log('Gallery Utils - Copied image to archive:', archivedFileName);
    
    // Delete the placeholder file
    fs.unlinkSync(sourcePath);
    console.log('Gallery Utils - Deleted placeholder image:', placeholder);
    
    return true;
  } catch (error) {
    console.error('Gallery Utils - Error archiving image:', error);
    return false;
  }
}

// Restore an image from archive to gallery
export function restoreImage(archivedFileName: string, placeholderPosition: number): boolean {
  try {
    if (placeholderPosition < 1 || placeholderPosition > 8) {
      console.error('Gallery Utils - Invalid placeholder position:', placeholderPosition);
      return false;
    }
    
    const placeholder = GALLERY_PLACEHOLDERS[placeholderPosition - 1];
    const placeholderPath = path.join(imagesDirectory, placeholder);
    const archivePath = path.join(archiveDirectory, archivedFileName);
    
    if (!fs.existsSync(archivePath)) {
      console.error('Gallery Utils - Archived file does not exist:', archivedFileName);
      return false;
    }
    
    // Check if the placeholder is already in use
    if (fs.existsSync(placeholderPath)) {
      console.error('Gallery Utils - Placeholder already in use:', placeholder);
      return false;
    }
    
    // Copy the file from archive to the placeholder
    fs.copyFileSync(archivePath, placeholderPath);
    console.log('Gallery Utils - Restored image to placeholder:', placeholder);
    
    // Delete the archived file
    fs.unlinkSync(archivePath);
    console.log('Gallery Utils - Deleted archived image:', archivedFileName);
    
    return true;
  } catch (error) {
    console.error('Gallery Utils - Error restoring image:', error);
    return false;
  }
}

// Permanently delete an archived image
export function deleteArchivedImage(archivedFileName: string): boolean {
  try {
    const archivePath = path.join(archiveDirectory, archivedFileName);
    
    if (!fs.existsSync(archivePath)) {
      console.error('Gallery Utils - Archived file does not exist:', archivedFileName);
      return false;
    }
    
    // Delete the file
    fs.unlinkSync(archivePath);
    console.log('Gallery Utils - Permanently deleted archived image:', archivedFileName);
    
    return true;
  } catch (error) {
    console.error('Gallery Utils - Error deleting archived image:', error);
    return false;
  }
}

// Function to get alt text from a filename
function getAltTextFromFilename(filename: string): string {
  // Remove file extension
  const nameWithoutExtension = filename.replace(/\.[^/.]+$/, "");
  
  // Replace underscores with spaces and make it more readable
  let altText = nameWithoutExtension.replace(/_/g, ' ');
  
  // For our specific file naming convention, make it more readable
  altText = altText.replace('Flux Dev A', 'MC OJ');
  
  return altText;
} 