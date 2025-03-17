import fs from 'fs';
import path from 'path';
import supabaseAdmin from '../utils/supabaseAdmin';

// Path to the SQL setup file
const SQL_SETUP_FILE_PATH = path.join(process.cwd(), 'supabase_setup.sql');

async function setupDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Check if Supabase admin client is initialized
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not initialized. Check your environment variables.');
      process.exit(1);
    }
    
    // Check if setup file exists
    if (!fs.existsSync(SQL_SETUP_FILE_PATH)) {
      console.error(`Setup file not found at: ${SQL_SETUP_FILE_PATH}`);
      process.exit(1);
    }
    
    // Read the SQL setup file
    const sql = fs.readFileSync(SQL_SETUP_FILE_PATH, 'utf8');
    
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
    
    console.log('Database setup completed!');
    
    // Verify the tables were created
    try {
      console.log('Verifying tables...');
      const { data: videos, error: videosError } = await supabaseAdmin
        .from('videos')
        .select('*')
        .limit(1);
      
      if (videosError) {
        console.error('Error verifying videos table:', videosError);
      } else {
        console.log('Videos table successfully created');
      }
      
      // Now add the archive field if it doesn't exist
      try {
        console.log('Adding is_archived field to videos table if it doesn\'t exist...');
        const { error: alterError } = await supabaseAdmin.rpc('exec_sql', { 
          sql_query: 'ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;' 
        });
        
        if (alterError) {
          console.error('Error adding is_archived field:', alterError);
        } else {
          console.log('is_archived field added or already exists in videos table');
        }
      } catch (alterError) {
        console.error('Error adding is_archived field:', alterError);
      }
    } catch (error) {
      console.error('Error verifying tables:', error);
    }
    
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase(); 