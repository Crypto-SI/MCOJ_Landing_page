import { createClient } from '@supabase/supabase-js';

// Get the Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for browser-side usage
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase; 