require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminProfile(email) {
  console.log(`Starting profile fix for: ${email}`);

  try {
    // Step 1: Check if the user exists
    console.log('Checking if user exists...');
    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (userError) {
      // If we're using anon key instead of service role key, try to get the user another way
      console.log('Could not use admin API, trying auth API...');
      
      // Log in as the user (this would require the user's password)
      console.log('Please note: To proceed with this approach, you would need to sign in manually in the app.');
      console.log('Then try accessing the admin page again to get debugging info.');
      
      const { data: authUserData, error: authUserError } = await supabase.auth.getUser();
      
      if (authUserError || !authUserData?.user) {
        console.error('Error finding user:', authUserError || 'No user found');
        process.exit(1);
      }
      
      userData = { user: authUserData.user };
    }
    
    if (!userData?.user) {
      console.error('No user found with email:', email);
      process.exit(1);
    }
    
    const userId = userData.user.id;
    console.log(`Found user with ID: ${userId}`);
    
    // Step 2: Check if the profiles table exists
    console.log('Checking if profiles table exists...');
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');
    
    if (tablesError) {
      console.error('Error checking for tables:', tablesError);
      // Continue anyway
    }
    
    const profilesTableExists = tablesData && tablesData.length > 0;
    console.log(`Profiles table exists: ${profilesTableExists}`);
    
    if (!profilesTableExists) {
      console.log('Creating profiles table...');
      
      // Create the user_role enum type if it doesn't exist
      await supabase.rpc('create_user_role_enum_if_not_exists').catch(err => {
        console.log('Note: Could not create user_role enum. It might already exist or you might need to run this script from the Supabase dashboard SQL editor.');
      });
      
      // Create the profiles table
      const createTableQuery = `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        avatar_url TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_sign_in_at TIMESTAMPTZ
      );
      
      -- Set up Row Level Security (RLS)
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY "Users can view own profile" 
      ON profiles FOR SELECT 
      USING (auth.uid() = id);
      
      CREATE POLICY "Users can update own profile" 
      ON profiles FOR UPDATE 
      USING (auth.uid() = id);
      
      CREATE POLICY "Everyone can view all profiles" 
      ON profiles FOR SELECT 
      USING (true);
      `;
      
      console.log('Note: You may need to run the above SQL in the Supabase dashboard SQL editor.');
    }
    
    // Step 3: Insert or update the user profile with admin role
    console.log('Setting user as admin...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
    
    if (profileError) {
      console.error('Error updating profile:', profileError);
      process.exit(1);
    }
    
    console.log('✅ Success! User has been set as admin.');
    console.log('Try logging out and back in to apply the changes.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Error: Email is required');
  console.log('Usage: node scripts/fix-admin-profile.js your-email@example.com');
  process.exit(1);
}

fixAdminProfile(email).then(() => {
  process.exit(0);
}); 