// ShiftBuddy Enhanced Design System
// Inspired by modern productivity apps with warm, professional aesthetics

const colors = {
  // Primary brand colors - Modern blues with warmth
  primary: {
    50: '#F0F9FF',
    100: '#E0F2FE', 
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9', // Main brand
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  
  // Secondary colors - Warm coral/rose
  secondary: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316', // Accent
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },

  // Neutral grays - Modern and clean
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic colors
  success: {
    50: '#F0FDF4',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },
  
  warning: {
    50: '#FFFBEB',
    500: '#EAB308',
    600: '#CA8A04',
  },
  
  error: {
    50: '#FEF2F2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },

  // Convenient aliases for most used colors
  background: '#FAFAFA', // neutral.50
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5', // neutral.100
  outline: '#E5E5E5', // neutral.200
  text: {
    primary: '#171717', // neutral.900
    secondary: '#525252', // neutral.600
    tertiary: '#A3A3A3', // neutral.400
    inverse: '#FFFFFF',
  },
  
  // Legacy support (will be phased out)
  accent1: '#0369A1',
  accent2: '#FB923C',
  card: '#FFFFFF',
  border: '#E5E5E5',
  disabled: '#D4D4D4',
};

const typography = {
  // Display text - for hero sections
  display: {
    large: { fontSize: 57, fontWeight: '400', lineHeight: 64 },
    medium: { fontSize: 45, fontWeight: '400', lineHeight: 52 },
    small: { fontSize: 36, fontWeight: '400', lineHeight: 44 },
  },
  
  // Headlines - for page titles
  headline: {
    large: { fontSize: 32, fontWeight: '600', lineHeight: 40 },
    medium: { fontSize: 28, fontWeight: '600', lineHeight: 36 },
    small: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
  },
  
  // Titles - for section headers
  title: {
    large: { fontSize: 22, fontWeight: '500', lineHeight: 28 },
    medium: { fontSize: 20, fontWeight: '500', lineHeight: 24 },
    small: { fontSize: 18, fontWeight: '500', lineHeight: 24 },
  },
  
  // Body text
  body: {
    large: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    medium: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    small: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  },
  
  // Labels - for UI elements
  label: {
    large: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
    medium: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
    small: { fontSize: 11, fontWeight: '500', lineHeight: 16 },
  },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
};

const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  
  // Legacy support
  elevation2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  elevation4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
};

// Animation configurations
const animation = {
  timing: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  easing: {
    standard: 'ease-in-out',
    decelerate: 'ease-out',
    accelerate: 'ease-in',
  },
};

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadow,
  animation,
  
  // Legacy support - will be deprecated
  shape: { borderRadius: 8 },
};

export default theme; 