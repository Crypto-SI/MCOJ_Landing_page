import { migrateGallery, migrateEvents, migrateVideos, checkRequiredBuckets } from './migrateToSupabase';
import supabaseAdmin from './supabaseAdmin';
import path from 'path';
import fs from 'fs';

/**
 * Simple script to test Supabase connectivity and migration functions
 * Run with: npx ts-node -r tsconfig-paths/register src/utils/testMigration.ts
 */
async function runMigrationTests() {
  console.log('======= Migration Test Script =======');
  
  // Step 1: Check Supabase connection
  console.log('\n1. Testing Supabase connection...');
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase client is not initialized');
    }
    
    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables are not properly set');
    }
    
    console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    
    // Simple query to test connection
    const { data, error } = await supabaseAdmin.from('videos').select('count()', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }
    
    console.log('✅ Supabase connection successful!');
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    process.exit(1);
  }
  
  // Step 2: Check required data files
  console.log('\n2. Checking data files...');
  const dataFiles = ['gallery.json', 'events.json', 'videos.json'];
  const dataFolder = path.join(process.cwd(), 'public', 'data');
  
  dataFiles.forEach(file => {
    const filePath = path.join(dataFolder, file);
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} exists (${stats.size} bytes)`);
        
        // Check file structure
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(content);
          console.log(`   - JSON valid, contains ${Array.isArray(data) ? data.length : '?'} items`);
        } catch (parseError) {
          console.error(`❌ Error parsing ${file}:`, parseError);
        }
      } else {
        console.log(`❌ ${file} NOT FOUND`);
      }
    } catch (error) {
      console.error(`❌ Error checking ${file}:`, error);
    }
  });
  
  // Step 3: Check required buckets
  console.log('\n3. Checking required buckets...');
  try {
    const bucketsResult = await checkRequiredBuckets();
    console.log('Buckets status:', bucketsResult);
  } catch (error) {
    console.error('❌ Error checking buckets:', error);
  }
  
  // Step 4: Test each migration function separately
  console.log('\n4. Testing individual migration functions...');
  
  console.log('\n4.1 Testing Gallery Migration:');
  try {
    const galleryResult = await migrateGallery();
    console.log('Gallery migration result:', galleryResult);
  } catch (error) {
    console.error('❌ Gallery migration error:', error);
  }
  
  console.log('\n4.2 Testing Events Migration:');
  try {
    const eventsResult = await migrateEvents();
    console.log('Events migration result:', eventsResult);
  } catch (error) {
    console.error('❌ Events migration error:', error);
  }
  
  console.log('\n4.3 Testing Videos Migration:');
  try {
    const videosResult = await migrateVideos();
    console.log('Videos migration result:', videosResult);
  } catch (error) {
    console.error('❌ Videos migration error:', error);
  }
  
  console.log('\n======= Migration Test Complete =======');
}

// Run the test
runMigrationTests().catch(error => {
  console.error('Unhandled error in migration test:', error);
  process.exit(1);
}); 