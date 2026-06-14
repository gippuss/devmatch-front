import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '@/shared/api/services'
import type { Project, ProjectStatus } from '@/shared/types/api'
import { Spinner } from '@/shared/ui/Spinner'
import { Alert } from '@/shared/ui/Alert'
import { ConfirmDeleteModal } from '@/shared/ui/ConfirmDeleteModal'
import { isApiException } from '@/shared/api/error'
import { formatDate } from '@/shared/utils/date'
import { useLocale } from '@/shared/i18n/LocaleContext'
import styles from './AdminPage.module.css'

function StatusBadge({ status, label }: { status: ProjectStatus; label: string }) {
  const cls =
    status === 'recruiting' ? styles.badgeRecruiting
    : status === 'completed' ? styles.badgeCompleted
    : status === 'banned' ? styles.badgeBanned
    : styles.badgeDraft

  const dot =
    status === 'recruiting' ? '#22C55E'
    : status === 'completed' ? '#F59E0B'
    : status === 'banned' ? '#EF4444'
    : '#94A3B8'

  return (
    <span className={cls}>
      <svg width="6" height="6" viewBox="0 0 6 6" fill={dot}><circle cx="3" cy="3" r="3" /></svg>
      {label}
    </span>
  )
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function BanModal({ project, onClose, onBanned, t }: {
  project: Project
  onClose: () => void
  onBanned: (updated: Project) => void
  t: (key: string) => string
}) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { textareaRef.current?.focus() }, [])

  async function handleBan() {
    if (reason.trim().length < 5) { setError(t('admin.banReasonMin') || 'Reason must be at least 5 characters'); return }
    setLoading(true)
    setError('')
    try {
      const updated = await adminApi.banProject(project.id, reason.trim())
      onBanned(updated)
    } catch (e) {
      setError(isApiException(e) ? e.message : t('admin.failedToBan'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>
        <h3 className={styles.modalTitle}>{t('admin.banProject')}</h3>
        <p className={styles.modalSub}>
          <strong>"{project.title}"</strong> {t('admin.banSub')}
        </p>

        {error && <Alert type="error">{error}</Alert>}

        <div className={styles.modalField}>
          <label className={styles.modalLabel}>{t('admin.banReason')}</label>
          <textarea
            ref={textareaRef}
            className={styles.modalTextarea}
            rows={4}
            placeholder={t('admin.banReasonPlaceholder')}
            value={reason}
            onChange={e => setReason(e.target.value)}
            maxLength={500}
          />
          <span className={styles.charCount}>{reason.length}/500</span>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.modalCancel} onClick={onClose}>{t('admin.modalCancel')}</button>
          <button type="button" className={styles.modalBanBtn} onClick={handleBan} disabled={loading}>
            {loading ? t('admin.banning') : t('admin.banBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminPage() {
  const { t } = useLocale()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [banTarget, setBanTarget] = useState<Project | null>(null)
  const [unbanning, setUnbanning] = useState<number | null>(null)
  const [reviewing, setReviewing] = useState<number | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Project | null>(null)
  const [rejectNewBanReason, setRejectNewBanReason] = useState('')
  const [rejectLoading, setRejectLoading] = useState(false)

  const projectToDelete = projects.find(p => p.id === confirmDeleteId) ?? null

  const statusLabel: Record<ProjectStatus, string> = {
    draft: t('status.draft'),
    recruiting: t('status.recruiting'),
    completed: t('status.completed'),
    banned: t('status.banned'),
  }

  useEffect(() => {
    adminApi.listProjects({ limit: 100 })
      .then(r => setProjects(r.items ?? []))
      .catch(() => setError(t('admin.failedToDelete')))
      .finally(() => setLoading(false))
  }, [t])

  const filtered = useMemo(() => {
    let list = projects
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.owner?.username?.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      )
    }
    return list
  }, [projects, search, statusFilter])

  const counts = useMemo(() => ({
    all: projects.length,
    recruiting: projects.filter(p => p.status === 'recruiting').length,
    draft: projects.filter(p => p.status === 'draft').length,
    completed: projects.filter(p => p.status === 'completed').length,
    banned: projects.filter(p => p.status === 'banned').length,
    pending: projects.filter(p => p.appeal_status === 'pending').length,
  }), [projects])

  function updateProject(updated: Project) {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  async function handleDelete() {
    if (!confirmDeleteId) return
    setDeleting(true)
    try {
      await adminApi.deleteProject(confirmDeleteId)
      setProjects(prev => prev.filter(p => p.id !== confirmDeleteId))
      setConfirmDeleteId(null)
    } catch (e) {
      if (isApiException(e)) setError(e.message)
      else setError(t('admin.failedToDelete'))
    } finally {
      setDeleting(false)
    }
  }

  async function handleUnban(project: Project) {
    setUnbanning(project.id)
    try {
      const updated = await adminApi.unbanProject(project.id)
      updateProject(updated)
    } catch (e) {
      setError(isApiException(e) ? e.message : t('admin.failedToUnban'))
    } finally {
      setUnbanning(null)
    }
  }

  async function handleApproveAppeal(project: Project) {
    setReviewing(project.id)
    try {
      const updated = await adminApi.reviewAppeal(project.id, true)
      updateProject(updated)
    } catch (e) {
      setError(isApiException(e) ? e.message : t('admin.failedToApproveAppeal'))
    } finally {
      setReviewing(null)
    }
  }

  async function handleRejectAppeal() {
    if (!rejectTarget) return
    setRejectLoading(true)
    try {
      const updated = await adminApi.reviewAppeal(rejectTarget.id, false, rejectNewBanReason)
      updateProject(updated)
      setRejectTarget(null)
      setRejectNewBanReason('')
    } catch (e) {
      setError(isApiException(e) ? e.message : t('admin.failedToRejectAppeal'))
    } finally {
      setRejectLoading(false)
    }
  }

  if (loading) return <Spinner center />

  return (
    <div className={styles.page}>
      {projectToDelete && (
        <ConfirmDeleteModal
          title={t('admin.deleteTitle')}
          highlight={projectToDelete.title}
          description={t('admin.deleteDesc')}
          deleting={deleting}
          onConfirm={handleDelete}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}

      {banTarget && (
        <BanModal
          project={banTarget}
          onClose={() => setBanTarget(null)}
          onBanned={updated => { updateProject(updated); setBanTarget(null) }}
          t={t}
        />
      )}

      {/* Reject appeal modal */}
      {rejectTarget && (
        <div className={styles.overlay} onClick={() => { setRejectTarget(null); setRejectNewBanReason('') }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h3 className={styles.modalTitle}>{t('admin.rejectAppealTitle')}</h3>
            <p className={styles.modalSub}>
              {t('admin.rejectAppealSub').replace('{{owner}}', rejectTarget.owner?.username ?? '')}
            </p>
            {rejectTarget.appeal_comment && (
              <div className={styles.ownerAppealComment}>
                <span className={styles.ownerAppealCommentLabel}>{t('admin.ownerMsg')}</span>
                <p>{rejectTarget.appeal_comment}</p>
              </div>
            )}
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>{t('admin.updatedBanReason')}</label>
              <textarea
                className={styles.modalTextarea}
                rows={2}
                placeholder={rejectTarget.ban_reason || t('admin.keepCurrentReason')}
                value={rejectNewBanReason}
                onChange={e => setRejectNewBanReason(e.target.value)}
                maxLength={500}
                autoFocus
              />
              <span className={styles.charCount}>{rejectNewBanReason.length}/500</span>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.modalCancel} onClick={() => { setRejectTarget(null); setRejectNewBanReason('') }}>{t('admin.modalCancel')}</button>
              <button type="button" className={styles.modalBanBtn} onClick={handleRejectAppeal} disabled={rejectLoading}>
                {rejectLoading ? t('admin.rejecting') : t('admin.rejectAppealBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.adminBadge}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>{t('admin.title')}</h1>
            <p className={styles.subtitle}>{t('admin.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className={styles.statsBar}>
        <button type="button" className={`${styles.stat} ${styles.blue} ${statusFilter === 'all' ? styles.statActive : ''}`} onClick={() => setStatusFilter('all')} aria-pressed={statusFilter === 'all'}>
          <div className={styles.statTop}>
            <span className={styles.statValue}>{counts.all}</span>
            <div className={styles.statIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            </div>
          </div>
          <div className={styles.statBottom}><span className={styles.statLabel}>{t('admin.statTotal')}</span></div>
        </button>

        <button type="button" className={`${styles.stat} ${styles.green} ${statusFilter === 'recruiting' ? styles.statActive : ''}`} onClick={() => setStatusFilter(statusFilter === 'recruiting' ? 'all' : 'recruiting')} aria-pressed={statusFilter === 'recruiting'}>
          <div className={styles.statTop}>
            <span className={styles.statValue}>{counts.recruiting}</span>
            <div className={styles.statIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <div className={styles.statBottom}><span className={styles.statLabel}>{t('admin.statRecruiting')}</span></div>
        </button>

        <button type="button" className={`${styles.stat} ${styles.amber} ${statusFilter === 'completed' ? styles.statActive : ''}`} onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')} aria-pressed={statusFilter === 'completed'}>
          <div className={styles.statTop}>
            <span className={styles.statValue}>{counts.completed}</span>
            <div className={styles.statIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <div className={styles.statBottom}><span className={styles.statLabel}>{t('admin.statCompleted')}</span></div>
        </button>

        <button type="button" className={`${styles.stat} ${styles.slate} ${statusFilter === 'draft' ? styles.statActive : ''}`} onClick={() => setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft')} aria-pressed={statusFilter === 'draft'}>
          <div className={styles.statTop}>
            <span className={styles.statValue}>{counts.draft}</span>
            <div className={styles.statIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
          </div>
          <div className={styles.statBottom}><span className={styles.statLabel}>{t('admin.statDraft')}</span></div>
        </button>

        <button type="button" className={`${styles.stat} ${styles.red} ${statusFilter === 'banned' ? styles.statActive : ''}`} onClick={() => setStatusFilter(statusFilter === 'banned' ? 'all' : 'banned')} aria-pressed={statusFilter === 'banned'}>
          <div className={styles.statTop}>
            <span className={styles.statValue}>{counts.banned}</span>
            <div className={styles.statIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            </div>
          </div>
          <div className={styles.statBottom}>
            <span className={styles.statLabel}>{t('admin.statBanned')}</span>
            {counts.pending > 0 && (
              <span className={styles.appealBadge}>
                {counts.pending === 1
                  ? t('admin.appealSuffix').replace('{{count}}', String(counts.pending))
                  : t('admin.appealsSuffix').replace('{{count}}', String(counts.pending))}
              </span>
            )}
          </div>
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </span>
          <input
            className={styles.searchInput}
            type="search"
            placeholder={t('admin.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label={t('admin.searchLabel')}
          />
        </div>
        {statusFilter !== 'all' && (
          <button type="button" className={styles.clearFilter} onClick={() => setStatusFilter('all')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            {t('admin.clearFilter')}
          </button>
        )}
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <p className={styles.emptyTitle}>{t('admin.emptyTitle')}</p>
            <p className={styles.emptyDesc}>
              {search
                ? t('admin.emptyDescSearch').replace('{{query}}', search)
                : t('admin.emptyDescFilter')}
            </p>
          </div>
        ) : (
          <table className={styles.table} role="table" aria-label={t('admin.searchLabel')}>
            <thead>
              <tr>
                <th className={styles.colTitle}>{t('admin.colProject')}</th>
                <th className={styles.colOwner}>{t('admin.colOwner')}</th>
                <th className={styles.colStatus}>{t('admin.colStatus')}</th>
                <th className={styles.colApps}>{t('admin.colApplications')}</th>
                <th className={styles.colDate}>{t('admin.colCreated')}</th>
                <th className={styles.colActions} aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(project => (
                <tr key={project.id} className={project.status === 'banned' ? styles.rowBanned : ''}>
                  <td className={styles.colTitle}>
                    <Link to={`/projects/${project.id}`} state={{ from: 'admin' }} className={styles.projectTitle}>
                      {project.title}
                    </Link>
                    {project.appeal_status === 'pending' && (
                      <span className={styles.appealPendingBadge}>{t('admin.appealPending')}</span>
                    )}
                    {(project.tags ?? []).length > 0 && (
                      <div className={styles.projectTags}>
                        {project.tags.slice(0, 3).map(tg => <span key={tg.id} className="tag-chip">{tg.name}</span>)}
                        {project.tags.length > 3 && <span className="tag-chip">+{project.tags.length - 3}</span>}
                      </div>
                    )}
                  </td>
                  <td className={styles.colOwner}>
                    <div className={styles.ownerCell}>
                      <div className={styles.ownerAvatar}>
                        {project.owner?.avatar_url
                          ? <img src={project.owner.avatar_url} alt={project.owner.username} />
                          : getInitials(project.owner?.username ?? '?')}
                      </div>
                      <span className={styles.ownerName}>{project.owner?.username ?? '—'}</span>
                    </div>
                  </td>
                  <td className={styles.colStatus}>
                    <StatusBadge status={project.status} label={statusLabel[project.status]} />
                  </td>
                  <td className={styles.colApps}>
                    <div className={styles.appsCell}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                      {project.applications_count ?? 0}
                    </div>
                  </td>
                  <td className={styles.colDate}>{formatDate(project.created_at)}</td>
                  <td className={styles.colActions}>
                    <div className={styles.actionBtns}>
                      {project.appeal_status === 'pending' && (
                        <>
                          <button
                            type="button"
                            className={styles.approveBtn}
                            onClick={() => handleApproveAppeal(project)}
                            disabled={reviewing === project.id}
                            title={t('admin.approveTitle')}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </button>
                          <button
                            type="button"
                            className={styles.rejectBtn}
                            onClick={() => { setRejectTarget(project); setRejectNewBanReason('') }}
                            title={t('admin.rejectTitle')}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </>
                      )}
                      {project.appeal_status !== 'pending' && (
                        project.status !== 'banned' ? (
                          <button
                            type="button"
                            className={styles.banBtn}
                            onClick={() => setBanTarget(project)}
                            title={t('admin.banTitle')}
                            aria-label={`${t('admin.banTitle')} ${project.title}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`${styles.banBtn} ${styles.banBtnActive}`}
                            onClick={() => handleUnban(project)}
                            disabled={unbanning === project.id}
                            title={t('admin.unbanTitle')}
                            aria-label={`${t('admin.unbanTitle')} ${project.title}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => setConfirmDeleteId(project.id)}
                        aria-label={`${t('admin.deleteTitle2')} ${project.title}`}
                        title={t('admin.deleteTitle2')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
