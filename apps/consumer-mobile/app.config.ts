import path from 'path';
import { config as loadDotenv } from 'dotenv';
import type { ConfigContext, ExpoConfig } from 'expo/config';

loadDotenv({ path: path.join(__dirname, '.env') });
loadDotenv({ path: path.join(__dirname, '.env.local') });

/** Default local Supabase (CLI). Used when EXPO_PUBLIC_* are missing at bundle/config time. */
const LAN_FALLBACK_HOST = process.env.REACT_NATIVE_PACKAGER_HOSTNAME || '127.0.0.1';
const LOCAL_SUPABASE_URL = `http://${LAN_FALLBACK_HOST}:54321`;
const LOCAL_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.9kEXx9GFfgcZ21LlMB1qI-LOwSGOzI8g8c92UgEHQDk';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'funcup',
  slug: 'funcup',
  scheme: 'funcup',
  version: '0.1.0',
  newArchEnabled: true,
  orientation: 'portrait',
  platforms: ['ios', 'android', 'web'],
  assetBundlePatterns: ['**/*'],
  plugins: [
    'expo-secure-store',
    [
      'expo-router',
      {
        root: 'app',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'Funcup potrzebuje dostępu do aparatu, aby skanować kody QR z etykiet kawy.',
        recordAudioAndroid: false,
      },
    ],
  ],
  android: {
    intentFilters: [
      {
        action: 'VIEW',
        data: [
          {
            scheme: 'funcup',
            host: 'q',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
      {
        action: 'VIEW',
        data: [
          {
            scheme: 'funcup',
            host: 'q',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
    package: 'com.anonymous.funcup',
  },
  ios: {
    bundleIdentifier: 'com.anonymous.funcup',
    // Allows plain HTTP to LAN/local Docker when using a dev build (`expo run:ios`).
    // Expo Go ignores this plist — use hosted HTTPS Supabase or a dev client for local scan_qr.
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsLocalNetworking: true,
      },
    },
  },
  extra: {
    supabaseFallbackUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL,
    supabaseFallbackAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || LOCAL_SUPABASE_ANON_KEY,
  },
});
