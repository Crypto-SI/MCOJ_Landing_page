import fs from 'fs';
import path from 'path';
import supabaseAdmin from '../utils/supabaseAdmin';

// Path to the JSON file containing events data
const DATA_DIR = path.join(process.cwd(), 'public/data');
const EVENTS_FILE_PATH = path.join(DATA_DIR, 'events.json');

async function migrateEvents() {
  console.log('Starting events migration...');
  
  try {
    // Check if supabaseAdmin is initialized
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return;
    }
    
    // Ensure the data file exists
    if (!fs.existsSync(EVENTS_FILE_PATH)) {
      console.error('Events data file does not exist:', EVENTS_FILE_PATH);
      return;
    }
    
    // Read existing events from JSON file
    const eventsData = JSON.parse(fs.readFileSync(EVENTS_FILE_PATH, 'utf8'));
    console.log(`Found ${eventsData.length} events to migrate`);
    
    // Insert events into Supabase
    for (const event of eventsData) {
      const { data, error } = await supabaseAdmin
        .from('events')
        .insert([{
          title: event.title,
          date: event.date,
          venue: event.venue,
          venue_postcode: event.venuePostcode || null,
          description: event.description || null,
          link: event.link || null
        }]);
        
      if (error) {
        console.error('Error migrating event:', event.title, error);
      } else {
        console.log('✓ Migrated event:', event.title);
      }
    }
    
    console.log('Events migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Execute the migration
migrateEvents().catch(console.error); 