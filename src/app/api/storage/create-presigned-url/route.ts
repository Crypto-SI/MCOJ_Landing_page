import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabaseAdmin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Get the file details and bucket information from the request
    const { filename, contentType, bucket, path = '' } = await request.json();
    
    if (!filename || !contentType || !bucket) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, contentType, and bucket are required' },
        { status: 400 }
      );
    }
    
    // Validate supported buckets
    const allowedBuckets = ['videos', 'thumbnails', 'gallery', 'archives'];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json(
        { error: `Invalid bucket. Must be one of: ${allowedBuckets.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Generate a unique filename to prevent overwrites
    const fileExtension = filename.split('.').pop();
    const uniqueFilename = path 
      ? `${path}/${uuidv4()}.${fileExtension}`
      : `${uuidv4()}.${fileExtension}`;
    
    // Set an expiration time for the URL (e.g., 60 seconds)
    const expiresIn = 60;
    
    // Create a presigned URL for uploading
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(uniqueFilename);
    
    if (error) {
      console.error('Error creating presigned URL:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Return the presigned URL and file path information
    return NextResponse.json({
      success: true,
      uploadUrl: data.signedUrl,
      filePath: uniqueFilename,
      fileUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${uniqueFilename}`,
      expiresIn
    });
    
  } catch (error) {
    console.error('Error creating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to create presigned URL' },
      { status: 500 }
    );
  }
} 