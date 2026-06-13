import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { applicationsApi } from '@/shared/api/services'
import type { ApplicationWithRole, ApplicationStatus } from '@/shared/types/api'
import { Spinner } from '@/shared/ui/Spinner'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { formatDate } from '@/shared/utils/date'
import styles from './MyApplicationsPage.module.css'

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending:   'Pending',
  accepted:  'Accepted',
  rejected:  'Rejected',
  withdrawn: 'Withdrawn',
}

const STATUS_CLASS: Record<ApplicationStatus, string> = {
  pending:   styles.statusPending,
  accepted:  styles.statusAccepted,
  rejected:  styles.statusRejected,
  withdrawn: styles.statusWithdrawn,
}

export function MyApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    applicationsApi.listMine()
      .then(r => setApplications(r.items ?? []))
      .catch(() => setError('Failed to load applications'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner center />
  if (error) return <Alert type="error">{error}</Alert>

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>My Applications</h1>

      {applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Apply to open roles in projects to see them here"
        />
      ) : (
        <div className={styles.list}>
          {applications.map(app => (
            <div key={app.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardMeta}>
                  <Link to={`/projects/${app.project_id}`} state={{ from: 'my-applications' }} className={styles.projectTitle}>
                    {app.project_title}
                  </Link>
                  <span className={styles.roleName}>{app.role_name}</span>
                </div>
                <div className={styles.right}>
                  <span className={`${styles.status} ${STATUS_CLASS[app.status]}`}>
                    {STATUS_LABEL[app.status]}
                  </span>
                  <span className={styles.date}>{formatDate(app.created_at)}</span>
                </div>
              </div>

              {app.message && (
                <p className={styles.message}>{app.message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
