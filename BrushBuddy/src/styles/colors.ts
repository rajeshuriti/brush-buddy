// Kid-friendly color palette for Brush Buddy
export const colors = {
  // Primary colors
  primary: '#2E86AB',        // Ocean blue
  primaryLight: '#4FC3F7',   // Light blue
  primaryDark: '#1565C0',    // Dark blue
  
  // Secondary colors
  secondary: '#4CAF50',      // Green for success/positive actions
  secondaryLight: '#81C784', // Light green
  secondaryDark: '#388E3C',  // Dark green
  
  // Accent colors
  accent: '#FF9800',         // Orange for attention/speaking
  accentLight: '#FFB74D',    // Light orange
  accentDark: '#F57C00',     // Dark orange
  
  // Background colors
  background: '#F0F8FF',     // Alice blue - very light blue
  backgroundLight: '#FFFFFF', // Pure white
  backgroundCard: '#E3F2FD', // Light blue card background
  backgroundTimer: '#FFF3E0', // Light orange for timer
  
  // Text colors
  textPrimary: '#333333',    // Dark gray for main text
  textSecondary: '#666666',  // Medium gray for secondary text
  textLight: '#999999',      // Light gray for hints
  textWhite: '#FFFFFF',      // White text for buttons
  
  // Status colors
  success: '#4CAF50',        // Green for success
  warning: '#FF9800',        // Orange for warnings
  error: '#F44336',          // Red for errors
  info: '#2196F3',           // Blue for information
  
  // Voice status colors
  listening: '#4CAF50',      // Green when listening
  speaking: '#FF9800',       // Orange when speaking
  recognized: '#666666',     // Gray for recognized text
  
  // Button colors
  buttonPrimary: '#4CAF50',  // Green primary button
  buttonSecondary: '#2196F3', // Blue secondary button
  buttonDisabled: '#CCCCCC', // Gray disabled button
  
  // Border colors
  border: '#E0E0E0',         // Light gray border
  borderLight: '#F5F5F5',    // Very light gray border
  
  // Shadow colors
  shadow: '#000000',         // Black for shadows
};

// Typography scale
export const typography = {
  // Font sizes
  fontSize: {
    small: 12,
    medium: 14,
    large: 16,
    xlarge: 18,
    xxlarge: 20,
    title: 24,
    heading: 32,
  },
  
  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Line heights
  lineHeight: {
    tight: 20,
    normal: 24,
    relaxed: 28,
    loose: 32,
  },
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

// Border radius scale
export const borderRadius = {
  small: 5,
  medium: 10,
  large: 15,
  xlarge: 20,
  round: 25,
  circle: 50,
};

// Shadow styles
export const shadows = {
  small: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  large: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};
