'use client';

import { createContext, useContext, useEffect } from 'react';

// Keep the union type for compatibility, but we will always use 'light'
type Theme = 'light' | 'dark' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: 'light',
  setTheme: () => {
    /* no-op: dark/system themes removed */
  },
});

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Force light theme on mount and ensure dark class is removed
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    // Adding 'light' class is harmless and keeps Tailwind variants predictable
    if (!root.classList.contains('light')) root.classList.add('light');
    try {
      localStorage.setItem('theme', 'light');
    } catch (_) {
      // ignore storage errors (e.g., privacy mode)
    }
  }, []);

  return (
    <ThemeProviderContext.Provider value={{ theme: 'light', setTheme: () => {} }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};