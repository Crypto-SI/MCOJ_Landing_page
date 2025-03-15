import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getGalleryImages } from '@/utils/galleryUtils';

export async function POST() {
  console.log('POST request to finalize gallery');
  
  try {
    // 1. Get the current active gallery images
    const activeGalleryImages = getGalleryImages();
    console.log(`Found ${activeGalleryImages.length} active gallery images`);
    
    if (activeGalleryImages.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No images to finalize. Please add images to the gallery first.' 
      }, { status: 400 });
    }
    
    // 2. Get the path to update the Gallery component
    const galleryComponentPath = path.join(process.cwd(), 'src', 'components', 'Gallery.tsx');
    
    // 3. Read the current file
    const currentContent = fs.readFileSync(galleryComponentPath, 'utf-8');
    
    // 4. Generate new gallery images array for the component
    let newImagesArray = activeGalleryImages.map(image => {
      return `  {
    src: '${image.src}',
    alt: '${image.alt || `Gallery image ${image.placeholderPosition}`}'
  }`;
    }).join(',\n');
    
    // 5. Create updated content with new images array
    const updatedContent = currentContent.replace(
      /const galleryImages: GalleryImage\[\] = \[([\s\S]*?)\];/m,
      `const galleryImages: GalleryImage[] = [\n${newImagesArray}\n];`
    );
    
    // 6. Write the updated content back to the file
    fs.writeFileSync(galleryComponentPath, updatedContent, 'utf-8');
    
    console.log('Gallery component successfully updated');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Gallery finalized successfully! The website now displays your curated images.',
      imageCount: activeGalleryImages.length
    });
    
  } catch (error) {
    console.error('Error finalizing gallery:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to finalize gallery. Please try again.' 
    }, { status: 500 });
  }
} 