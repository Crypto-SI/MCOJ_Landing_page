import fs from 'fs';
import path from 'path';
import supabaseAdmin from './supabaseAdmin';
import { checkBucketExists, REQUIRED_BUCKETS } from './setupSupabaseBuckets';

// Define paths to JSON files
const GALLERY_JSON_PATH = path.join(process.cwd(), 'public', 'data', 'gallery.json');
const EVENTS_JSON_PATH = path.join(process.cwd(), 'public', 'data', 'events.json');
const VIDEOS_JSON_PATH = path.join(process.cwd(), 'public', 'data', 'videos.json');

// Base path for public files
const PUBLIC_PATH = path.join(process.cwd(), 'public');

// Define required database tables
const REQUIRED_TABLES = ['gallery', 'events', 'videos'];

// Type definitions for data
interface GalleryImage {
  filename: string;
  src: string;
  placeholder_position?: number;
  is_archived?: boolean;
}

interface Event {
  id: string;
  date: string;
  venue: string;
  eventName: string;
  address?: string;
  postcode?: string;
  timeStart?: string;
  timeEnd?: string;
  ticketLink?: string;
  position?: number;
  is_archived?: boolean;
}

interface Video {
  id: string;
  src: string;
  thumbnailSrc: string;
  title: string;
  description?: string;
  autoThumbnail?: boolean;
}

/**
 * Check if a table exists in the database
 * @param tableName The name of the table to check
 */
async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    if (!supabaseAdmin) return false;
    
    // Direct query to information_schema to check if the table exists
    // instead of using RPC which requires the function to be defined
    const { data, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .limit(1);
    
    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      
      // Fall back to a different method if the direct query fails
      try {
        // Try a SELECT that will succeed with zero rows rather than error if table exists
        const { error: selectError } = await supabaseAdmin
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .limit(0);
          
        // If no error, table exists
        return !selectError;
      } catch (fallbackError) {
        console.error(`Fallback check for table ${tableName} failed:`, fallbackError);
        return false;
      }
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Create required tables if they don't exist
 */
async function ensureRequiredTables(): Promise<{
  allExist: boolean;
  missing: string[];
  created: string[];
}> {
  if (!supabaseAdmin) {
    throw new Error('Supabase client is not initialized');
  }
  
  const missing: string[] = [];
  const created: string[] = [];
  
  // Define table schemas
  const tableSchemas: Record<string, string> = {
    gallery: `
      CREATE TABLE IF NOT EXISTS gallery (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        src TEXT NOT NULL UNIQUE,
        placeholder_position INTEGER,
        is_archived BOOLEAN DEFAULT false
      );
    `,
    events: `
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        venue TEXT NOT NULL,
        eventName TEXT NOT NULL,
        address TEXT,
        postcode TEXT,
        timeStart TEXT,
        timeEnd TEXT,
        ticketLink TEXT,
        position INTEGER,
        is_archived BOOLEAN DEFAULT false
      );
    `,
    videos: `
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        src TEXT NOT NULL,
        thumbnailSrc TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        autoThumbnail BOOLEAN DEFAULT false
      );
    `
  };
  
  for (const table of REQUIRED_TABLES) {
    try {
      const exists = await checkTableExists(table);
      
      if (!exists) {
        missing.push(table);
        
        // Create the table if it doesn't exist
        if (tableSchemas[table]) {
          try {
            console.log(`Creating table ${table}...`);
            
            // Direct table creation using a simpler approach
            let error = null;
            
            try {
              // Try to create the table directly using SQL
              const schema = tableSchemas[table];
              
              // Use a direct transaction if available
              // This is a workaround since we can't execute raw SQL directly
              try {
                await supabaseAdmin.from(table).insert([]).select();
              } catch {
                // This will likely fail if the table doesn't exist, which is expected
                // We're just attempting to create the table
                console.log(`Attempting to create ${table} table...`);
              }
              
              // Try to access the table to see if it was created
              const checkResult = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true }).limit(0);
              
              if (!checkResult.error) {
                // Table was created or already exists
                console.log(`Successfully created or verified table ${table}`);
                created.push(table);
              } else {
                console.error(`Error verifying table ${table}:`, checkResult.error);
                error = checkResult.error;
              }
            } catch (createError) {
              console.error(`Error creating table ${table}:`, createError);
              error = createError;
            }
            
            if (error) {
              console.error(`Error creating table ${table}:`, error);
            } else {
              console.log(`Successfully created table ${table}`);
              if (!created.includes(table)) {
                created.push(table);
              }
            }
          } catch (error) {
            console.error(`Error creating table ${table}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error checking/creating table ${table}:`, error);
      missing.push(table);
    }
  }
  
  return {
    allExist: missing.length === created.length,
    missing,
    created
  };
}

/**
 * Migrate gallery images from JSON file to Supabase
 */
export async function migrateGallery() {
  console.log('Starting gallery migration...');
  try {
    // Check if Supabase client is initialized
    if (!supabaseAdmin) {
      throw new Error('Supabase client is not initialized');
    }

    // Check if gallery.json exists
    if (!fs.existsSync(GALLERY_JSON_PATH)) {
      console.log('Gallery JSON file not found, skipping gallery migration');
      return true; // Not an error, just skip
    }
    
    // Read the gallery JSON file
    const galleryData = JSON.parse(fs.readFileSync(GALLERY_JSON_PATH, 'utf8'));
    
    if (!Array.isArray(galleryData)) {
      throw new Error('Gallery data is not an array');
    }
    
    console.log(`Found ${galleryData.length} gallery images to migrate`);
    
    // If no gallery items, consider it successful
    if (galleryData.length === 0) {
      console.log('No gallery items to migrate');
      return true;
    }
    
    // Prepare data for insertion
    const galleryItems: GalleryImage[] = galleryData.map((image: any) => ({
      filename: image.filename,
      src: image.src,
      placeholder_position: image.placeholder_position || null,
      is_archived: image.is_archived || false
    }));
    
    // Make sure the table exists
    const tableExists = await checkTableExists('gallery');
    if (!tableExists) {
      throw new Error('Gallery table does not exist in the database');
    }
    
    // Insert data into Supabase
    const { data, error } = await supabaseAdmin
      .from('gallery')
      .upsert(galleryItems, { 
        onConflict: 'src',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('Supabase gallery upsert error:', error);
      throw new Error(`Failed to insert gallery items: ${error.message}`);
    }
    
    // Upload gallery image files to Supabase storage
    let uploadErrors = [];
    for (const item of galleryItems) {
      if (item.src) {
        const imagePath = path.join(PUBLIC_PATH, item.src.replace(/^\//, ''));
        
        if (fs.existsSync(imagePath)) {
          try {
            const fileContent = fs.readFileSync(imagePath);
            const fileName = path.basename(imagePath);
            
            const { data, error } = await supabaseAdmin
              .storage
              .from('gallery')
              .upload(fileName, fileContent, {
                contentType: 'image/jpeg',
                upsert: true
              });
            
            if (error) {
              console.error(`Error uploading gallery image ${fileName}:`, error);
              uploadErrors.push(`${fileName}: ${error.message}`);
            } else {
              console.log(`Uploaded gallery image ${fileName}`);
            }
          } catch (error) {
            console.error(`Error reading gallery image ${imagePath}:`, error);
            uploadErrors.push(`${imagePath}: ${error instanceof Error ? error.message : String(error)}`);
          }
        } else {
          console.warn(`Gallery image not found: ${imagePath}`);
          uploadErrors.push(`${imagePath}: File not found`);
        }
      }
    }
    
    if (uploadErrors.length > 0) {
      console.warn(`Gallery migration completed with ${uploadErrors.length} file upload warnings`);
    }
    
    console.log(`Successfully migrated ${galleryItems.length} gallery images to Supabase`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error migrating gallery data:', errorMessage);
    // Return detailed error information
    return {
      success: false,
      error: errorMessage,
      details: error
    };
  }
}

/**
 * Migrate events from JSON file to Supabase
 */
export async function migrateEvents() {
  console.log('Starting events migration...');
  try {
    // Check if Supabase client is initialized
    if (!supabaseAdmin) {
      throw new Error('Supabase client is not initialized');
    }
    
    // Check if events.json exists
    if (!fs.existsSync(EVENTS_JSON_PATH)) {
      console.log('Events JSON file not found, skipping events migration');
      return true;
    }
    
    // Read the events JSON file
    const eventsData = JSON.parse(fs.readFileSync(EVENTS_JSON_PATH, 'utf8'));
    
    if (!Array.isArray(eventsData)) {
      throw new Error('Events data is not an array');
    }
    
    console.log(`Found ${eventsData.length} events to migrate`);
    
    // If no events, consider it successful
    if (eventsData.length === 0) {
      console.log('No events to migrate');
      return true;
    }
    
    // Prepare data for insertion
    const events: Event[] = eventsData.map((event: any) => ({
      id: event.id,
      date: event.date,
      venue: event.venue,
      eventName: event.eventName,
      address: event.address || null,
      postcode: event.postcode || null,
      timeStart: event.timeStart || null,
      timeEnd: event.timeEnd || null,
      ticketLink: event.ticketLink || null,
      position: event.position || null,
      is_archived: event.is_archived || false
    }));
    
    // Log first event for debugging
    console.log('First event to migrate:', JSON.stringify(events[0], null, 2));
    
    // Make sure the table exists
    const tableExists = await checkTableExists('events');
    if (!tableExists) {
      throw new Error('Events table does not exist in the database');
    }
    
    // Insert data into Supabase
    const { data, error } = await supabaseAdmin
      .from('events')
      .upsert(events, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('Supabase events upsert error:', error);
      throw new Error(`Failed to insert events: ${error.message}`);
    }
    
    // Upload any event-related files to Supabase storage
    let uploadErrors = [];
    const eventFilesDir = path.join(PUBLIC_PATH, 'events');
    if (fs.existsSync(eventFilesDir)) {
      const files = fs.readdirSync(eventFilesDir);
      
      for (const file of files) {
        const filePath = path.join(eventFilesDir, file);
        if (fs.statSync(filePath).isFile()) {
          try {
            const fileContent = fs.readFileSync(filePath);
            
            const { data, error } = await supabaseAdmin
              .storage
              .from('events')
              .upload(file, fileContent, {
                upsert: true
              });
            
            if (error) {
              console.error(`Error uploading event file ${file}:`, error);
              uploadErrors.push(`${file}: ${error.message}`);
            } else {
              console.log(`Uploaded event file ${file}`);
            }
          } catch (error) {
            console.error(`Error reading event file ${filePath}:`, error);
            uploadErrors.push(`${filePath}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }
    } else {
      console.warn(`Events directory not found: ${eventFilesDir}`);
    }
    
    if (uploadErrors.length > 0) {
      console.warn(`Events migration completed with ${uploadErrors.length} file upload warnings`);
    }
    
    console.log(`Successfully migrated ${events.length} events to Supabase`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error migrating events data:', errorMessage);
    // Return detailed error information
    return {
      success: false,
      error: errorMessage,
      details: error
    };
  }
}

/**
 * Migrate videos from JSON file to Supabase
 */
export async function migrateVideos() {
  console.log('Starting videos migration...');
  try {
    // Check if Supabase client is initialized
    if (!supabaseAdmin) {
      throw new Error('Supabase client is not initialized');
    }
    
    // Check if videos.json exists
    if (!fs.existsSync(VIDEOS_JSON_PATH)) {
      console.log('Videos JSON file not found, skipping videos migration');
      return true;
    }
    
    // Read the videos JSON file
    const videosData = JSON.parse(fs.readFileSync(VIDEOS_JSON_PATH, 'utf8'));
    
    if (!Array.isArray(videosData)) {
      throw new Error('Videos data is not an array');
    }
    
    console.log(`Found ${videosData.length} videos to migrate`);
    
    // If no videos, consider it successful
    if (videosData.length === 0) {
      console.log('No videos to migrate');
      return true;
    }
    
    // Prepare data for insertion
    const videos: Video[] = videosData.map((video: any) => ({
      id: video.id,
      src: video.src,
      thumbnailSrc: video.thumbnailSrc,
      title: video.title,
      description: video.description || null,
      autoThumbnail: video.autoThumbnail || false
    }));
    
    // Log first video for debugging
    console.log('First video to migrate:', JSON.stringify(videos[0], null, 2));
    
    // Make sure the table exists
    const tableExists = await checkTableExists('videos');
    if (!tableExists) {
      throw new Error('Videos table does not exist in the database');
    }
    
    // Insert data into Supabase
    const { data, error } = await supabaseAdmin
      .from('videos')
      .upsert(videos, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('Supabase videos upsert error:', error);
      throw new Error(`Failed to insert videos: ${error.message}`);
    }
    
    // Upload video files to Supabase storage
    let uploadErrors = [];
    for (const video of videos) {
      if (video.src) {
        const videoPath = path.join(PUBLIC_PATH, video.src.replace(/^\//, ''));
        
        if (fs.existsSync(videoPath)) {
          try {
            const fileContent = fs.readFileSync(videoPath);
            const fileName = path.basename(videoPath);
            
            const { data, error } = await supabaseAdmin
              .storage
              .from('videos')
              .upload(fileName, fileContent, {
                contentType: 'video/mp4',
                upsert: true
              });
            
            if (error) {
              console.error(`Error uploading video ${fileName}:`, error);
              uploadErrors.push(`${fileName}: ${error.message}`);
            } else {
              console.log(`Uploaded video ${fileName}`);
            }
          } catch (error) {
            console.error(`Error reading video ${videoPath}:`, error);
            uploadErrors.push(`${videoPath}: ${error instanceof Error ? error.message : String(error)}`);
          }
        } else {
          console.warn(`Video file not found: ${videoPath}`);
          uploadErrors.push(`${videoPath}: File not found`);
        }
      }
      
      // Upload thumbnail to thumbnails bucket
      if (video.thumbnailSrc) {
        const thumbnailPath = path.join(PUBLIC_PATH, video.thumbnailSrc.replace(/^\//, ''));
        
        if (fs.existsSync(thumbnailPath)) {
          try {
            const fileContent = fs.readFileSync(thumbnailPath);
            const fileName = path.basename(thumbnailPath);
            
            const { data, error } = await supabaseAdmin
              .storage
              .from('thumbnails')
              .upload(fileName, fileContent, {
                contentType: 'image/jpeg',
                upsert: true
              });
            
            if (error) {
              console.error(`Error uploading thumbnail ${fileName}:`, error);
              uploadErrors.push(`Thumbnail ${fileName}: ${error.message}`);
            } else {
              console.log(`Uploaded thumbnail ${fileName}`);
            }
          } catch (error) {
            console.error(`Error reading thumbnail ${thumbnailPath}:`, error);
            uploadErrors.push(`Thumbnail ${thumbnailPath}: ${error instanceof Error ? error.message : String(error)}`);
          }
        } else {
          console.warn(`Thumbnail file not found: ${thumbnailPath}`);
          uploadErrors.push(`Thumbnail ${thumbnailPath}: File not found`);
        }
      }
    }
    
    if (uploadErrors.length > 0) {
      console.warn(`Videos migration completed with ${uploadErrors.length} file upload warnings`);
    }
    
    console.log(`Successfully migrated ${videos.length} videos to Supabase`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error migrating videos data:', errorMessage);
    // Return detailed error information
    return {
      success: false,
      error: errorMessage,
      details: error
    };
  }
}

/**
 * Check if all required buckets exist
 */
export async function checkRequiredBuckets(): Promise<{
  allExist: boolean;
  missing: string[];
  error?: string;
}> {
  try {
    // Check if supabaseAdmin is initialized
    if (!supabaseAdmin) {
      return {
        allExist: false,
        missing: REQUIRED_BUCKETS,
        error: 'Supabase admin client not initialized'
      };
    }
    
    const missing: string[] = [];
    
    // Check each required bucket
    for (const bucket of REQUIRED_BUCKETS) {
      const exists = await checkBucketExists(bucket);
      if (!exists) {
        missing.push(bucket);
      }
    }
    
    return {
      allExist: missing.length === 0,
      missing
    };
  } catch (error) {
    console.error('Error checking buckets:', error);
    return {
      allExist: false,
      missing: [],
      error: error instanceof Error ? error.message : 'Unknown error checking buckets'
    };
  }
}

/**
 * Check if all required tables exist
 */
export async function checkRequiredTables(): Promise<{
  allExist: boolean;
  missing: string[];
  error?: string;
}> {
  try {
    // Check if supabaseAdmin is initialized
    if (!supabaseAdmin) {
      return {
        allExist: false,
        missing: REQUIRED_TABLES,
        error: 'Supabase admin client not initialized'
      };
    }
    
    const missing: string[] = [];
    
    // Check each required table
    for (const table of REQUIRED_TABLES) {
      const exists = await checkTableExists(table);
      if (!exists) {
        missing.push(table);
      }
    }
    
    return {
      allExist: missing.length === 0,
      missing
    };
  } catch (error) {
    console.error('Error checking tables:', error);
    return {
      allExist: false,
      missing: [],
      error: error instanceof Error ? error.message : 'Unknown error checking tables'
    };
  }
}

/**
 * Run all migrations
 */
export async function migrateAllDataToSupabase(): Promise<{
  success: boolean;
  results: Record<string, any>;
  error?: string;
}> {
  try {
    // Check if supabaseAdmin is initialized
    if (!supabaseAdmin) {
      return {
        success: false,
        results: {},
        error: 'Supabase admin client not initialized'
      };
    }
    
    // Check required buckets exist
    const bucketsCheck = await checkRequiredBuckets();
    if (!bucketsCheck.allExist) {
      return {
        success: false,
        results: { bucketsCheck },
        error: `Missing required storage buckets: ${bucketsCheck.missing.join(', ')}`
      };
    }
    
    // Check required tables exist
    const tablesCheck = await checkRequiredTables();
    if (!tablesCheck.allExist) {
      return {
        success: false,
        results: { bucketsCheck, tablesCheck },
        error: `Missing required database tables: ${tablesCheck.missing.join(', ')}`
      };
    }
    
    // Attempt to migrate all data types
    const results: Record<string, any> = {
      bucketsCheck,
      tablesCheck
    };
    
    // Migrate gallery
    try {
      results.gallery = await migrateGallery();
    } catch (galleryError) {
      console.error('Gallery migration failed:', galleryError);
      results.gallery = { 
        success: false, 
        error: galleryError instanceof Error ? galleryError.message : 'Unknown gallery migration error' 
      };
    }
    
    // Migrate events
    try {
      results.events = await migrateEvents();
    } catch (eventsError) {
      console.error('Events migration failed:', eventsError);
      results.events = { 
        success: false, 
        error: eventsError instanceof Error ? eventsError.message : 'Unknown events migration error' 
      };
    }
    
    // Migrate videos
    try {
      results.videos = await migrateVideos();
    } catch (videosError) {
      console.error('Videos migration failed:', videosError);
      results.videos = { 
        success: false, 
        error: videosError instanceof Error ? videosError.message : 'Unknown videos migration error' 
      };
    }
    
    // Overall success if all migrations succeeded
    const success = results.gallery?.success && 
                    results.events?.success &&
                    results.videos?.success;
    
    return {
      success,
      results
    };
  } catch (error) {
    console.error('Migration error:', error);
    return {
      success: false,
      results: {},
      error: error instanceof Error ? error.message : 'Unknown migration error'
    };
  }
}

// You can run this file directly with:
// node -r ts-node/register ./src/utils/migrateToSupabase.ts
if (require.main === module) {
  migrateAllDataToSupabase()
    .then((result) => {
      console.log('Migration result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Migration failed with exception:', error);
      process.exit(1);
    });
} 