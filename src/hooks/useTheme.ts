// src/hooks/useTheme.ts
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, ThemeColors, ThemeSpacing, ThemeFonts, ThemeFontSizes, ThemeBorderRadius } from '../types';
import * as SecureStore from 'expo-secure-store';

// Define light and dark themes
const lightColors: ThemeColors = {
  primary: '#008751',
  primaryLight: '#00A862',
  secondary: '#FF6B35',
  secondaryLight: '#FF8555',
  accent: '#FFD700',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
};

const darkColors: ThemeColors = {
  primary: '#00A862',
  primaryLight: '#00C973',
  secondary: '#FF8555',
  secondaryLight: '#FFA075',
  accent: '#FFE066',
  background: '#111827',
  surface: '#1F2937',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#374151',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  white: '#FFFFFF',
  black: '#000000',
};

const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const fonts: ThemeFonts = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
};

const fontSizes: ThemeFontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
};

const borderRadius: ThemeBorderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  full: 999,
};

const createTheme = (isDark: boolean): Theme => ({
  colors: isDark ? darkColors : lightColors,
  spacing,
  fonts,
  fontSizes,
  borderRadius,
});

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  themeMode: 'light' | 'dark' | 'system';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      setIsDarkMode(systemColorScheme === 'dark');
    } else {
      setIsDarkMode(themeMode === 'dark');
    }
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync('theme_preference');
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeMode(savedTheme as 'light' | 'dark' | 'system');
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const saveThemePreference = async (mode: 'light' | 'dark' | 'system') => {
    try {
      await SecureStore.setItemAsync('theme_preference', mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    setThemeMode(newMode);
    saveThemePreference(newMode);
  };

  const handleSetThemeMode = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    saveThemePreference(mode);
  };

  const theme = createTheme(isDarkMode);

  const value: ThemeContextType = {
    theme,
    isDarkMode,
    toggleTheme,
    setThemeMode: handleSetThemeMode,
    themeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default useTheme;