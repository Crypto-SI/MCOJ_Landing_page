import { createClient } from '@supabase/supabase-js';

// Hardcode the credentials for this script only
const supabaseUrl = 'https://your-project-reference.supabase.co';
const supabaseServiceRoleKey = 'your-service-role-key-from-supabase-dashboard';

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createTables() {
  console.log('Creating database tables...');
  
  try {
    // Test if we can connect to Supabase
    console.log('Testing Supabase connection...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error connecting to Supabase:', bucketsError);
      return;
    }
    
    console.log(`Successfully connected to Supabase. Found ${buckets.length} storage buckets.`);
    
    // Test if the videos table exists by trying to select from it
    console.log('Checking if videos table exists...');
    const { error: selectError } = await supabase
      .from('videos')
      .select('id')
      .limit(1);
    
    if (selectError) {
      console.log('Videos table does not exist or cannot be accessed:', selectError.message);
      
      // Try to create the table using a direct API call
      console.log('Attempting to create videos table via REST API...');
      
      try {
        // We'll use a test record to see if we can create the table
        console.log('Testing if we can insert a record (this will create the table if it doesn\'t exist)...');
        const testId = 'test-' + Date.now();
        const { error: insertError } = await supabase
          .from('videos')
          .insert({
            id: testId,
            title: 'Test Video',
            description: 'This is a test video',
            src: 'https://example.com/test.mp4',
            thumbnailSrc: 'https://example.com/test.jpg',
            order_index: 0,
            is_archived: false
          });
        
        if (insertError) {
          console.error('Error creating videos table via insert:', insertError);
          console.log('You may need to create the table manually in the Supabase dashboard.');
          console.log('Go to https://supabase.com/dashboard, select your project, then SQL Editor, and run:');
          console.log(`
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  src TEXT NOT NULL,
  thumbnailSrc TEXT NOT NULL,
  order_index INTEGER,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
          `);
        } else {
          console.log('Videos table created successfully via insert!');
          
          // Delete the test record
          const { error: deleteError } = await supabase
            .from('videos')
            .delete()
            .eq('id', testId);
          
          if (deleteError) {
            console.error('Error deleting test record:', deleteError);
          } else {
            console.log('Test record deleted successfully');
          }
        }
      } catch (createError) {
        console.error('Error creating videos table:', createError);
      }
    } else {
      console.log('Videos table exists!');
      
      // Check if is_archived column exists
      console.log('Checking if is_archived column exists...');
      const { data, error: archiveError } = await supabase
        .from('videos')
        .select('is_archived')
        .limit(1);
      
      if (archiveError) {
        console.error('Error checking is_archived column:', archiveError);
        console.log('You may need to add the is_archived column manually in the Supabase dashboard.');
        console.log('Go to https://supabase.com/dashboard, select your project, then SQL Editor, and run:');
        console.log('ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;');
      } else {
        console.log('is_archived column exists!');
      }
    }
    
    console.log('Database setup completed!');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

createTables(); 