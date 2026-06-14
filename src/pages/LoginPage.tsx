import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { useLocale } from '@/shared/i18n/LocaleContext'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { FormField } from '@/shared/ui/FormField'
import { Alert } from '@/shared/ui/Alert'
import { isApiException } from '@/shared/api/error'
import styles from './AuthPage.module.css'

export function LoginPage() {
  const { login } = useAuth()
  const { t } = useLocale()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from ?? '/projects'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: typeof errors = {}
    if (!email.trim()) e.email = t('auth.emailRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = t('auth.emailInvalid')
    if (!password) e.password = t('auth.passwordRequired')
    return e
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setApiError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      if (isApiException(err) && err.status === 401) setApiError(t('auth.invalidCredentials'))
      else if (isApiException(err)) setApiError(err.message)
      else setApiError(t('common.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/projects" className={styles.logo}>DevMatch</Link>
        <h1 className={styles.title}>{t('auth.signInTitle')}</h1>
        <p className={styles.subtitle}>{t('auth.signInSubtitle')}</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {apiError && <Alert type="error">{apiError}</Alert>}

          <FormField label={t('auth.emailLabel')} error={errors.email}>
            <Input
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
              error={!!errors.email}
              autoFocus
            />
          </FormField>

          <FormField label={t('auth.passwordLabel')} error={errors.password}>
            <Input
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
              error={!!errors.password}
            />
          </FormField>

          <Button type="submit" full loading={loading}>{t('auth.signInBtn')}</Button>
        </form>

        <p className={styles.footer}>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className={styles.link}>{t('auth.createOne')}</Link>
        </p>
      </div>
    </div>
  )
}
