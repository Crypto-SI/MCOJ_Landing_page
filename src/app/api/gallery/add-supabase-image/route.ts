import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabaseAdmin';
import { v4 as uuidv4 } from 'uuid';

// Define a type for the gallery item
interface GalleryItem {
  id: string;
  filename: string;
  src: string;
  position: number;
  is_archived: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Check if supabaseAdmin is initialized
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    const body = await request.json();
    const { filename, src, position } = body;
    
    if (!src || !position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // First check if there's already an image at this position
    const { data: existingImage, error: checkError } = await supabaseAdmin
      .from('gallery')
      .select('*')
      .eq('position', position)
      .eq('is_archived', false)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is what we want
      console.error('Error checking for existing image:', checkError);
      return NextResponse.json({ error: 'Failed to check for existing image' }, { status: 500 });
    }
    
    // If there's an existing image at this position, archive it first
    if (existingImage) {
      // Use type assertion after checking existingImage is not null
      const imageToUpdate = existingImage as unknown as GalleryItem;
      
      const { error: archiveError } = await supabaseAdmin
        .from('gallery')
        .update({ is_archived: true })
        .eq('id', imageToUpdate.id);
      
      if (archiveError) {
        console.error('Error archiving existing image:', archiveError);
        return NextResponse.json({ error: 'Failed to archive existing image' }, { status: 500 });
      }
    }
    
    // Now insert the new image
    const { data: newImage, error: insertError } = await supabaseAdmin
      .from('gallery')
      .insert([{
        id: uuidv4(),
        filename: filename,
        src: src,
        position: position,
        is_archived: false
      }])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting new image:', insertError);
      return NextResponse.json({ error: 'Failed to insert new image' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Image added to gallery at position ${position}`,
      image: {
        id: newImage.id,
        src: newImage.src,
        placeholderPosition: newImage.position
      }
    });
  } catch (error: any) {
    console.error('Error adding Supabase image to gallery:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 