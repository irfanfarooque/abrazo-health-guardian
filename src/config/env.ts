import Constants from 'expo-constants';

const extra = Constants?.expoConfig?.extra || {};

console.log('[Env] SUPABASE_URL:', extra.supabaseUrl ? 'SET' : 'MISSING');
console.log('[Env] SUPABASE_KEY:', extra.supabaseAnonKey ? 'SET' : 'MISSING');

export const Env = {
  supabaseUrl: extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  deepseekApiKey: extra.deepseekApiKey || process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || '',
  emergencyNumber: extra.emergencyNumber || process.env.EXPO_PUBLIC_EMERGENCY_NUMBER || '911',
};

if (!Env.isSupabaseConfigured) {
  console.warn('Supabase environment variables are missing. Authentication will be disabled until they are provided.');
}

