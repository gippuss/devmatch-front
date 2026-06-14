import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi, dictionariesApi } from '@/shared/api/services'
import type { Project, Tag } from '@/shared/types/api'
import { Spinner } from '@/shared/ui/Spinner'
import { Input } from '@/shared/ui/Input'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Alert } from '@/shared/ui/Alert'
import { formatDate } from '@/shared/utils/date'
import { useLocale } from '@/shared/i18n/LocaleContext'
import styles from './ProjectsPage.module.css'

export function ProjectsPage() {
  const { t } = useLocale()
  const [projects, setProjects] = useState<Project[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await projectsApi.list({
        q: query || undefined,
        status: 'recruiting',
        tag_ids: selectedTagIds.length ? selectedTagIds.join(',') : undefined,
        limit: 50,
      })
      setProjects(res.items ?? [])
    } catch {
      setError(t('projects.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [query, selectedTagIds, t])

  useEffect(() => {
    dictionariesApi.getSystemTags().then(r => setTags(r.items ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(fetchProjects, 300)
    return () => clearTimeout(timer)
  }, [fetchProjects])

  function toggleTag(id: number) {
    setSelectedTagIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('projects.title')}</h1>
          <p className={styles.subtitle}>{t('projects.subtitle')}</p>
        </div>
      </div>

      <div className={styles.filters}>
        <Input
          placeholder={t('projects.searchPlaceholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className={styles.search}
        />
      </div>

      {tags.length > 0 && (
        <div className={styles.tags}>
          {tags.map(tag => (
            <button
              key={tag.id}
              className={`tag-chip ${selectedTagIds.includes(tag.id) ? 'active' : ''}`}
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <Spinner center />
      ) : projects.length === 0 ? (
        <EmptyState
          title={t('projects.emptyTitle')}
          description={t('projects.emptyDesc')}
        />
      ) : (
        <div className={styles.grid}>
          {projects.map(project => {
            const roles = project.roles ?? []
            const openRoles = roles.filter(r => r.slots_filled < r.slots_total)
            const openCount = openRoles.length
            const openLabel = openCount === 1
              ? t('projects.openRole').replace('{{count}}', String(openCount))
              : t('projects.openRoles').replace('{{count}}', String(openCount))
            return (
              <Link key={project.id} to={`/projects/${project.id}`} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.date}>{formatDate(project.created_at)}</span>
                  {openCount > 0 && (
                    <span className={styles.rolesChip}>
                      {openLabel}
                    </span>
                  )}
                </div>
                <h2 className={styles.cardTitle}>{project.title}</h2>
                <p className={styles.cardDesc}>{project.description}</p>
                <div className={styles.cardFooter}>
                  <div className={styles.tagList}>
                    {(project.tags ?? []).slice(0, 4).map(tg => (
                      <span key={tg.id} className="tag-chip">{tg.name}</span>
                    ))}
                    {(project.tags ?? []).length > 4 && (
                      <span className="tag-chip">+{project.tags.length - 4}</span>
                    )}
                  </div>
                  <div className={styles.owner}>
                    <span className="avatar avatar-sm">{project.owner?.username?.[0]?.toUpperCase() ?? '?'}</span>
                    <span>{project.owner?.username}</span>
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
