import dotenv from 'dotenv';

dotenv.config();

export default {
  expo: {
    name: 'ABRAZO Health Guardian',
    slug: 'abrazo-health',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTabletMode: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.abrazo.healthguardian',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    scheme: 'abrazo',
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      deepseekApiKey: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY,
      emergencyNumber: process.env.EXPO_PUBLIC_EMERGENCY_NUMBER || '911',
    },
  },
};
