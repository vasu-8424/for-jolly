import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { verifyFirebaseIdToken } from '../src/lib/firebase/verify-token.ts';

dotenv.config({ path: 'd:/admin-kakinad/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function runTests() {
  console.log('--- STARTING VERIFICATION TESTS ---');

  // 1. Test Anon access on device_tokens (Should be restricted / return error or 0 rows if table exists)
  console.log('\n[TEST 1] Testing Anon Key vs Service Role Key on device_tokens...');
  const anonSupabase = createClient(supabaseUrl, anonKey);
  const serviceSupabase = createClient(supabaseUrl, serviceKey);

  const { data: anonSelect, error: anonSelectErr } = await anonSupabase
    .from('device_tokens')
    .select('*');

  console.log('Anon SELECT on device_tokens:', {
    data: anonSelect,
    error: anonSelectErr ? { code: anonSelectErr.code, message: anonSelectErr.message } : null,
  });

  // 2. Test Firebase ID Token Verifier on invalid token
  console.log('\n[TEST 2] Testing verifyFirebaseIdToken on malformed/invalid tokens...');
  const res1 = await verifyFirebaseIdToken('invalid.token.here');
  console.log('Invalid token result:', res1);

  // 3. Test Banners fallback & fetch
  console.log('\n[TEST 3] Testing getBanners server action...');
  const { getBanners } = await import('../src/actions/banners.ts');
  const banners = await getBanners();
  console.log(`Fetched ${banners.length} banners:`, banners.map(b => ({ id: b.id, title: b.title, order: b.display_order, active: b.is_active })));

  // 4. Test Onboarding screens fetch
  console.log('\n[TEST 4] Testing getOnboardingScreens server action...');
  const { getOnboardingScreens } = await import('../src/actions/onboarding.ts');
  const screens = await getOnboardingScreens();
  console.log(`Fetched ${screens.length} onboarding screens:`, screens.map(s => ({ slot: s.display_order, title: s.title })));

  // 5. Test Notifications fetch & broadcast insertion
  console.log('\n[TEST 5] Testing getNotifications server action...');
  const { getNotifications, sendBroadcastNotification } = await import('../src/actions/notifications.ts');
  const notifs = await getNotifications();
  console.log(`Fetched ${notifs.length} existing notifications in Supabase.`);

  console.log('\n--- VERIFICATION TESTS COMPLETED ---');
}

runTests().catch(console.error);
