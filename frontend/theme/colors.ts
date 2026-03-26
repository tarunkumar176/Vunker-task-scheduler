// Theme colors for light and dark modes

export const lightTheme = {
  primary: '#2196F3',
  primaryDark: '#1976D2',
  primaryLight: '#BBDEFB',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',
  card: '#FFFFFF',
  
  // Priority colors
  high: '#F44336',
  medium: '#FF9800',
  low: '#4CAF50',
  
  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  
  // UI elements
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  disabled: '#BDBDBD',
};

export const darkTheme = {
  primary: '#2196F3',
  primaryDark: '#1565C0',
  primaryLight: '#64B5F6',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  card: '#1E1E1E',
  
  // Priority colors
  high: '#EF5350',
  medium: '#FFA726',
  low: '#66BB6A',
  
  // Status colors
  success: '#66BB6A',
  error: '#EF5350',
  warning: '#FFA726',
  info: '#42A5F5',
  
  // UI elements
  shadow: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  disabled: '#616161',
};

export type Theme = typeof lightTheme;