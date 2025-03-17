import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and service role key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key for server-side operations
// This has admin privileges and should only be used in server-side code

// Log initialization status for debugging - key is partially hidden for security
console.log('Initializing Supabase Admin client');
console.log(`URL: ${supabaseUrl || 'NOT SET!'}`);
console.log(`Service Role Key: ${supabaseServiceRoleKey ? 
  (supabaseServiceRoleKey.substring(0, 10) + '...') : 'NOT SET!'}`);

// More robust client creation with better error handling
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

try {
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  }
  
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }
  
  // Create client with proper configuration
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  
  // Test the connection
  console.log('Supabase Admin client initialized successfully');
} catch (error) {
  console.error('Supabase admin client could not be initialized:', error);
}

export default supabaseAdmin; 