import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { useLocale } from '@/shared/i18n/LocaleContext'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { FormField } from '@/shared/ui/FormField'
import { Alert } from '@/shared/ui/Alert'
import { isApiException } from '@/shared/api/error'
import styles from './AuthPage.module.css'

export function RegisterPage() {
  const { register } = useAuth()
  const { t } = useLocale()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; username?: string; password?: string }>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: typeof errors = {}
    if (!email.trim()) e.email = t('auth.emailRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = t('auth.emailInvalid')
    if (!username.trim()) e.username = t('auth.usernameRequired')
    else if (username.trim().length < 2) e.username = t('auth.usernameMin')
    else if (username.trim().length > 64) e.username = t('auth.usernameMax')
    if (!password) e.password = t('auth.passwordRequired')
    else if (password.length < 8) e.password = t('auth.passwordMin')
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
      await register(email, username, password)
      navigate('/projects', { replace: true })
    } catch (err) {
      if (isApiException(err)) setApiError(err.message)
      else setApiError(t('common.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/projects" className={styles.logo}>DevMatch</Link>
        <h1 className={styles.title}>{t('auth.createAccountTitle')}</h1>
        <p className={styles.subtitle}>{t('auth.createAccountSubtitle')}</p>

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

          <FormField label={t('auth.usernameLabel')} hint={t('auth.usernameHint')} error={errors.username}>
            <Input
              type="text"
              placeholder={t('auth.usernamePlaceholder')}
              value={username}
              onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: undefined })) }}
              error={!!errors.username}
              maxLength={64}
            />
          </FormField>

          <FormField label={t('auth.passwordLabel')} hint={t('auth.passwordHint')} error={errors.password}>
            <Input
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
              error={!!errors.password}
            />
          </FormField>

          <Button type="submit" full loading={loading}>{t('auth.createAccountBtn')}</Button>
        </form>

        <p className={styles.footer}>
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className={styles.link}>{t('auth.signInLink')}</Link>
        </p>
      </div>
    </div>
  )
}
