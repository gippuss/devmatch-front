import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { projectsApi, applicationsApi, adminApi, appealApi } from '@/shared/api/services'
import type { Application, ApplicationWithRole } from '@/shared/types/api'
import type { Project, ProjectRole } from '@/shared/types/api'
import { useAuth } from '@/features/auth/AuthContext'
import { useLocale } from '@/shared/i18n/LocaleContext'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { Alert } from '@/shared/ui/Alert'
import { FormField } from '@/shared/ui/FormField'
import { Textarea } from '@/shared/ui/Textarea'
import { EmptyState } from '@/shared/ui/EmptyState'
import { isApiException } from '@/shared/api/error'
import { formatDate } from '@/shared/utils/date'
import type { ProjectStatus } from '@/shared/types/api'
import { ConfirmDeleteModal } from '@/shared/ui/ConfirmDeleteModal'
import styles from './ProjectDetailsPage.module.css'

function statusBadgeClass(status: ProjectStatus): string {
  const map: Record<ProjectStatus, string> = {
    draft: 'badge badge-default',
    recruiting: 'badge badge-success',
    completed: 'badge badge-warning',
    banned: 'badge badge-danger',
  }
  return map[status] ?? 'badge badge-default'
}

function ApplyModal({
  role,
  onClose,
  onSuccess,
}: {
  role: ProjectRole
  onClose: () => void
  onSuccess: (roleId: number) => void
}) {
  const { t } = useLocale()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleApply() {
    if (message.trim().length < 5) {
      setError(t('projectDetail.messageMin'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await applicationsApi.apply(role.id, message.trim())
      onSuccess(role.id)
    } catch (e) {
      if (isApiException(e)) setError(e.message)
      else setError(t('projectDetail.failedToApply'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>
          {t('projectDetail.applyFor').replace('{{roleName}}', `${role.role_name}${role.grade ? ` · ${role.grade}` : ''}`)}
        </h3>
        <p className={styles.modalSub}>{t('projectDetail.applySubtitle')}</p>

        {error && <Alert type="error">{error}</Alert>}

        <FormField label={t('projectDetail.applyMessage')} hint={t('projectDetail.applyMessageHint')}>
          <Textarea
            rows={5}
            placeholder={t('projectDetail.applyMessagePlaceholder')}
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={1000}
          />
        </FormField>

        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button loading={loading} onClick={handleApply}>{t('projectDetail.sendApplication')}</Button>
        </div>
      </div>
    </div>
  )
}


export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { t } = useLocale()
  const from = (location.state as { from?: string })?.from
  const backTo = from === 'my-projects'
    ? '/my-projects'
    : from === 'my-applications'
    ? '/my-applications'
    : from === 'admin'
    ? '/admin'
    : '/projects'
  const backLabel = backTo === '/my-projects'
    ? t('projectDetail.back.myProjects')
    : backTo === '/my-applications'
    ? t('projectDetail.back.myApplications')
    : backTo === '/admin'
    ? t('projectDetail.back.admin')
    : t('projectDetail.back.projects')

  const [project, setProject] = useState<Project | null>(null)
  const [myApplications, setMyApplications] = useState<ApplicationWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [applyRole, setApplyRole] = useState<ProjectRole | null>(null)
  const [applySuccess, setApplySuccess] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [appealLoading, setAppealLoading] = useState(false)
  const [appealError, setAppealError] = useState('')
  const [appealComment, setAppealComment] = useState('')
  const [adminBanModal, setAdminBanModal] = useState(false)
  const [adminBanReason, setAdminBanReason] = useState('')
  const [adminBanLoading, setAdminBanLoading] = useState(false)
  const [adminBanError, setAdminBanError] = useState('')
  const [adminUnbanLoading, setAdminUnbanLoading] = useState(false)
  const [adminReviewLoading, setAdminReviewLoading] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectNewBanReason, setRejectNewBanReason] = useState('')
  const [rejectError, setRejectError] = useState('')
  const banTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    const fetches: [Promise<Project>, Promise<{ items: Application[] }> | Promise<null>] = [
      projectsApi.getById(Number(id)),
      user ? applicationsApi.listMine() : Promise.resolve(null),
    ]
    Promise.all(fetches).then(([p, apps]) => {
      setProject(p as Project)
      if (apps) setMyApplications((apps as { items: ApplicationWithRole[] }).items ?? [])
    })
      .catch(() => setError(t('projectDetail.projectNotFound')))
      .finally(() => setLoading(false))
  }, [id, user, t])

  const isOwner = user && project && user.id === project.owner_id
  const isAdmin = user?.is_admin ?? false
  const canManage = isOwner || isAdmin

  async function handleAdminBan() {
    if (!project) return
    if (adminBanReason.trim().length < 5) { setAdminBanError(t('projectDetail.banReasonMin')); return }
    setAdminBanLoading(true)
    setAdminBanError('')
    try {
      const updated = await adminApi.banProject(project.id, adminBanReason.trim())
      setProject(updated)
      setAdminBanModal(false)
      setAdminBanReason('')
    } catch (e) {
      setAdminBanError(isApiException(e) ? e.message : t('projectDetail.failedToBan'))
    } finally {
      setAdminBanLoading(false)
    }
  }

  async function handleAdminUnban() {
    if (!project) return
    setAdminUnbanLoading(true)
    try {
      const updated = await adminApi.unbanProject(project.id)
      setProject(updated)
    } catch (e) {
      setError(isApiException(e) ? e.message : t('projectDetail.failedToUnban'))
    } finally {
      setAdminUnbanLoading(false)
    }
  }

  async function handleAdminReviewAppeal(approve: boolean, newBanReason = '') {
    if (!project) return
    setAdminReviewLoading(true)
    try {
      const updated = await adminApi.reviewAppeal(project.id, approve, newBanReason)
      setProject(updated)
      setRejectModal(false)
      setRejectNewBanReason('')
    } catch (e) {
      setRejectError(isApiException(e) ? e.message : t('common.errorGeneric'))
    } finally {
      setAdminReviewLoading(false)
    }
  }

  async function handleSubmitAppeal() {
    if (!project) return
    setAppealLoading(true)
    setAppealError('')
    try {
      const updated = await appealApi.submit(project.id, appealComment.trim())
      setProject(updated)
      setAppealComment('')
    } catch (e) {
      setAppealError(isApiException(e) ? e.message : t('common.errorGeneric'))
    } finally {
      setAppealLoading(false)
    }
  }

  async function handleDelete() {
    if (!project) return
    setDeleting(true)
    try {
      if (isAdmin && !isOwner) {
        await adminApi.deleteProject(project.id)
      } else {
        await projectsApi.delete(project.id)
      }
      navigate(backTo)
    } catch (e) {
      if (isApiException(e)) setError(e.message)
      else setError(t('projectDetail.failedToDelete'))
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (loading) return <Spinner center />
  if (error) return <Alert type="error">{error}</Alert>
  if (!project) return null

  const roles = project.roles ?? []
  const canApply = user && !isOwner && project.status === 'recruiting'

  const statusLabel: Record<ProjectStatus, string> = {
    draft: t('status.draft'),
    recruiting: t('status.recruiting'),
    completed: t('status.completed'),
    banned: t('status.banned'),
  }

  return (
    <div className={styles.page}>
      {confirmDelete && project && (
        <ConfirmDeleteModal
          title={t('projectDetail.deleteProject')}
          highlight={project.title}
          description={t('projectDetail.deleteDesc')}
          deleting={deleting}
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(false)}
        />
      )}

      {/* Admin reject appeal modal */}
      {rejectModal && project && (
        <div className={styles.overlay} onClick={() => { setRejectModal(false); setRejectError(''); setRejectNewBanReason('') }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.banModalIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h3 className={styles.modalTitle}>{t('projectDetail.rejectAppealTitle')}</h3>
            <p className={styles.modalSub}>{t('projectDetail.rejectAppealSub')}</p>
            {rejectError && <Alert type="error">{rejectError}</Alert>}
            <div className={styles.banReasonField}>
              <label className={styles.banReasonLabel}>{t('projectDetail.updatedBanReason')}</label>
              <textarea
                className={styles.banReasonTextarea}
                rows={2}
                placeholder={project.ban_reason || t('projectDetail.keepCurrentReason')}
                value={rejectNewBanReason}
                onChange={e => setRejectNewBanReason(e.target.value)}
                maxLength={500}
                autoFocus
              />
              <span className={styles.banReasonCount}>{rejectNewBanReason.length}/500</span>
            </div>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => { setRejectModal(false); setRejectError(''); setRejectNewBanReason('') }}>{t('common.cancel')}</Button>
              <Button variant="danger" loading={adminReviewLoading} onClick={() => handleAdminReviewAppeal(false, rejectNewBanReason)}>{t('projectDetail.rejectAppeal')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin ban modal */}
      {adminBanModal && project && (
        <div className={styles.overlay} onClick={() => { setAdminBanModal(false); setAdminBanError('') }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.banModalIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            </div>
            <h3 className={styles.modalTitle}>{t('projectDetail.banProject')}</h3>
            <p className={styles.modalSub}>
              "<strong>{project.title}</strong>" {t('projectDetail.banSub')}
            </p>
            {adminBanError && <Alert type="error">{adminBanError}</Alert>}
            <div className={styles.banReasonField}>
              <label className={styles.banReasonLabel}>{t('projectDetail.banReason')}</label>
              <textarea
                ref={banTextareaRef}
                className={styles.banReasonTextarea}
                rows={4}
                placeholder={t('projectDetail.banReasonPlaceholder')}
                value={adminBanReason}
                onChange={e => setAdminBanReason(e.target.value)}
                maxLength={500}
                autoFocus
              />
              <span className={styles.banReasonCount}>{adminBanReason.length}/500</span>
            </div>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => { setAdminBanModal(false); setAdminBanError('') }}>{t('common.cancel')}</Button>
              <Button variant="danger" loading={adminBanLoading} onClick={handleAdminBan}>{t('projectDetail.banBtn')}</Button>
            </div>
          </div>
        </div>
      )}

      {applyRole && (
        <ApplyModal
          role={applyRole}
          onClose={() => setApplyRole(null)}
          onSuccess={(roleId) => {
            setApplyRole(null)
            setApplySuccess(true)
            setMyApplications(prev => [
              ...prev,
              { id: -1, user_id: 0, project_role_id: roleId, status: 'pending', message: '', created_at: '', role_name: '', project_id: 0, project_title: '' },
            ])
          }}
        />
      )}

      <div className={styles.back}>
        <Link to={backTo} className={styles.backLink}>← {backLabel}</Link>
      </div>

      <div className={styles.hero}>
        <div className={styles.heroMeta}>
          <span className={statusBadgeClass(project.status)}>
            {statusLabel[project.status]}
          </span>
          <span className={styles.date}>{formatDate(project.created_at)}</span>
        </div>
        <h1 className={styles.title}>{project.title}</h1>

        <div className={styles.ownerRow}>
          <span className={styles.ownerLabel}>by</span>
          <span className={styles.ownerName}>{project.owner?.username ?? 'Unknown'}</span>
        </div>

        {(project.tags ?? []).length > 0 && (
          <div className={styles.tags}>
            {project.tags.map(tg => (
              <span key={tg.id} className="tag-chip">{tg.name}</span>
            ))}
          </div>
        )}

        {canManage && (
          <div className={styles.ownerActions}>
            {isOwner && (
              <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${project.id}/edit`, { state: { from: from ?? null } })}>
                {t('projectDetail.edit')}
              </Button>
            )}
            {isOwner && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/projects/${project.id}/applications`, {
                  state: { from: from ?? null }
                })}
              >
                {t('projectDetail.applications')}
              </Button>
            )}
            {isAdmin && !isOwner && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/projects/${project.id}/applications`, {
                    state: { from: from ?? null }
                  })}
                >
                  {t('projectDetail.applications')}
                </Button>
                {project.status !== 'banned' ? (
                  <Button variant="danger" size="sm" onClick={() => { setAdminBanModal(true); setAdminBanError('') }}>
                    {t('common.ban')}
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" loading={adminUnbanLoading} onClick={handleAdminUnban}>
                    {t('common.unban')}
                  </Button>
                )}
              </>
            )}
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              {t('common.delete')}
            </Button>
          </div>
        )}

        {/* Ban banner */}
        {project.status === 'banned' && (isOwner || isAdmin) && (
          <div className={styles.banBanner}>
            <div className={styles.banBannerIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            </div>
            <div className={styles.banBannerBody}>
              <p className={styles.banBannerTitle}>{t('projectDetail.bannedTitle')}</p>
              {project.ban_reason && (
                <p className={styles.banBannerReason}>{project.ban_reason}</p>
              )}

              {isAdmin && !isOwner && project.appeal_status === 'pending' && (
                <div className={styles.adminAppealReview}>
                  <p className={styles.banBannerHint}>{t('projectDetail.ownerAppealed')}</p>
                  {project.appeal_comment && (
                    <div className={styles.appealCommentDisplay}>
                      <span className={styles.appealCommentLabel}>{t('projectDetail.ownerMsg')}</span>
                      <p className={styles.appealCommentText}>{project.appeal_comment}</p>
                    </div>
                  )}
                  <div className={styles.adminAppealBtns}>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={adminReviewLoading}
                      onClick={() => handleAdminReviewAppeal(true)}
                    >
                      {t('projectDetail.approveRestore')}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => { setRejectModal(true); setRejectError('') }}
                    >
                      {t('projectDetail.rejectAppeal')}
                    </Button>
                  </div>
                </div>
              )}

              {isOwner && (
                <>
                  {appealError && <Alert type="error">{appealError}</Alert>}

                  {project.appeal_status === 'none' || !project.appeal_status ? (
                    <div className={styles.banBannerActions}>
                      <p className={styles.banBannerHint}>{t('projectDetail.appealHint')}</p>
                      <textarea
                        className={styles.appealCommentTextarea}
                        rows={3}
                        placeholder={t('projectDetail.appealPlaceholder')}
                        value={appealComment}
                        onChange={e => setAppealComment(e.target.value)}
                        maxLength={1000}
                      />
                      <button type="button" className={styles.appealBtn} onClick={handleSubmitAppeal} disabled={appealLoading}>
                        {appealLoading ? t('common.submitting') : t('projectDetail.submitForReview')}
                      </button>
                    </div>
                  ) : project.appeal_status === 'pending' ? (
                    <div className={styles.banBannerActions}>
                      {project.appeal_comment && (
                        <div className={styles.appealCommentDisplay}>
                          <span className={styles.appealCommentLabel}>{t('projectDetail.appealOwnerMsg')}</span>
                          <p className={styles.appealCommentText}>{project.appeal_comment}</p>
                        </div>
                      )}
                      <p className={styles.appealStatus}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {t('projectDetail.appealSubmitted')}
                      </p>
                    </div>
                  ) : project.appeal_status === 'rejected' ? (
                    <div className={styles.banBannerActions}>
                      <p className={styles.appealRejected}>
                        {t('projectDetail.appealRejected')}
                      </p>
                      <textarea
                        className={styles.appealCommentTextarea}
                        rows={3}
                        placeholder={t('projectDetail.appealResubmitPlaceholder')}
                        value={appealComment}
                        onChange={e => setAppealComment(e.target.value)}
                        maxLength={1000}
                      />
                      <button type="button" className={styles.appealBtn} onClick={handleSubmitAppeal} disabled={appealLoading}>
                        {appealLoading ? t('common.submitting') : t('projectDetail.resubmitForReview')}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.description}>
          <h2 className={styles.sectionTitle}>{t('projectDetail.about')}</h2>
          <p className={styles.descText}>{project.description}</p>
        </div>

        <div className={styles.roles}>
          <h2 className={styles.sectionTitle}>{t('projectDetail.openRoles')}</h2>

          {applySuccess && (
            <div className={styles.applySuccess}>
              <Alert type="success">{t('projectDetail.applySuccess')}</Alert>
            </div>
          )}

          {roles.length === 0 ? (
            <EmptyState title={t('projectDetail.noRoles')} />
          ) : (
            <div className={styles.roleGrid}>
              {(() => {
                const appliedRoleIds = new Set(myApplications.map(a => a.project_role_id))
                return roles.map(pr => {
                  const free = pr.slots_total - pr.slots_filled
                  const pct = pr.slots_total > 0 ? (pr.slots_filled / pr.slots_total) * 100 : 0
                  const isFull = free === 0
                  const hasApplied = appliedRoleIds.has(pr.id)
                  return (
                    <div key={pr.id} className={styles.roleCard}>
                      <div className={styles.roleCardTop}>
                        <div className={styles.roleCardTitles}>
                          <div className={styles.roleName}>{pr.role_name}</div>
                          {pr.grade && <span className={styles.roleGrade}>{pr.grade}</span>}
                        </div>
                      </div>

                      <div className={styles.roleSlots}>
                        <div className={styles.roleSlotsRow}>
                          <span className={styles.roleSlotsText}>
                            {t('projectDetail.filled').replace('{{filled}}', String(pr.slots_filled)).replace('{{total}}', String(pr.slots_total))}
                          </span>
                          {isFull
                            ? <span className={styles.roleSlotsFull}>{t('projectDetail.noSlots')}</span>
                            : <span className={styles.roleSlotsText}>{t('projectDetail.open').replace('{{count}}', String(free))}</span>
                          }
                        </div>
                        <div className={styles.roleProgressTrack}>
                          <div
                            className={`${styles.roleProgressFill}${isFull ? ` ${styles.full}` : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {canApply && hasApplied && (
                        <span className={styles.appliedLabel}>{t('projectDetail.applied')}</span>
                      )}
                      {canApply && !hasApplied && !isFull && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => { setApplyRole(pr); setApplySuccess(false) }}
                        >
                          {t('common.apply')}
                        </Button>
                      )}
                      {canApply && !hasApplied && isFull && (
                        <span className={styles.noSlots}>{t('projectDetail.positionsFilled')}</span>
                      )}
                      {!user && (
                        <Link to="/login">
                          <Button variant="ghost" size="sm">{t('projectDetail.signInToApply')}</Button>
                        </Link>
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
