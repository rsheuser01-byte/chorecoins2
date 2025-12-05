import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

export interface CustomColors {
  moneyGreen: string; // HSL format: "142 76% 36%"
  moneyGold: string; // HSL format: "45 93% 47%"
  cryptoOrange: string; // HSL format: "25 95% 53%"
  successGreen: string; // HSL format: "142 71% 45%"
}

const defaultColors: CustomColors = {
  moneyGreen: '142 76% 36%',
  moneyGold: '45 93% 47%',
  cryptoOrange: '25 95% 53%',
  successGreen: '142 71% 45%',
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  colors: CustomColors;
  setColors: (colors: CustomColors) => void;
  resetColors: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  const [colors, setColorsState] = useState<CustomColors>(() => {
    const savedColors = localStorage.getItem('customColors');
    if (savedColors) {
      try {
        const parsed = JSON.parse(savedColors);
        // Validate and merge with defaults
        return {
          moneyGreen: parsed.moneyGreen || defaultColors.moneyGreen,
          moneyGold: parsed.moneyGold || defaultColors.moneyGold,
          cryptoOrange: parsed.cryptoOrange || defaultColors.cryptoOrange,
          successGreen: parsed.successGreen || defaultColors.successGreen,
        };
      } catch {
        return defaultColors;
      }
    }
    return defaultColors;
  });

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Apply custom colors to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--money-green', colors.moneyGreen);
    root.style.setProperty('--money-gold', colors.moneyGold);
    root.style.setProperty('--crypto-orange', colors.cryptoOrange);
    root.style.setProperty('--success-green', colors.successGreen);
    
    // Save to localStorage
    localStorage.setItem('customColors', JSON.stringify(colors));
  }, [colors]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setColors = (newColors: CustomColors) => {
    setColorsState(newColors);
  };

  const resetColors = () => {
    setColorsState(defaultColors);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, colors, setColors, resetColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

