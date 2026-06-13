import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { projectsApi, applicationsApi, adminApi, appealApi } from '@/shared/api/services'
import type { Application, ApplicationWithRole } from '@/shared/types/api'
import type { Project, ProjectRole } from '@/shared/types/api'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/shared/ui/Button'
import { Spinner } from '@/shared/ui/Spinner'
import { Alert } from '@/shared/ui/Alert'
import { FormField } from '@/shared/ui/FormField'
import { Textarea } from '@/shared/ui/Textarea'
import { EmptyState } from '@/shared/ui/EmptyState'
import { isApiException } from '@/shared/api/error'
import { PROJECT_STATUS_LABEL } from '@/shared/utils/constants'
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
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleApply() {
    if (message.trim().length < 5) {
      setError('Message must be at least 5 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      await applicationsApi.apply(role.id, message.trim())
      onSuccess(role.id)
    } catch (e) {
      if (isApiException(e)) setError(e.message)
      else setError('Failed to apply')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Apply for: {role.role_name}{role.grade ? ` · ${role.grade}` : ''}</h3>
        <p className={styles.modalSub}>Tell the owner why you're a good fit</p>

        {error && <Alert type="error">{error}</Alert>}

        <FormField label="Message" hint="5–1000 characters">
          <Textarea
            rows={5}
            placeholder="I'd love to join because..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={1000}
          />
        </FormField>

        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={loading} onClick={handleApply}>Send application</Button>
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
  const from = (location.state as { from?: string })?.from
  const backTo = from === 'my-projects'
    ? '/my-projects'
    : from === 'my-applications'
    ? '/my-applications'
    : from === 'admin'
    ? '/admin'
    : '/projects'
  const backLabel = backTo === '/my-projects' ? 'My Projects' : backTo === '/my-applications' ? 'My Applications' : backTo === '/admin' ? 'Admin Panel' : 'Projects'

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
      .catch(() => setError('Project not found'))
      .finally(() => setLoading(false))
  }, [id, user])

  const isOwner = user && project && user.id === project.owner_id
  const isAdmin = user?.is_admin ?? false
  const canManage = isOwner || isAdmin

  async function handleAdminBan() {
    if (!project) return
    if (adminBanReason.trim().length < 5) { setAdminBanError('Reason must be at least 5 characters'); return }
    setAdminBanLoading(true)
    setAdminBanError('')
    try {
      const updated = await adminApi.banProject(project.id, adminBanReason.trim())
      setProject(updated)
      setAdminBanModal(false)
      setAdminBanReason('')
    } catch (e) {
      setAdminBanError(isApiException(e) ? e.message : 'Failed to ban project')
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
      setError(isApiException(e) ? e.message : 'Failed to unban project')
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
      setRejectError(isApiException(e) ? e.message : 'Failed to review appeal')
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
      setAppealError(isApiException(e) ? e.message : 'Failed to submit appeal')
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
      else setError('Failed to delete')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (loading) return <Spinner center />
  if (error) return <Alert type="error">{error}</Alert>
  if (!project) return null

  const roles = project.roles ?? []
  const canApply = user && !isOwner && project.status === 'recruiting'

  return (
    <div className={styles.page}>
      {confirmDelete && project && (
        <ConfirmDeleteModal
          title="Delete project"
          highlight={project.title}
          description="will be permanently deleted along with all its data. This action cannot be undone."
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
            <h3 className={styles.modalTitle}>Reject appeal</h3>
            <p className={styles.modalSub}>The project stays banned. You can update the ban reason.</p>
            {rejectError && <Alert type="error">{rejectError}</Alert>}
            <div className={styles.banReasonField}>
              <label className={styles.banReasonLabel}>Updated ban reason (optional)</label>
              <textarea
                className={styles.banReasonTextarea}
                rows={2}
                placeholder={project.ban_reason || 'Leave blank to keep current reason…'}
                value={rejectNewBanReason}
                onChange={e => setRejectNewBanReason(e.target.value)}
                maxLength={500}
                autoFocus
              />
              <span className={styles.banReasonCount}>{rejectNewBanReason.length}/500</span>
            </div>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => { setRejectModal(false); setRejectError(''); setRejectNewBanReason('') }}>Cancel</Button>
              <Button variant="danger" loading={adminReviewLoading} onClick={() => handleAdminReviewAppeal(false, rejectNewBanReason)}>Reject appeal</Button>
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
            <h3 className={styles.modalTitle}>Ban project</h3>
            <p className={styles.modalSub}>
              "<strong>{project.title}</strong>" will be hidden from all users. The owner will see the reason.
            </p>
            {adminBanError && <Alert type="error">{adminBanError}</Alert>}
            <div className={styles.banReasonField}>
              <label className={styles.banReasonLabel}>Reason for ban</label>
              <textarea
                ref={banTextareaRef}
                className={styles.banReasonTextarea}
                rows={4}
                placeholder="Describe why this project violates the rules..."
                value={adminBanReason}
                onChange={e => setAdminBanReason(e.target.value)}
                maxLength={500}
                autoFocus
              />
              <span className={styles.banReasonCount}>{adminBanReason.length}/500</span>
            </div>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => { setAdminBanModal(false); setAdminBanError('') }}>Cancel</Button>
              <Button variant="danger" loading={adminBanLoading} onClick={handleAdminBan}>Ban project</Button>
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
            {PROJECT_STATUS_LABEL[project.status]}
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
            {project.tags.map(t => (
              <span key={t.id} className="tag-chip">{t.name}</span>
            ))}
          </div>
        )}

        {canManage && (
          <div className={styles.ownerActions}>
            {/* Edit: owner only (admin cannot edit others' projects) */}
            {isOwner && (
              <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${project.id}/edit`, { state: { from: from ?? null } })}>
                Edit
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
                Applications
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
                  Applications
                </Button>
                {project.status !== 'banned' ? (
                  <Button variant="danger" size="sm" onClick={() => { setAdminBanModal(true); setAdminBanError('') }}>
                    Ban
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" loading={adminUnbanLoading} onClick={handleAdminUnban}>
                    Unban
                  </Button>
                )}
              </>
            )}
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
        )}

        {/* Ban banner — shown to owner and admin */}
        {project.status === 'banned' && (isOwner || isAdmin) && (
          <div className={styles.banBanner}>
            <div className={styles.banBannerIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
            </div>
            <div className={styles.banBannerBody}>
              <p className={styles.banBannerTitle}>This project has been banned</p>
              {project.ban_reason && (
                <p className={styles.banBannerReason}>{project.ban_reason}</p>
              )}

              {isAdmin && !isOwner && project.appeal_status === 'pending' && (
                <div className={styles.adminAppealReview}>
                  <p className={styles.banBannerHint}>Owner has submitted an appeal for review.</p>
                  {project.appeal_comment && (
                    <div className={styles.appealCommentDisplay}>
                      <span className={styles.appealCommentLabel}>Owner's message:</span>
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
                      Approve — restore to draft
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => { setRejectModal(true); setRejectError('') }}
                    >
                      Reject appeal
                    </Button>
                  </div>
                </div>
              )}

              {isOwner && (
                <>
                  {appealError && <Alert type="error">{appealError}</Alert>}

                  {project.appeal_status === 'none' || !project.appeal_status ? (
                    <div className={styles.banBannerActions}>
                      <p className={styles.banBannerHint}>Fix the issues and submit your project for re-review.</p>
                      <textarea
                        className={styles.appealCommentTextarea}
                        rows={3}
                        placeholder="Describe what you've changed to fix the violation (optional)..."
                        value={appealComment}
                        onChange={e => setAppealComment(e.target.value)}
                        maxLength={1000}
                      />
                      <button type="button" className={styles.appealBtn} onClick={handleSubmitAppeal} disabled={appealLoading}>
                        {appealLoading ? 'Submitting…' : 'Submit for review'}
                      </button>
                    </div>
                  ) : project.appeal_status === 'pending' ? (
                    <div className={styles.banBannerActions}>
                      {project.appeal_comment && (
                        <div className={styles.appealCommentDisplay}>
                          <span className={styles.appealCommentLabel}>Your message to admin:</span>
                          <p className={styles.appealCommentText}>{project.appeal_comment}</p>
                        </div>
                      )}
                      <p className={styles.appealStatus}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Appeal submitted — awaiting admin review
                      </p>
                    </div>
                  ) : project.appeal_status === 'rejected' ? (
                    <div className={styles.banBannerActions}>
                      <p className={styles.appealRejected}>
                        Appeal rejected. Fix the project and resubmit.
                      </p>
                      <textarea
                        className={styles.appealCommentTextarea}
                        rows={3}
                        placeholder="Describe what you've changed this time (optional)..."
                        value={appealComment}
                        onChange={e => setAppealComment(e.target.value)}
                        maxLength={1000}
                      />
                      <button type="button" className={styles.appealBtn} onClick={handleSubmitAppeal} disabled={appealLoading}>
                        {appealLoading ? 'Submitting…' : 'Resubmit for review'}
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
          <h2 className={styles.sectionTitle}>About</h2>
          <p className={styles.descText}>{project.description}</p>
        </div>

        <div className={styles.roles}>
          <h2 className={styles.sectionTitle}>Open roles</h2>

          {applySuccess && (
            <div className={styles.applySuccess}>
              <Alert type="success">Application sent! The owner will review it soon.</Alert>
            </div>
          )}

          {roles.length === 0 ? (
            <EmptyState title="No roles added yet" />
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
                            {pr.slots_filled} / {pr.slots_total} filled
                          </span>
                          {isFull
                            ? <span className={styles.roleSlotsFull}>No slots</span>
                            : <span className={styles.roleSlotsText}>{free} open</span>
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
                        <span className={styles.appliedLabel}>Applied</span>
                      )}
                      {canApply && !hasApplied && !isFull && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => { setApplyRole(pr); setApplySuccess(false) }}
                        >
                          Apply
                        </Button>
                      )}
                      {canApply && !hasApplied && isFull && (
                        <span className={styles.noSlots}>Positions filled</span>
                      )}
                      {!user && (
                        <Link to="/login">
                          <Button variant="ghost" size="sm">Sign in to apply</Button>
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
