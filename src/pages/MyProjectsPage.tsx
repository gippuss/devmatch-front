import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { projectsApi } from '@/shared/api/services'
import type { Project, ProjectStatus } from '@/shared/types/api'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { isApiException } from '@/shared/api/error'
import { formatDate } from '@/shared/utils/date'
import { ConfirmDeleteModal } from '@/shared/ui/ConfirmDeleteModal'
import { useLocale } from '@/shared/i18n/LocaleContext'
import styles from './MyProjectsPage.module.css'

function statusBadgeClass(status: ProjectStatus): string {
  const map: Record<ProjectStatus, string> = {
    draft: 'badge badge-default',
    recruiting: 'badge badge-success',
    completed: 'badge badge-warning',
    banned: 'badge badge-danger',
  }
  return map[status] ?? 'badge badge-default'
}

export function MyProjectsPage() {
  const navigate = useNavigate()
  const { t } = useLocale()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const projectToDelete = projects.find(p => p.id === confirmDeleteId) ?? null

  const statusLabel: Record<ProjectStatus, string> = {
    draft: t('status.draft'),
    recruiting: t('status.recruiting'),
    completed: t('status.completed'),
    banned: t('status.banned'),
  }

  useEffect(() => {
    projectsApi.listMine()
      .then(r => setProjects(r.items ?? []))
      .catch(() => setError(t('myProjects.failedToLoad')))
      .finally(() => setLoading(false))
  }, [t])

  async function handleDelete() {
    if (!confirmDeleteId) return
    const id = confirmDeleteId
    setDeletingId(id)
    try {
      await projectsApi.delete(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      setConfirmDeleteId(null)
    } catch (e) {
      if (isApiException(e)) setError(e.message)
      else setError(t('myProjects.failedToDelete'))
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <Spinner center />

  return (
    <div className={styles.page}>
      {projectToDelete && (
        <ConfirmDeleteModal
          title={t('myProjects.deleteTitle')}
          highlight={projectToDelete.title}
          description={t('myProjects.deleteDesc')}
          deleting={deletingId === confirmDeleteId}
          onConfirm={handleDelete}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('myProjects.title')}</h1>
          <p className={styles.subtitle}>{t('myProjects.subtitle')}</p>
        </div>
        {projects.length > 0 && (
          <Button variant="primary" size="sm" onClick={() => navigate('/projects/new', { state: { from: 'my-projects' } })}>
            {t('common.newProject')}
          </Button>
        )}
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {projects.length === 0 ? (
        <EmptyState
          title={t('myProjects.emptyTitle')}
          description={t('myProjects.emptyDesc')}
          action={<Button onClick={() => navigate('/projects/new', { state: { from: 'my-projects' } })}>{t('myProjects.createBtn')}</Button>}
        />
      ) : (
        <div className={styles.grid}>
          {projects.map(project => {
            const isBanned = project.status === 'banned'
            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                state={{ from: 'my-projects' }}
                className={`${styles.card} ${isBanned ? styles.cardBanned : ''}`}
              >
                <div className={styles.cardHeader}>
                  <span className={statusBadgeClass(project.status)}>
                    {statusLabel[project.status]}
                  </span>
                  <span className={styles.date}>{formatDate(project.created_at)}</span>
                </div>

                <span className={styles.cardTitle}>{project.title}</span>

                {isBanned && (
                  <div className={styles.bannedNotice}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                    <span>
                      {project.appeal_status === 'pending'
                        ? t('myProjects.appealUnderReview')
                        : project.appeal_status === 'rejected'
                        ? t('myProjects.appealRejected')
                        : t('myProjects.bannedNotice')}
                    </span>
                  </div>
                )}

                {!isBanned && <p className={styles.cardDesc}>{project.description}</p>}

                {(project.tags ?? []).length > 0 && !isBanned && (
                  <div className={styles.tagList}>
                    {project.tags.slice(0, 4).map(tg => (
                      <span key={tg.id} className="tag-chip">{tg.name}</span>
                    ))}
                    {project.tags.length > 4 && (
                      <span className="tag-chip">+{project.tags.length - 4}</span>
                    )}
                  </div>
                )}

                <div className={styles.cardActions} onClick={e => { e.preventDefault(); e.stopPropagation() }}>
                  {!isBanned && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={e => { e.preventDefault(); e.stopPropagation(); navigate(`/projects/${project.id}/edit`, { state: { from: 'my-projects' } }) }}
                    >
                      {t('common.edit')}
                    </Button>
                  )}
                  {!isBanned && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={e => { e.preventDefault(); e.stopPropagation(); navigate(`/projects/${project.id}/applications`, { state: { from: 'my-projects' } }) }}
                    >
                      {t('common.applications')}
                    </Button>
                  )}
                  <div className={styles.deleteWrap}>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(project.id) }}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
