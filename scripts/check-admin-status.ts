/**
 * This script checks if a user has admin role in the database.
 * Run using:
 *   npx ts-node scripts/check-admin-status.ts your-email@example.com
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminStatus(email: string) {
  try {
    console.log(`Checking admin status for user: ${email}`);
    
    // Check if the user exists
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email);
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }
    
    if (!userData || userData.length === 0) {
      console.log(`No user found with email: ${email}`);
      return;
    }
    
    console.log('\nUser found:');
    console.log(`ID: ${userData[0].id}`);
    console.log(`Email: ${userData[0].email}`);
    console.log(`Name: ${userData[0].first_name} ${userData[0].last_name}`);
    console.log(`Current role: ${userData[0].role}`);
    
    if (userData[0].role !== 'admin') {
      console.log('\nThis user is NOT an admin.');
      
      // Prompt to update role
      console.log('\nTo make this user an admin, run the following SQL in Supabase SQL Editor:');
      console.log(`
UPDATE profiles
SET role = 'admin'
WHERE email = '${email}';
      `);
    } else {
      console.log('\n✅ This user is already an admin!');
    }
    
  } catch (error) {
    console.error('Error checking admin status:', error);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Error: Email is required');
  console.log('Usage: npx ts-node scripts/check-admin-status.ts your-email@example.com');
  process.exit(1);
}

checkAdminStatus(email).then(() => {
  process.exit(0);
}); 