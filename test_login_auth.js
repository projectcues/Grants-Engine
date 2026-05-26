const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dbzbsqreymotzovhgodv.supabase.co';
const email = 'lloydpearson@projectcues.com';
const password = 'Pearson4$';

// Test with modern publishable key
const pubKey = 'sb_publishable_6uqdCowX0KaUFIczVnP-2A_06caOPEM';
// Test with legacy JWT key
const legacyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiemJzcXJleW1vdHpvdmhnb2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTYxNTcsImV4cCI6MjA4ODI5MjE1N30.KSNe5CdNx2JM1GGnPmYkennXvyq8xWgI5wHD1zvXwXE';

async function testKey(name, key) {
  console.log(`\nTesting auth with ${name} key...`);
  const supabase = createClient(supabaseUrl, key, {
    auth: {
      persistSession: false
    }
  });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      console.error(`${name} auth failed:`, error.message, error);
    } else {
      console.log(`${name} auth succeeded! User ID:`, data.user.id);
    }
  } catch (err) {
    console.error(`${name} threw error:`, err);
  }
}

async function run() {
  await testKey('Modern Publishable', pubKey);
  await testKey('Legacy JWT', legacyKey);
}

run();
