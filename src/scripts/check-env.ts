// Script to check for presence of required environment variables
console.log('Checking environment variables...');

// Check for Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL is not set!');
  console.log('Please add it to your .env.local file:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project-reference.supabase.co');
} else {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
}

// Check for Supabase Anon Key
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseAnonKey) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set!');
  console.log('Please add it to your .env.local file:');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase-dashboard');
} else {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:', 
    supabaseAnonKey.substring(0, 5) + '...' + supabaseAnonKey.substring(supabaseAnonKey.length - 5));
}

// Check for Supabase Service Role Key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is not set!');
  console.log('Please add it to your .env.local file:');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase-dashboard');
} else {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY:', 
    supabaseServiceKey.substring(0, 5) + '...' + supabaseServiceKey.substring(supabaseServiceKey.length - 5));
}

// Provide help
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.log('\nHow to fix:');
  console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to Project Settings > API');
  console.log('4. Copy the URL, anon key, and service role key');
  console.log('5. Add them to your .env.local file');
  console.log('\nThen restart your development server with: npm run dev');
} else {
  console.log('\nAll required environment variables are set! ✅');
} 