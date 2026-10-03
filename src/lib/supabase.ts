import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants?.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants?.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('[Supabase] URL:', supabaseUrl);
console.log('[Supabase] Key:', supabaseAnonKey ? 'SET' : 'MISSING');

// Test connectivity
if (supabaseUrl) {
  fetch(`${supabaseUrl}/rest/v1/`)
    .then(() => console.log('[Supabase] ✓ Reachable'))
    .catch(err => console.error('[Supabase] ✗ Not reachable:', err.message));
}

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing credentials');
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storage: AsyncStorage,
        },
        global: {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      });
      console.log('[Supabase] Client created with AsyncStorage persistence');
    } catch (err) {
      console.error('[Supabase] Creation failed:', err);
      return null;
    }
  }

  return supabaseClient;
}

