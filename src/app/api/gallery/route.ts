import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getGalleryImages, getArchivedImages, archiveImage } from '@/utils/galleryUtils';

// Path to public images folder
const imagesDirectory = path.join(process.cwd(), 'public/images');

// GET handler to fetch all gallery images
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    
    console.log('GET request for gallery images, includeArchived:', includeArchived);
    
    // Get active gallery images
    const activeImages = getGalleryImages();
    
    // If archived images are requested, include them
    if (includeArchived) {
      const archivedImages = getArchivedImages();
      return NextResponse.json({ 
        images: activeImages,
        archivedImages,
        totalActive: activeImages.length,
        totalArchived: archivedImages.length,
        maxGallerySize: 8
      });
    }
    
    // Otherwise just return active images
    return NextResponse.json({ 
      images: activeImages,
      totalActive: activeImages.length,
      maxGallerySize: 8
    });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery images' },
      { status: 500 }
    );
  }
}

// POST handler to archive an image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, position, archivedFile, placeholderPosition } = body;
    
    console.log('POST request for gallery action:', action, 'position:', position, 'archivedFile:', archivedFile);
    
    if (action === 'archive' && typeof position === 'number') {
      // Archive an image at the specified position
      const success = archiveImage(position);
      
      if (success) {
        return NextResponse.json({ 
          success: true,
          message: `Image at position ${position} archived successfully`
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to archive image' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error performing gallery action:', error);
    return NextResponse.json(
      { error: `Failed to perform gallery action: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// DELETE handler is now used to permanently delete an archived image
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    console.log('Delete request received for file:', filename);

    if (!filename) {
      console.log('No filename provided in delete request');
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Ensure the filename is sanitized and only contains expected characters
    if (!/^[a-zA-Z0-9_.-]+\.(jpg|jpeg|png)$/.test(filename)) {
      console.log('Invalid filename format:', filename);
      return NextResponse.json(
        { error: 'Invalid filename format' },
        { status: 400 }
      );
    }
    
    // Check if this is a request to delete an archived image
    const archivePath = path.join(imagesDirectory, 'archive', filename);
    const isArchived = fs.existsSync(archivePath);
    
    if (isArchived) {
      // Delete from archive
      fs.unlinkSync(archivePath);
      console.log('File deleted from archive successfully');
      
      return NextResponse.json({ 
        success: true,
        message: 'Archived file deleted successfully',
        deletedFile: filename
      });
    } else {
      console.log('File not found in archive. Use archive action instead of delete for active images.');
      return NextResponse.json(
        { error: 'File not found in archive' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: `Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 