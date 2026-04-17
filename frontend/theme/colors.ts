export const lightTheme = {
  primary: '#5B4FE8',
  primaryDark: '#3D33C4',
  primaryLight: '#8B82FF',
  background: '#F0EFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#12112A',
  textSecondary: '#6B6B8A',
  border: '#E2E0FF',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',

  high: '#FF3D57',
  highBg: '#FFF0F2',
  medium: '#FF8C00',
  mediumBg: '#FFF4E0',
  low: '#00C853',
  lowBg: '#E8FFF0',

  success: '#00C853',
  error: '#FF3D57',
  warning: '#FF8C00',
  info: '#5B4FE8',

  shadow: 'rgba(91, 79, 232, 0.18)',
  shadowDark: 'rgba(0,0,0,0.12)',
  overlay: 'rgba(18, 17, 42, 0.5)',
  disabled: '#C5C3D8',
  divider: '#EEEEFF',
  headerBg: '#FFFFFF',
  fabShadow: 'rgba(91, 79, 232, 0.45)',

  // 3D card colors
  cardShadow1: 'rgba(91, 79, 232, 0.12)',
  cardShadow2: 'rgba(0,0,0,0.08)',
  statGrad1: '#5B4FE8',
  statGrad2: '#FF3D57',
  statGrad3: '#00C853',
  statGrad4: '#FF8C00',
};

export const darkTheme = {
  primary: '#7B6FFF',
  primaryDark: '#5A52CC',
  primaryLight: '#A89CFF',
  background: '#0A0A18',
  surface: '#13132A',
  surfaceElevated: '#1C1C38',
  text: '#F0EEFF',
  textSecondary: '#9B99B8',
  border: '#252545',
  card: '#16163A',
  cardElevated: '#1E1E45',

  high: '#FF6B7A',
  highBg: '#2A1020',
  medium: '#FFB347',
  mediumBg: '#2A1A08',
  low: '#4EE88A',
  lowBg: '#0A2A18',

  success: '#4EE88A',
  error: '#FF6B7A',
  warning: '#FFB347',
  info: '#7B6FFF',

  shadow: 'rgba(0,0,0,0.6)',
  shadowDark: 'rgba(0,0,0,0.4)',
  overlay: 'rgba(0,0,0,0.75)',
  disabled: '#3A3A55',
  divider: '#1E1E3A',
  headerBg: '#13132A',
  fabShadow: 'rgba(123, 111, 255, 0.55)',

  cardShadow1: 'rgba(123, 111, 255, 0.15)',
  cardShadow2: 'rgba(0,0,0,0.35)',
  statGrad1: '#7B6FFF',
  statGrad2: '#FF6B7A',
  statGrad3: '#4EE88A',
  statGrad4: '#FFB347',
};

export type Theme = typeof lightTheme;
