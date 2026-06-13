import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usersApi } from '@/shared/api/services'
import type { User } from '@/shared/types/api'
import { Spinner } from '@/shared/ui/Spinner'
import { Alert } from '@/shared/ui/Alert'
import { formatDate } from '@/shared/utils/date'
import { BACKEND_URL } from '@/shared/utils/constants'
import styles from './UserProfilePage.module.css'

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    usersApi.getProfile(Number(id))
      .then(setUser)
      .catch(() => setError('User not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner center />
  if (error) return <Alert type="error">{error}</Alert>
  if (!user) return null

  return (
    <div className={styles.page}>
      <div className={styles.back}>
        <Link to={-1 as unknown as string} className={styles.backLink}>← Back</Link>
      </div>

      <div className={styles.card}>
        <div className={styles.avatarWrap}>
          {user.avatar_url ? (
            <img
              src={user.avatar_url.startsWith('/uploads') ? `${BACKEND_URL}${user.avatar_url}` : user.avatar_url}
              alt={user.username}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatar}>
              {user.username?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>

        <div className={styles.info}>
          <h1 className={styles.username}>{user.username}</h1>

          {user.bio ? (
            <p className={styles.bio}>{user.bio}</p>
          ) : (
            <p className={styles.bioEmpty}>No bio provided.</p>
          )}

          <div className={styles.meta}>
            <span className={styles.joinDate}>Joined {formatDate(user.created_at)}</span>
          </div>

          {(user.skills ?? []).length > 0 && (
            <div className={styles.skillsSection}>
              <div className={styles.skillsLabel}>Skills</div>
              <div className={styles.skills}>
                {user.skills.map(s => (
                  <span key={s.id} className="tag-chip">{s.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
