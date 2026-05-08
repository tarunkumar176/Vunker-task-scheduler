// Discord-inspired Aesthetic
export const lightTheme = {
  primary: '#5865F2', // Discord Blurple
  primaryDark: '#4752C4',
  primaryLight: '#7983F5',
  background: '#F2F3F5', // Discord Light Secondary
  surface: '#FFFFFF', // Discord Light Primary
  surfaceElevated: '#FFFFFF',
  text: '#060607', // Discord Light Text Normal
  textSecondary: '#4E5058', // Discord Light Text Muted
  border: '#E3E5E8', // Discord Light Divider
  card: '#FFFFFF',
  cardElevated: '#EBEDEF',

  high: '#ED4245', // Discord Red
  highBg: '#FDD8D8',
  medium: '#FEE75C', // Discord Yellow
  mediumBg: '#FFF9D6',
  low: '#57F287', // Discord Green
  lowBg: '#DCFCE4',

  success: '#57F287',
  error: '#ED4245',
  warning: '#FEE75C',
  info: '#00A8FC', // Discord Blue

  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.16)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  disabled: '#C4C9CE',
  divider: '#E3E5E8',
  headerBg: '#FFFFFF',
  fabShadow: 'rgba(88, 101, 242, 0.3)',

  // 3D card colors
  cardShadow1: 'rgba(0, 0, 0, 0.04)',
  cardShadow2: 'rgba(0, 0, 0, 0.08)',
  statGrad1: '#5865F2', // Blurple
  statGrad2: '#ED4245', // Red
  statGrad3: '#57F287', // Green
  statGrad4: '#FEE75C', // Yellow
};

export const darkTheme = {
  primary: '#5865F2', // Discord Blurple
  primaryDark: '#4752C4',
  primaryLight: '#7983F5',
  background: '#313338', // Discord Chat Background
  surface: '#2B2D31', // Discord Sidebar / Modals
  surfaceElevated: '#1E1F22', // Discord Server List / Deep Elements
  text: '#DBDEE1', // Discord Text Normal
  textSecondary: '#949BA4', // Discord Text Muted
  border: '#1E1F22', // Discord Deep Divider
  card: '#2B2D31',
  cardElevated: '#383A40', // Discord Hover Background

  high: '#ED4245', // Discord Red
  highBg: 'rgba(237, 66, 69, 0.15)',
  medium: '#FEE75C', // Discord Yellow
  mediumBg: 'rgba(254, 231, 92, 0.1)',
  low: '#57F287', // Discord Green
  lowBg: 'rgba(87, 242, 135, 0.15)',

  success: '#57F287',
  error: '#ED4245',
  warning: '#FEE75C',
  info: '#00A8FC',

  shadow: 'rgba(0, 0, 0, 0.2)',
  shadowDark: 'rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.85)', // Discord deep dim overlay
  disabled: '#4E5058',
  divider: '#1E1F22',
  headerBg: '#313338', // Match background for seamless look
  fabShadow: 'rgba(88, 101, 242, 0.4)',

  cardShadow1: 'rgba(0, 0, 0, 0.15)',
  cardShadow2: 'rgba(0, 0, 0, 0.3)',
  statGrad1: '#5865F2',
  statGrad2: '#ED4245',
  statGrad3: '#57F287',
  statGrad4: '#FEE75C',
};

export type Theme = typeof lightTheme;
