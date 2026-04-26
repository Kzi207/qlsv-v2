import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'MY CTUT',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    CapacitorCookies: {
      enabled: true,
    }
  }
};

export default config;
