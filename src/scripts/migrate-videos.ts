import fs from 'fs';
import path from 'path';
import supabaseAdmin from '../utils/supabaseAdmin';

// Path to the JSON file containing videos data
const DATA_DIR = path.join(process.cwd(), 'public/data');
const VIDEOS_FILE_PATH = path.join(DATA_DIR, 'videos.json');
const VIDEOS_DIR = path.join(process.cwd(), 'public/videos');
const THUMBNAILS_DIR = path.join(process.cwd(), 'public/videos/thumbnails');

async function migrateVideos() {
  console.log('Starting videos migration...');
  
  try {
    // Ensure the data file exists
    if (!fs.existsSync(VIDEOS_FILE_PATH)) {
      console.error('Videos data file does not exist:', VIDEOS_FILE_PATH);
      return;
    }
    
    // Read existing videos from JSON file
    const videosData = JSON.parse(fs.readFileSync(VIDEOS_FILE_PATH, 'utf8'));
    console.log(`Found ${videosData.length} videos to migrate`);
    
    // Process each video
    for (const [index, video] of videosData.entries()) {
      console.log(`Processing video ${index + 1}/${videosData.length}: ${video.title}`);
      
      try {
        // Extract file names from paths
        const videoFileName = path.basename(video.src);
        const thumbnailFileName = path.basename(video.thumbnailSrc);
        
        // Check if files exist
        const videoPath = path.join(VIDEOS_DIR, videoFileName);
        const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFileName);
        
        if (!fs.existsSync(videoPath)) {
          console.error(`Video file does not exist: ${videoPath}`);
          continue;
        }
        
        if (!fs.existsSync(thumbnailPath)) {
          console.error(`Thumbnail file does not exist: ${thumbnailPath}`);
          continue;
        }
        
        // 1. Upload video file to Supabase Storage
        const videoFile = fs.readFileSync(videoPath);
        const { data: videoData, error: videoError } = await supabaseAdmin
          .storage
          .from('videos')
          .upload(videoFileName, videoFile, {
            contentType: 'video/mp4',
            upsert: true
          });
        
        if (videoError) {
          console.error(`Error uploading video ${videoFileName}:`, videoError);
          continue;
        }
        
        // Get the public URL for the video
        const { data: videoUrlData } = supabaseAdmin
          .storage
          .from('videos')
          .getPublicUrl(videoFileName);
        
        const videoUrl = videoUrlData.publicUrl;
        
        // 2. Upload thumbnail file to Supabase Storage
        const thumbnailFile = fs.readFileSync(thumbnailPath);
        const { data: thumbnailData, error: thumbnailError } = await supabaseAdmin
          .storage
          .from('thumbnails')
          .upload(thumbnailFileName, thumbnailFile, {
            contentType: 'image/jpeg',
            upsert: true
          });
        
        if (thumbnailError) {
          console.error(`Error uploading thumbnail ${thumbnailFileName}:`, thumbnailError);
          continue;
        }
        
        // Get the public URL for the thumbnail
        const { data: thumbnailUrlData } = supabaseAdmin
          .storage
          .from('thumbnails')
          .getPublicUrl(thumbnailFileName);
        
        const thumbnailUrl = thumbnailUrlData.publicUrl;
        
        // 3. Insert video record into database
        const { data, error } = await supabaseAdmin
          .from('videos')
          .insert([{
            id: video.id,
            title: video.title,
            description: video.description || null,
            src: videoUrl,
            thumbnailSrc: thumbnailUrl,
            order_index: index
          }]);
        
        if (error) {
          console.error(`Error inserting video record for ${video.title}:`, error);
        } else {
          console.log(`✓ Migrated video: ${video.title}`);
        }
      } catch (error) {
        console.error(`Error processing video ${video.title}:`, error);
      }
    }
    
    console.log('Videos migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Execute the migration
migrateVideos().catch(console.error); 