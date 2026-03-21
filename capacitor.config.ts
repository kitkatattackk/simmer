import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.simmer.app',
  appName: 'Simmer',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    backgroundColor: '#F5F0E8',
    scrollEnabled: false,
  },
  android: {
    backgroundColor: '#F5F0E8',
  },
  plugins: {
    StatusBar: {
      style: 'Light',
      backgroundColor: '#F5F0E8',
      overlaysWebView: true,
    },
  },
};

export default config;
