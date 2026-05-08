export const lightTheme = {
  primary: '#4F46E5', // Indigo 600 - vibrant, modern primary
  primaryDark: '#3730A3',
  primaryLight: '#818CF8',
  background: '#F8FAFC', // Slate 50 - clean, slightly cool white
  surface: '#FFFFFF', // Pure white cards
  surfaceElevated: '#FFFFFF',
  text: '#0F172A', // Slate 900 - sharp, premium black
  textSecondary: '#64748B', // Slate 500
  border: '#E2E8F0', // Slate 200
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',

  high: '#EF4444', // Red 500
  highBg: '#FEF2F2',
  medium: '#F59E0B', // Amber 500
  mediumBg: '#FFFBEB',
  low: '#10B981', // Emerald 500
  lowBg: '#ECFDF5',

  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6', // Blue 500

  shadow: 'rgba(15, 23, 42, 0.06)',
  shadowDark: 'rgba(15, 23, 42, 0.1)',
  overlay: 'rgba(15, 23, 42, 0.6)',
  disabled: '#CBD5E1', // Slate 300
  divider: '#F1F5F9', // Slate 100
  headerBg: '#FFFFFF',
  fabShadow: 'rgba(79, 70, 229, 0.3)',

  // 3D card colors
  cardShadow1: 'rgba(15, 23, 42, 0.04)',
  cardShadow2: 'rgba(15, 23, 42, 0.08)',
  statGrad1: '#4F46E5', // Indigo
  statGrad2: '#E11D48', // Rose
  statGrad3: '#059669', // Emerald
  statGrad4: '#D97706', // Amber
};

export const darkTheme = {
  primary: '#6366F1', // Indigo 500 - glows nicely in dark mode
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  background: '#020617', // Slate 950 - extremely deep, premium black
  surface: '#0F172A', // Slate 900 - slightly lighter for cards
  surfaceElevated: '#1E293B', // Slate 800 - for modals/floating elements
  text: '#F8FAFC', // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  border: '#1E293B', // Slate 800
  card: '#0F172A',
  cardElevated: '#1E293B',

  high: '#F87171', // Red 400
  highBg: 'rgba(239, 68, 68, 0.1)',
  medium: '#FBBF24', // Amber 400
  mediumBg: 'rgba(245, 158, 11, 0.1)',
  low: '#34D399', // Emerald 400
  lowBg: 'rgba(16, 185, 129, 0.1)',

  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA', // Blue 400

  shadow: 'rgba(0, 0, 0, 0.5)',
  shadowDark: 'rgba(0, 0, 0, 0.8)',
  overlay: 'rgba(2, 6, 23, 0.8)', // Deep slate overlay
  disabled: '#334155', // Slate 700
  divider: '#1E293B', // Slate 800
  headerBg: 'rgba(2, 6, 23, 0.9)', // Translucent dark header
  fabShadow: 'rgba(99, 102, 241, 0.4)',

  cardShadow1: 'rgba(0, 0, 0, 0.3)',
  cardShadow2: 'rgba(0, 0, 0, 0.6)',
  statGrad1: '#6366F1',
  statGrad2: '#FB7185',
  statGrad3: '#34D399',
  statGrad4: '#FBBF24',
};

export type Theme = typeof lightTheme;
