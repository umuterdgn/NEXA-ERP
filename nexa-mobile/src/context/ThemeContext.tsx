import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppTheme = "dark" | "light" | "monochrome";
export type AppLanguage = "tr" | "en" | "de";

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
  success: string;
  warning: string;
  danger: string;
  isMonochrome: boolean;
  isDark: boolean;
}

const themePalettes: Record<AppTheme, ThemeColors> = {
  dark: {
    background: "#0A0F1C",
    surface: "#111827",
    card: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.08)",
    text: "#FFFFFF",
    textSecondary: "rgba(235, 235, 245, 0.60)",
    primary: "#0A7AFF",
    success: "#34C759",
    warning: "#FF9500",
    danger: "#FF3B30",
    isMonochrome: false,
    isDark: true,
  },
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    border: "#E2E8F0",
    text: "#0F172A",
    textSecondary: "#64748B",
    primary: "#0284C7",
    success: "#16A34A",
    warning: "#D97706",
    danger: "#DC2626",
    isMonochrome: false,
    isDark: false,
  },
  monochrome: {
    background: "#000000",
    surface: "#121212",
    card: "#181818",
    border: "#FFFFFF",
    text: "#FFFFFF",
    textSecondary: "#D4D4D4",
    primary: "#FFFFFF",
    success: "#FFFFFF",
    warning: "#D4D4D4",
    danger: "#FFFFFF",
    isMonochrome: true,
    isDark: true,
  },
};

interface ThemeContextType {
  theme: AppTheme;
  language: AppLanguage;
  colors: ThemeColors;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (lang: AppLanguage) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  language: "tr",
  colors: themePalettes.dark,
  setTheme: () => {},
  setLanguage: () => {},
});

export const useMobileTheme = () => useContext(ThemeContext);

export function MobileThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("dark");
  const [language, setLanguageState] = useState<AppLanguage>("tr");

  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("@nexa_app_theme");
        if (savedTheme && (savedTheme === "dark" || savedTheme === "light" || savedTheme === "monochrome")) {
          setThemeState(savedTheme as AppTheme);
        }
        const savedLang = await AsyncStorage.getItem("@nexa_app_lang");
        if (savedLang && (savedLang === "tr" || savedLang === "en" || savedLang === "de")) {
          setLanguageState(savedLang as AppLanguage);
        }
      } catch (e) {
        // Fallback to default
      }
    })();
  }, []);

  const setTheme = async (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem("@nexa_app_theme", newTheme);
    } catch (e) {
      console.warn("Tema kaydedilemedi:", e);
    }
  };

  const setLanguage = async (newLang: AppLanguage) => {
    setLanguageState(newLang);
    try {
      await AsyncStorage.setItem("@nexa_app_lang", newLang);
    } catch (e) {
      console.warn("Dil kaydedilemedi:", e);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        language,
        colors: themePalettes[theme],
        setTheme,
        setLanguage,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

