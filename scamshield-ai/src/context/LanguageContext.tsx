import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  translations,
  AVAILABLE_LANGUAGES,
  type Language,
} from './translations'

export type { Language }
export { AVAILABLE_LANGUAGES }

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, defaultVal?: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'English',
  setLanguage: () => {},
  t: (key: string, defaultVal?: string) => defaultVal || key,
})

const LANG_CODE_MAP: Record<Language, string> = {
  English: 'en',
  Hindi: 'hi',
  Marathi: 'mr',
  Tamil: 'ta',
  Telugu: 'te',
  Kannada: 'kn',
  Malayalam: 'ml',
  Gujarati: 'gu',
  Rajasthani: 'raj',
  Nepali: 'ne',
  Assamese: 'as',
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scamshield-language') as Language | null
      if (saved && saved in translations) {
        return saved
      }
    }
    return 'English'
  })

  function setLanguage(lang: Language) {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('scamshield-language', lang)
      const code = LANG_CODE_MAP[lang] || 'en'
      document.documentElement.lang = code
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const code = LANG_CODE_MAP[language] || 'en'
      document.documentElement.lang = code
    }
  }, [language])

  function t(key: string, defaultVal?: string): string {
    const langDict = translations[language] || translations.English
    if (langDict && langDict[key]) {
      return langDict[key]
    }
    if (translations.English && translations.English[key]) {
      return translations.English[key]
    }
    return defaultVal || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
