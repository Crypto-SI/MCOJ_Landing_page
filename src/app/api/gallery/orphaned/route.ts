import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabaseAdmin';
import { GALLERY_PLACEHOLDERS } from '@/utils/galleryUtils';

export async function GET() {
  try {
    // Ensure supabaseAdmin is initialized
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client is not initialized');
    }
    
    // List all files in the gallery bucket
    const { data: galleryFiles, error: galleryError } = await supabaseAdmin
      .storage
      .from('gallery')
      .list();

    if (galleryError) {
      console.error('Error listing gallery files:', galleryError);
      return NextResponse.json(
        { error: 'Failed to list gallery files' },
        { status: 500 }
      );
    }

    // Get all files in the archive bucket
    const { data: archivedFiles, error: archiveError } = await supabaseAdmin
      .storage
      .from('gallery')
      .list('archive');

    if (archiveError) {
      console.error('Error listing archived files:', archiveError);
      return NextResponse.json(
        { error: 'Failed to list archived files' },
        { status: 500 }
      );
    }

    // Find orphaned files (files that aren't placeholders)
    const orphanedFiles = galleryFiles
      .filter(file => !GALLERY_PLACEHOLDERS.includes(file.name))
      .map(file => ({
        name: file.name,
        size: file.metadata?.size || 0,
        path: `gallery/${file.name}`
      }));

    const archivedFilesWithSize = (archivedFiles || [])
      .map(file => ({
        name: file.name,
        size: file.metadata?.size || 0,
        path: `gallery/archive/${file.name}`
      }));

    return NextResponse.json({
      orphanedFiles,
      archivedFiles: archivedFilesWithSize,
      totalOrphaned: orphanedFiles.length,
      totalArchived: archivedFilesWithSize.length
    });
  } catch (error) {
    console.error('Error checking for orphaned files:', error);
    return NextResponse.json(
      { error: 'Failed to check for orphaned files' },
      { status: 500 }
    );
  }
}

// POST handler to clean up orphaned files
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filesToDelete } = body;

    if (!Array.isArray(filesToDelete)) {
      return NextResponse.json(
        { error: 'filesToDelete must be an array' },
        { status: 400 }
      );
    }

    // Ensure supabaseAdmin is initialized
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client is not initialized');
    }

    const deletedFiles = [];
    const errors = [];

    for (const file of filesToDelete) {
      try {
        // Delete file from gallery bucket
        const { error: deleteError } = await supabaseAdmin
          .storage
          .from('gallery')
          .remove([file]);

        if (deleteError) {
          errors.push(`Error deleting ${file}: ${deleteError.message}`);
        } else {
          deletedFiles.push(file);
        }
      } catch (error) {
        errors.push(`Error deleting ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      deletedFiles,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error('Error cleaning up orphaned files:', error);
    return NextResponse.json(
      { error: 'Failed to clean up orphaned files' },
      { status: 500 }
    );
  }
} 