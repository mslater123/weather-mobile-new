import React, { createContext, useContext } from 'react';
import { useColorScheme, ColorSchemeName } from 'react-native';

// Define the shape of your theme colors
interface ThemeColors {
  background: string;
  text: string;
  // Add more color properties as needed
}

// Define the Theme interface
interface Theme {
  dark: boolean;
  colors: ThemeColors;
}

// Define light and dark themes
const lightTheme: Theme = {
  dark: false,
  colors: {
    background: '#ffffff',
    text: '#000000',
    // Add more colors for light theme
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    background: '#000000',
    text: '#ffffff',
    // Add more colors for dark theme
  },
};

// Create the Theme Context
const ThemeContext = createContext<Theme | undefined>(undefined);

// Custom hook to use the ThemeContext
export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ThemeProvider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme: ColorSchemeName = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  console.log('Providing theme:', theme); // Debugging

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}; 