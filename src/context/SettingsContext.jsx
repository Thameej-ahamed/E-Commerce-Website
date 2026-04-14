import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(localStorage.getItem('themeMode') || 'light');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'English');
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('currency');
    // Force migration from USD to INR for the new Indian-market direction
    if (!saved || saved === 'USD') return 'INR';
    return saved;
  });

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  /**
   * Helper function to translate keys based on current language
   */
  const t = (key) => {
    const langSet = translations[language] || translations['English'];
    return langSet[key] || key;
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        themeMode, 
        setThemeMode, 
        toggleTheme, 
        language, 
        setLanguage, 
        currency, 
        setCurrency,
        t
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
