import fs from 'fs';
import path from 'path';
import supabaseAdmin from '../utils/supabaseAdmin';

// Path to the SQL migration file
const MIGRATION_FILE_PATH = path.join(process.cwd(), 'add_archive_field_to_videos.sql');

async function runMigration() {
  try {
    console.log('Starting database migration for video archiving feature...');
    
    // Check if Supabase admin client is initialized
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not initialized. Check your environment variables.');
      process.exit(1);
    }
    
    // Check if migration file exists
    if (!fs.existsSync(MIGRATION_FILE_PATH)) {
      console.error(`Migration file not found at: ${MIGRATION_FILE_PATH}`);
      process.exit(1);
    }
    
    // Read the SQL migration file
    const sql = fs.readFileSync(MIGRATION_FILE_PATH, 'utf8');
    
    // Split SQL statements to execute them one by one
    const sqlStatements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${sqlStatements.length} SQL statements to execute`);
    
    // Execute each SQL statement
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      console.log(`Executing statement ${i + 1}/${sqlStatements.length}...`);
      
      try {
        // Execute the SQL statement using the rpc function
        const { error } = await supabaseAdmin.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          // Continue with the next statement
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        // Continue with the next statement
      }
    }
    
    console.log('Migration completed!');
    
    // Verify the is_archived column was added
    try {
      console.log('Verifying is_archived column...');
      const { data, error } = await supabaseAdmin
        .from('videos')
        .select('is_archived')
        .limit(1);
      
      if (error) {
        console.error('Error verifying is_archived column:', error);
      } else {
        console.log('is_archived column successfully added to videos table');
      }
    } catch (error) {
      console.error('Error verifying is_archived column:', error);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 