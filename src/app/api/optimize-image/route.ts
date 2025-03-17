import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import supabaseAdmin from '@/utils/supabaseAdmin';
import { v4 as uuidv4 } from 'uuid';

// TinyPNG API key
const TINYPNG_API_KEY = process.env.TINYPNG_API_KEY || '';

/**
 * Optimize an image using TinyPNG API
 * @param buffer The image buffer to optimize
 * @returns Promise with the optimized image buffer
 */
async function optimizeImageWithTinyPNG(buffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Authorization header with API key
    const authorization = `Basic ${Buffer.from(`api:${TINYPNG_API_KEY}`).toString('base64')}`;
    
    // Request options for TinyPNG API
    const options = {
      method: 'POST',
      hostname: 'api.tinify.com',
      path: '/shrink',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/octet-stream',
      },
    };
    
    // Make request to TinyPNG API
    const req = https.request(options, (res) => {
      if (res.statusCode === 201 || res.statusCode === 200) {
        // Successful response, get the URL to the optimized image
        const location = res.headers.location as string;
        
        // Make a second request to get the optimized image data
        https.get(location, (optimizedRes) => {
          const chunks: Buffer[] = [];
          
          optimizedRes.on('data', (chunk) => {
            chunks.push(chunk);
          });
          
          optimizedRes.on('end', () => {
            const optimizedBuffer = Buffer.concat(chunks);
            resolve(optimizedBuffer);
          });
        });
      } else {
        // Error response
        let message = '';
        res.on('data', (chunk) => {
          message += chunk;
        });
        
        res.on('end', () => {
          reject(new Error(`TinyPNG optimization failed: ${message}`));
        });
      }
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    // Send the image data
    req.write(buffer);
    req.end();
  });
}

// POST /api/optimize-image - Optimize and upload an image
export async function POST(request: NextRequest) {
  try {
    // Check if supabaseAdmin is initialized
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // Parse the FormData
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const destination = formData.get('destination') as string || 'gallery'; // Default to gallery bucket
    const filename = formData.get('filename') as string || '';
    
    // Validate required fields
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    
    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json({ 
        error: 'Invalid image format. Only JPEG, PNG, and WebP are supported.' 
      }, { status: 400 });
    }
    
    // Convert image to buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Optimize the image
    console.log('Optimizing image with TinyPNG...');
    let optimizedBuffer: Buffer;
    try {
      optimizedBuffer = await optimizeImageWithTinyPNG(imageBuffer);
      console.log(`Image optimized. Original size: ${imageBuffer.length} bytes, Optimized size: ${optimizedBuffer.length} bytes`);
    } catch (err) {
      console.error('Image optimization failed:', err);
      // Continue with the original image if optimization fails
      optimizedBuffer = imageBuffer;
    }
    
    // Generate a unique ID for the file if no filename is specified
    const fileId = uuidv4();
    let outputFilename = filename || `optimized_${fileId}.${imageFile.name.split('.').pop()}`;
    
    // Ensure uniqueness by adding a timestamp to the filename
    const timestamp = Date.now();
    const filenameParts = outputFilename.split('.');
    const extension = filenameParts.pop();
    outputFilename = `${filenameParts.join('.')}_${timestamp}.${extension}`;
    
    // Upload the optimized image to Supabase Storage
    try {
      const { data, error } = await supabaseAdmin
        .storage
        .from(destination)
        .upload(outputFilename, optimizedBuffer, {
          contentType: imageFile.type,
          upsert: true // Overwrite if exists
        });
      
      if (error) {
        console.error('Error uploading optimized image:', error);
        return NextResponse.json({ error: `Failed to upload image: ${error.message}` }, { status: 500 });
      }
      
      // Get the public URL for the uploaded image
      const { data: urlData } = supabaseAdmin
        .storage
        .from(destination)
        .getPublicUrl(outputFilename);
      
      return NextResponse.json({
        success: true,
        filename: outputFilename,
        src: urlData.publicUrl,
        originalSize: imageBuffer.length,
        optimizedSize: optimizedBuffer.length,
        compressionRate: Math.round((1 - optimizedBuffer.length / imageBuffer.length) * 100)
      });
    } catch (uploadError) {
      console.error('Error during upload:', uploadError);
      return NextResponse.json({ error: 'Error uploading to storage service' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error optimizing and uploading image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 