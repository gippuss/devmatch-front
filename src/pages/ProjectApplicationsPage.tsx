import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { projectsApi, applicationsApi, adminApi } from '@/shared/api/services'
import type { ApplicationWithApplicant, Project } from '@/shared/types/api'
import { Spinner } from '@/shared/ui/Spinner'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { isApiException } from '@/shared/api/error'
import { APPLICATION_STATUS_LABEL } from '@/shared/utils/constants'
import { formatDate } from '@/shared/utils/date'
import styles from './ProjectApplicationsPage.module.css'

function statusBadge(status: ApplicationWithApplicant['status']) {
  const map = {
    pending: 'badge badge-warning',
    accepted: 'badge badge-success',
    rejected: 'badge badge-danger',
    withdrawn: 'badge badge-default',
  }
  return map[status]
}

export function ProjectApplicationsPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from

  const [project, setProject] = useState<Project | null>(null)
  const [applications, setApplications] = useState<ApplicationWithApplicant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<number | null>(null)

  const isAdminView = from === 'admin'

  useEffect(() => {
    if (!id) return
    const projectId = Number(id)
    Promise.all([
      projectsApi.getById(projectId),
      isAdminView
        ? adminApi.listProjectApplications(projectId)
        : projectsApi.getApplications(projectId),
    ]).then(([p, a]) => {
      setProject(p)
      setApplications((a as { items: ApplicationWithApplicant[] }).items ?? [])
    }).catch(() => setError('Failed to load applications'))
      .finally(() => setLoading(false))
  }, [id, isAdminView])

  async function handleStatus(appId: number, status: 'accepted' | 'rejected') {
    setUpdating(appId)
    try {
      const updated = await applicationsApi.updateStatus(appId, status)
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, ...updated } : a))
    } catch (e) {
      if (isApiException(e)) setError(e.message)
      else setError('Failed to update application')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <Spinner center />

  const roleMap = new Map<number, string>()
  if (project?.roles) {
    for (const pr of project.roles) {
      roleMap.set(pr.id, pr.grade ? `${pr.role_name} · ${pr.grade}` : pr.role_name)
    }
  }

  const pending = applications.filter(a => a.status === 'pending')
  const rest = applications.filter(a => a.status !== 'pending')

  return (
    <div className={styles.page}>
      <div className={styles.backRow}>
        <Link
          to={`/projects/${id}`}
          state={{ from: from ?? null }}
          className={styles.backLink}
        >
          ← {project?.title ?? 'Project'}
        </Link>
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Applications</h1>
          {project?.title && <p className={styles.projectName}>{project.title}</p>}
        </div>
        <span className={styles.count}>{applications.length} total</span>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {applications.length === 0 ? (
        <EmptyState title="No applications yet" description="Share your project to attract applicants" />
      ) : (
        <>
          {pending.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>Pending review ({pending.length})</h2>
              <div className={styles.list}>
                {pending.map(app => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    roleName={roleMap.get(app.project_role_id) ?? `Role #${app.project_role_id}`}
                    onAccept={() => handleStatus(app.id, 'accepted')}
                    onReject={() => handleStatus(app.id, 'rejected')}
                    updating={updating === app.id}
                  />
                ))}
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>Reviewed ({rest.length})</h2>
              <div className={styles.list}>
                {rest.map(app => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    roleName={roleMap.get(app.project_role_id) ?? `Role #${app.project_role_id}`}
                    updating={false}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function ApplicationCard({
  app,
  roleName,
  onAccept,
  onReject,
  updating,
}: {
  app: ApplicationWithApplicant
  roleName: string
  onAccept?: () => void
  onReject?: () => void
  updating: boolean
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <Link to={`/users/${app.applicant?.id}`} className={styles.applicant}>
          <span className="avatar avatar-md">
            {app.applicant?.username?.[0]?.toUpperCase() ?? '?'}
          </span>
          <div>
            <div className={styles.applicantName}>{app.applicant?.username}</div>
            <div className={styles.applicantEmail}>{app.applicant?.email}</div>
          </div>
        </Link>
        <div className={styles.meta}>
          <span className={statusBadge(app.status)}>{APPLICATION_STATUS_LABEL[app.status]}</span>
          <span className={styles.role}>{roleName}</span>
          <span className={styles.date}>{formatDate(app.created_at)}</span>
        </div>
      </div>

      {app.message && (
        <p className={styles.message}>{app.message}</p>
      )}

      {(app.applicant?.skills ?? []).length > 0 && (
        <div className={styles.skills}>
          {app.applicant.skills.map(s => (
            <span key={s.id} className="tag-chip">{s.name}</span>
          ))}
        </div>
      )}

      {app.status === 'pending' && (onAccept || onReject) && (
        <div className={styles.cardActions}>
          <Button
            variant="ghost"
            loading={updating}
            onClick={onReject}
          >
            Reject
          </Button>
          <Button
            variant="primary"
            loading={updating}
            onClick={onAccept}
          >
            Accept
          </Button>
        </div>
      )}
    </div>
  )
}
