import { NextRequest, NextResponse } from 'next/server';
import { restoreImage } from '@/utils/galleryUtils';

// POST handler to restore an archived image to a placeholder position
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { archivedFile, placeholderPosition } = body;
    
    console.log('Restore request received for archived file:', archivedFile, 'to position:', placeholderPosition);
    
    if (!archivedFile || !placeholderPosition) {
      console.log('Missing parameters in restore request');
      return NextResponse.json(
        { error: 'Both archivedFile and placeholderPosition are required' },
        { status: 400 }
      );
    }
    
    // Validate placeholder position
    if (typeof placeholderPosition !== 'number' || placeholderPosition < 1 || placeholderPosition > 8) {
      console.log('Invalid placeholder position:', placeholderPosition);
      return NextResponse.json(
        { error: 'Invalid placeholder position. Must be a number between 1 and 8.' },
        { status: 400 }
      );
    }
    
    // Validate archived file name
    if (typeof archivedFile !== 'string' || !/^[a-zA-Z0-9_.-]+\.(jpg|jpeg|png)$/.test(archivedFile)) {
      console.log('Invalid archived file name:', archivedFile);
      return NextResponse.json(
        { error: 'Invalid archived file name format' },
        { status: 400 }
      );
    }
    
    // Restore the image
    const success = restoreImage(archivedFile, placeholderPosition);
    
    if (success) {
      return NextResponse.json({ 
        success: true,
        message: `Archived image restored to position ${placeholderPosition} successfully`
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to restore image. The file may not exist or the position is already taken.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error restoring archived image:', error);
    return NextResponse.json(
      { error: `Failed to restore image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 