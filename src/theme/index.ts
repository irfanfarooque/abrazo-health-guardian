import { MD3LightTheme, configureFonts, MD3Theme } from 'react-native-paper';

const fontConfig = {
  fontFamily: 'System',
};

const colors = {
  primary: '#2563EB',
  primaryContainer: '#DCE7FF',
  secondary: '#0F172A',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  error: '#DC2626',
  warning: '#F97316',
  success: '#16A34A',
  text: '#0F172A',
  muted: '#94A3B8',
  border: '#E2E8F0',
};

const paperFonts = configureFonts({
  config: {
    fontFamily: fontConfig.fontFamily,
  },
});

export const theme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...colors,
  },
  fonts: paperFonts,
  roundness: 10,
};

export type AppTheme = typeof theme;

