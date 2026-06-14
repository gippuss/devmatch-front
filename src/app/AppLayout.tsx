import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { useLocale } from '@/shared/i18n/LocaleContext'
import { Button } from '@/shared/ui/Button'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { user, logout } = useAuth()
  const { t, locale, setLocale } = useLocale()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { from?: string } | null
  const fromMyProjects =
    location.pathname === '/my-projects' ||
    location.pathname === '/projects/new' ||
    state?.from === 'my-projects'
  const fromMyApplications =
    location.pathname === '/my-applications' ||
    state?.from === 'my-applications'
  const fromAdmin =
    location.pathname === '/admin' ||
    state?.from === 'admin'

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <NavLink to="/projects" className={styles.brand}>DevMatch</NavLink>
          <div className={styles.links}>
            <NavLink
              to="/projects"
              end
              className={({ isActive }) => {
                const active = isActive || (location.pathname.startsWith('/projects') && !fromMyProjects && !fromMyApplications && !fromAdmin)
                return `${styles.link} ${active ? styles.active : ''}`
              }}
            >
              {t('nav.projects')}
            </NavLink>
            {user && (
              <>
                <NavLink
                  to="/my-projects"
                  className={({ isActive }) => `${styles.link} ${(isActive || fromMyProjects) ? styles.active : ''}`}
                >
                  {t('nav.myProjects')}
                </NavLink>
                <NavLink
                  to="/my-applications"
                  className={({ isActive }) => `${styles.link} ${(isActive || fromMyApplications) ? styles.active : ''}`}
                >
                  {t('nav.myApplications')}
                </NavLink>
                <NavLink
                  to="/me"
                  className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                >
                  {t('nav.profile')}
                </NavLink>
                {user.is_admin && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => `${styles.link} ${styles.adminLink} ${(isActive || fromAdmin) ? styles.active : ''}`}
                  >
                    {t('nav.admin')}
                  </NavLink>
                )}
              </>
            )}
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.localeSwitcher}
              onClick={() => setLocale(locale === 'en' ? 'ru' : 'en')}
              aria-label="Switch language"
            >
              {locale === 'en' ? 'RU' : 'EN'}
            </button>
            {user ? (
              <div className={styles.user}>
                <span className={styles.username}>{user.username}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>{t('nav.signOut')}</Button>
              </div>
            ) : (
              <div className={styles.authBtns}>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>{t('nav.signIn')}</Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>{t('nav.signUp')}</Button>
              </div>
            )}
          </div>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
