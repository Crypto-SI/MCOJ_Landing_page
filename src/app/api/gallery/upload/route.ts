import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { getNextAvailablePlaceholder, GALLERY_PLACEHOLDERS } from '@/utils/galleryUtils';

// Path to public images folder
const imagesDirectory = path.join(process.cwd(), 'public/images');
console.log('Images directory path:', imagesDirectory);

// Verify directory exists and is writable
try {
  if (!fs.existsSync(imagesDirectory)) {
    console.log('Images directory does not exist, attempting to create it...');
    fs.mkdirSync(imagesDirectory, { recursive: true });
    console.log('Images directory created');
  }
  
  // Test write permissions
  const testFile = path.join(imagesDirectory, '.test-write-permissions');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('Images directory is writable');
} catch (error) {
  console.error('Error with images directory:', error);
}

// Ideal dimensions for gallery images
const IDEAL_WIDTH = 1200;
const IDEAL_HEIGHT = 800;

export async function POST(request: NextRequest) {
  console.log('Upload request received');
  
  try {
    const formData = await request.formData();
    console.log('Form data received');
    
    // Check if a specific position was requested
    const positionValue = formData.get('position');
    let position = null;
    
    if (positionValue) {
      position = parseInt(positionValue.toString(), 10);
      if (isNaN(position) || position < 1 || position > 8) {
        return NextResponse.json(
          { error: 'Invalid position. Must be a number between 1 and 8.' },
          { status: 400 }
        );
      }
      console.log('Requested position:', position);
    } else {
      // If no position specified, find the next available one
      position = getNextAvailablePlaceholder();
      console.log('Auto-assigned position:', position);
      
      if (position === null) {
        return NextResponse.json(
          { error: 'Gallery is full. Please archive an existing image first.' },
          { status: 400 }
        );
      }
    }
    
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('No file found in request');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      console.log('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG and PNG are supported.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.log('File too large:', file.size);
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit.' },
        { status: 400 }
      );
    }

    // Use the placeholder filename for the position
    const placeholder = GALLERY_PLACEHOLDERS[position - 1];
    const filePath = path.join(imagesDirectory, placeholder);
    
    console.log('Will save file to placeholder:', placeholder);

    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('File read into buffer, size:', buffer.length);
    
    // Process the image with sharp
    try {
      console.log('Processing image with Sharp...');
      
      // Get image metadata
      const metadata = await sharp(buffer).metadata();
      console.log('Image metadata:', metadata.width, 'x', metadata.height, 'format:', metadata.format);
      
      // Resize the image while preserving aspect ratio
      console.log('Resizing image...');
      const resizedImageBuffer = await sharp(buffer)
        .resize({
          width: IDEAL_WIDTH,
          height: IDEAL_HEIGHT,
          fit: 'inside', // Preserve aspect ratio
          withoutEnlargement: false, // Allow small images to be enlarged
        })
        .toBuffer();
      
      console.log('Image resized, new size:', resizedImageBuffer.length);
      
      // Save the processed image
      console.log('Saving processed image to', filePath);
      fs.writeFileSync(filePath, resizedImageBuffer);
      console.log('Image saved successfully to placeholder position', position);
      
      // Return the image details
      return NextResponse.json({
        success: true,
        message: 'Image uploaded and assigned to gallery position ' + position,
        image: {
          id: placeholder,
          src: `/images/${placeholder}`,
          alt: `Gallery image ${position}`,
          placeholderPosition: position
        }
      });
    } catch (resizeError) {
      console.error('Error resizing image:', resizeError);
      
      // If resize fails, save the original as a fallback
      console.log('Saving original image as fallback');
      fs.writeFileSync(filePath, buffer);
      console.log('Original image saved to placeholder position', position);
      
      return NextResponse.json({
        success: true,
        warning: 'Image could not be processed for resizing, original was saved instead',
        image: {
          id: placeholder,
          src: `/images/${placeholder}`,
          alt: `Gallery image ${position}`,
          placeholderPosition: position
        }
      });
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 