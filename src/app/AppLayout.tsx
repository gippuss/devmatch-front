import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/shared/ui/Button'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { user, logout } = useAuth()
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
              Projects
            </NavLink>
            {user && (
              <>
                <NavLink
                  to="/my-projects"
                  className={({ isActive }) => `${styles.link} ${(isActive || fromMyProjects) ? styles.active : ''}`}
                >
                  My Projects
                </NavLink>
                <NavLink
                  to="/my-applications"
                  className={({ isActive }) => `${styles.link} ${(isActive || fromMyApplications) ? styles.active : ''}`}
                >
                  My Applications
                </NavLink>
                <NavLink
                  to="/me"
                  className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                >
                  Profile
                </NavLink>
                {user.is_admin && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => `${styles.link} ${styles.adminLink} ${(isActive || fromAdmin) ? styles.active : ''}`}
                  >
                    Admin
                  </NavLink>
                )}
              </>
            )}
          </div>
          <div className={styles.actions}>
            {user ? (
              <div className={styles.user}>
                <span className={styles.username}>{user.username}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>Sign out</Button>
              </div>
            ) : (
              <div className={styles.authBtns}>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>Sign up</Button>
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
