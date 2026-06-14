import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import en from './en'
import ru from './ru'

export type Locale = 'en' | 'ru'

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const translations: Record<Locale, Record<string, unknown>> = { en, ru }

function deepGet(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return path
    }
    current = (current as Record<string, unknown>)[part]
  }
  if (typeof current === 'string') return current
  return path
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

const STORAGE_KEY = 'devmatch_locale'

function getInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'ru') return saved
  } catch {
    // localStorage not available
  }
  return 'en'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // ignore
    }
  }, [])

  const t = useCallback(
    (key: string) => deepGet(translations[locale] as Record<string, unknown>, key),
    [locale],
  )

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
