import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthContext'
import { LocaleProvider } from '@/shared/i18n/LocaleContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </LocaleProvider>
  )
}
