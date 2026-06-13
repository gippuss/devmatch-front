import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { FormField } from '@/shared/ui/FormField'
import { Alert } from '@/shared/ui/Alert'
import { isApiException } from '@/shared/api/error'
import styles from './AuthPage.module.css'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; username?: string; password?: string }>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: typeof errors = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email'
    if (!username.trim()) e.username = 'Username is required'
    else if (username.trim().length < 2) e.username = 'At least 2 characters'
    else if (username.trim().length > 64) e.username = 'Max 64 characters'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'At least 8 characters'
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
      else setApiError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/projects" className={styles.logo}>DevMatch</Link>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Join and find your team</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {apiError && <Alert type="error">{apiError}</Alert>}

          <FormField label="Email" error={errors.email}>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
              error={!!errors.email}
              autoFocus
            />
          </FormField>

          <FormField label="Username" hint="2–64 characters" error={errors.username}>
            <Input
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: undefined })) }}
              error={!!errors.username}
              maxLength={64}
            />
          </FormField>

          <FormField label="Password" hint="At least 8 characters" error={errors.password}>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
              error={!!errors.password}
            />
          </FormField>

          <Button type="submit" full loading={loading}>Create account</Button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
