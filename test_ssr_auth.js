const { createServerClient } = require('@supabase/ssr');

const supabaseUrl = 'https://dbzbsqreymotzovhgodv.supabase.co';
const supabaseKey = 'sb_publishable_6uqdCowX0KaUFIczVnP-2A_06caOPEM';
const email = 'lloydpearson@projectcues.com';
const password = 'Pearson4$';

// Mock cookies
const cookieStore = {
  cookies: {},
  getAll() {
    return Object.entries(this.cookies).map(([name, value]) => ({ name, value }));
  },
  set(name, value, options) {
    this.cookies[name] = value;
    console.log(`Cookie set: ${name}=${value}`);
  }
};

const supabase = createServerClient(supabaseUrl, supabaseKey, {
  cookies: {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        cookieStore.set(name, value, options);
      });
    }
  }
});

async function run() {
  console.log('Testing with createServerClient...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      console.error('SSR Auth failed:', error.message, error);
    } else {
      console.log('SSR Auth succeeded! User ID:', data.user.id);
      console.log('Session access token:', data.session.access_token.substring(0, 20) + '...');
    }
  } catch (err) {
    console.error('SSR threw error:', err);
  }
}

run();
