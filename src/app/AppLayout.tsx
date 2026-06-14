import { useState, useEffect } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)

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

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  async function handleLogout() {
    await logout()
    navigate('/login')
    setMenuOpen(false)
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <NavLink to="/" className={styles.brand}>DevMatch</NavLink>

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

            <button
              type="button"
              className={styles.hamburger}
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <span className={`${styles.bar} ${menuOpen ? styles.barTop : ''}`} />
              <span className={`${styles.bar} ${menuOpen ? styles.barMid : ''}`} />
              <span className={`${styles.bar} ${menuOpen ? styles.barBot : ''}`} />
            </button>
          </div>
        </nav>
      </header>

      {menuOpen && (
        <div className={styles.backdrop} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}

      <div className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`} aria-hidden={!menuOpen}>
        <div className={styles.drawerHeader}>
          <span className={styles.drawerBrand}>DevMatch</span>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <nav className={styles.drawerNav}>
          <NavLink
            to="/projects"
            end
            className={({ isActive }) => {
              const active = isActive || (location.pathname.startsWith('/projects') && !fromMyProjects && !fromMyApplications && !fromAdmin)
              return `${styles.drawerLink} ${active ? styles.drawerLinkActive : ''}`
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.drawerIcon}>
              <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            {t('nav.projects')}
          </NavLink>

          {user && (
            <>
              <NavLink
                to="/my-projects"
                className={({ isActive }) => `${styles.drawerLink} ${(isActive || fromMyProjects) ? styles.drawerLinkActive : ''}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.drawerIcon}>
                  <path d="M2 5h12M2 8h8M2 11h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                {t('nav.myProjects')}
              </NavLink>
              <NavLink
                to="/my-applications"
                className={({ isActive }) => `${styles.drawerLink} ${(isActive || fromMyApplications) ? styles.drawerLinkActive : ''}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.drawerIcon}>
                  <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t('nav.myApplications')}
              </NavLink>
              <NavLink
                to="/me"
                className={({ isActive }) => `${styles.drawerLink} ${isActive ? styles.drawerLinkActive : ''}`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.drawerIcon}>
                  <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M2.5 13.5c0-3.037 2.462-5.5 5.5-5.5s5.5 2.463 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                {t('nav.profile')}
              </NavLink>
              {user.is_admin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `${styles.drawerLink} ${styles.drawerLinkAdmin} ${(isActive || fromAdmin) ? styles.drawerLinkActive : ''}`}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.drawerIcon}>
                    <path d="M8 1l1.854 3.757L14 5.528l-3 2.924.708 4.124L8 10.5l-3.708 2.076L5 8.452 2 5.528l4.146-.771L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                  </svg>
                  {t('nav.admin')}
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className={styles.drawerFooter}>
          {user ? (
            <>
              <div className={styles.drawerUser}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1.5 12c0-3.037 2.462-5.5 5.5-5.5s5.5 2.463 5.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                <span>{user.username}</span>
              </div>
              <button type="button" className={styles.drawerSignOut} onClick={handleLogout}>
                {t('nav.signOut')}
              </button>
            </>
          ) : (
            <div className={styles.drawerAuthBtns}>
              <Button variant="ghost" size="sm" onClick={() => { navigate('/login'); setMenuOpen(false) }}>{t('nav.signIn')}</Button>
              <Button variant="primary" size="sm" onClick={() => { navigate('/register'); setMenuOpen(false) }}>{t('nav.signUp')}</Button>
            </div>
          )}
        </div>
      </div>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
