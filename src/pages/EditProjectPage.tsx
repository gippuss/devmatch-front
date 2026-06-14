import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { projectsApi, dictionariesApi, adminApi } from '@/shared/api/services'
import type { Tag, ProjectStatus, Project, ProjectRole } from '@/shared/types/api'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Textarea } from '@/shared/ui/Textarea'
import { Select } from '@/shared/ui/Select'
import { FormField } from '@/shared/ui/FormField'
import { Alert } from '@/shared/ui/Alert'
import { Spinner } from '@/shared/ui/Spinner'
import { TagPicker } from '@/shared/ui/TagPicker'
import { RoleEditor } from '@/shared/ui/RoleEditor'
import { isApiException } from '@/shared/api/error'
import { PROJECT_STATUSES } from '@/shared/utils/constants'
import { useLocale } from '@/shared/i18n/LocaleContext'
import styles from './ProjectFormPage.module.css'

export function EditProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLocale()
  const from = (location.state as { from?: string })?.from

  const [project, setProject] = useState<Project | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('draft')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [systemTags, setSystemTags] = useState<Tag[]>([])
  const [projectRoles, setProjectRoles] = useState<ProjectRole[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const statusLabel: Record<ProjectStatus, string> = {
    draft: t('status.draft'),
    recruiting: t('status.recruiting'),
    completed: t('status.completed'),
    banned: t('status.banned'),
  }

  useEffect(() => {
    if (!id) return
    Promise.all([
      projectsApi.getById(Number(id)),
      dictionariesApi.getTags(),
      dictionariesApi.getSystemTags(),
    ]).then(([p, tgs, sys]) => {
      setProject(p)
      setTitle(p.title)
      setDescription(p.description)
      setStatus(p.status)
      setSelectedTagIds((p.tags ?? []).map(tg => tg.id))
      setSystemTags(sys.items ?? [])
      setAllTags(tgs.items ?? [])
      setProjectRoles(p.roles ?? [])
    }).catch(() => setError(t('projectForm.failedToLoad')))
      .finally(() => setLoading(false))
  }, [id, t])

  async function handleCreateTag(name: string) {
    const tag = await dictionariesApi.createTag(name)
    setAllTags(prev => prev.some(tg => tg.id === tag.id) ? prev : [...prev, tag])
    setSelectedTagIds(prev => prev.includes(tag.id) ? prev : [...prev, tag.id])
  }

  async function handleRemoveTag(tagId: number) {
    setSelectedTagIds(prev => prev.filter(x => x !== tagId))
    try { await dictionariesApi.deleteTag(tagId) } catch { /* still used elsewhere */ }
  }

  const isAdminEdit = from === 'admin'

  async function handleAddRole(data: { role_name: string; grade?: string; slots_total: number }) {
    const added = isAdminEdit
      ? await adminApi.addRole(Number(id), data)
      : await projectsApi.addRole(Number(id), data)
    setProjectRoles(prev => [...prev, added])
  }

  async function handleUpdateRole(roleId: number, data: { role_name: string; grade?: string; slots_total: number }) {
    const updated = isAdminEdit
      ? await adminApi.updateRole(roleId, data)
      : await projectsApi.updateRole(roleId, data)
    setProjectRoles(prev => prev.map(r => r.id === roleId ? updated : r))
  }

  async function handleDeleteRole(roleId: number) {
    if (isAdminEdit) {
      await adminApi.deleteRole(roleId)
    } else {
      await projectsApi.deleteRole(roleId)
    }
    setProjectRoles(prev => prev.filter(r => r.id !== roleId))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (title.trim().length < 3) { setError(t('projectForm.titleMin')); return }
    if (description.trim().length < 10) { setError(t('projectForm.descMin')); return }
    setSaving(true)
    setError('')
    try {
      if (isAdminEdit) {
        await adminApi.updateProject(Number(id), {
          title: title.trim(),
          description: description.trim(),
          status,
          tag_ids: selectedTagIds,
        })
      } else {
        await projectsApi.update(Number(id), {
          title: title.trim(),
          description: description.trim(),
          status,
          tag_ids: selectedTagIds,
        })
      }
      navigate(`/projects/${id}`, { state: { from: from ?? null } })
    } catch (err) {
      if (isApiException(err)) setError(err.message)
      else setError(t('projectForm.failedToSave'))
      setSaving(false)
    }
  }

  if (loading) return <Spinner center />

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('projectForm.editTitle')}</h1>
        <p className={styles.subtitle}>{project?.title}</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {error && <Alert type="error">{error}</Alert>}

        <FormField label={t('projectForm.titleLabel')} hint={t('projectForm.titleHint')}>
          <Input
            placeholder={t('projectForm.titlePlaceholder')}
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
            autoFocus
          />
        </FormField>

        <FormField label={t('projectForm.descLabel')} hint={t('projectForm.descHint')}>
          <Textarea
            placeholder={t('projectForm.descPlaceholderEdit')}
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={2000}
            rows={6}
          />
        </FormField>

        <FormField label={t('projectForm.statusLabel')}>
          <Select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)}>
            {PROJECT_STATUSES.map(s => (
              <option key={s} value={s}>{statusLabel[s]}</option>
            ))}
          </Select>
        </FormField>

        <FormField label={t('projectForm.tagsLabel')} hint={t('projectForm.tagsHint')}>
          <TagPicker
            allTags={allTags}
            systemTags={systemTags}
            selectedTagIds={selectedTagIds}
            onSelect={tag => setSelectedTagIds(prev => prev.includes(tag.id) ? prev : [...prev, tag.id])}
            onRemove={handleRemoveTag}
            onCreate={handleCreateTag}
          />
        </FormField>

        <FormField label={t('projectForm.rolesLabel')} hint={t('projectForm.rolesHintEdit')}>
          <RoleEditor
            roles={projectRoles}
            onAdd={handleAddRole}
            onUpdate={handleUpdateRole}
            onDelete={handleDeleteRole}
          />
        </FormField>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={() => navigate(`/projects/${id}`, { state: { from: from ?? null } })}>{t('projectForm.cancelBtn')}</Button>
          <Button type="submit" loading={saving}>{t('projectForm.saveBtn')}</Button>
        </div>
      </form>
    </div>
  )
}
