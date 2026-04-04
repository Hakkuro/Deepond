import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from '../lib/i18n';

type Theme = 'light' | 'dark';

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  lang: Language;
  toggleLang: () => void;
  t: typeof translations.en;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('deepond_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('deepond_lang');
    if (saved === 'en' || saved === 'zh') return saved;
    return navigator.language.startsWith('zh') ? 'zh' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('deepond_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('deepond_lang', lang);
    document.title = lang === 'zh' ? '玄珀 | Deepond' : 'Deepond | 玄珀';
  }, [lang]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(l => l === 'en' ? 'zh' : 'en');

  const t = translations[lang];

  return (
    <AppContext.Provider value={{ theme, toggleTheme, lang, toggleLang, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
