// Theme colors for light and dark modes

export const lightTheme = {
  primary: '#6C63FF',
  primaryDark: '#4B44CC',
  primaryLight: '#A89CFF',
  primaryGradientStart: '#6C63FF',
  primaryGradientEnd: '#A89CFF',
  background: '#F8F7FF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B6B8A',
  border: '#E8E6FF',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',

  // Priority colors
  high: '#FF4757',
  highBg: '#FFF0F1',
  medium: '#FF8C42',
  mediumBg: '#FFF5EE',
  low: '#2ED573',
  lowBg: '#EDFFF5',

  // Status colors
  success: '#2ED573',
  error: '#FF4757',
  warning: '#FF8C42',
  info: '#6C63FF',

  // UI elements
  shadow: 'rgba(108, 99, 255, 0.15)',
  overlay: 'rgba(26, 26, 46, 0.5)',
  disabled: '#C5C3D8',
  divider: '#F0EEFF',
  headerBg: '#FFFFFF',
  fabShadow: 'rgba(108, 99, 255, 0.4)',
};

export const darkTheme = {
  primary: '#7C73FF',
  primaryDark: '#5A52CC',
  primaryLight: '#A89CFF',
  primaryGradientStart: '#7C73FF',
  primaryGradientEnd: '#A89CFF',
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceElevated: '#22223A',
  text: '#F0EEFF',
  textSecondary: '#9B99B8',
  border: '#2A2A45',
  card: '#1E1E35',
  cardElevated: '#252540',

  // Priority colors
  high: '#FF6B7A',
  highBg: '#2A1520',
  medium: '#FFB347',
  mediumBg: '#2A1E10',
  low: '#4EE88A',
  lowBg: '#102A1E',

  // Status colors
  success: '#4EE88A',
  error: '#FF6B7A',
  warning: '#FFB347',
  info: '#7C73FF',

  // UI elements
  shadow: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  disabled: '#3A3A55',
  divider: '#22223A',
  headerBg: '#1A1A2E',
  fabShadow: 'rgba(124, 115, 255, 0.5)',
};

export type Theme = typeof lightTheme;
