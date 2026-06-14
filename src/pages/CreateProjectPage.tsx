import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi, dictionariesApi } from '@/shared/api/services'
import type { Tag, ProjectStatus } from '@/shared/types/api'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Textarea } from '@/shared/ui/Textarea'
import { Select } from '@/shared/ui/Select'
import { FormField } from '@/shared/ui/FormField'
import { Alert } from '@/shared/ui/Alert'
import { TagPicker } from '@/shared/ui/TagPicker'
import { RoleEditor } from '@/shared/ui/RoleEditor'
import { isApiException } from '@/shared/api/error'
import { PROJECT_STATUSES } from '@/shared/utils/constants'
import type { ProjectRole } from '@/shared/types/api'
import { useLocale } from '@/shared/i18n/LocaleContext'
import styles from './ProjectFormPage.module.css'

interface PendingRole { roleName: string; grade: string; slots: number }

export function CreateProjectPage() {
  const navigate = useNavigate()
  const { t } = useLocale()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('recruiting')

  const [allTags, setAllTags] = useState<Tag[]>([])
  const [systemTags, setSystemTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [tagsLoading, setTagsLoading] = useState(true)

  const [pendingRoles, setPendingRoles] = useState<PendingRole[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const statusLabel: Record<ProjectStatus, string> = {
    draft: t('status.draft'),
    recruiting: t('status.recruiting'),
    completed: t('status.completed'),
    banned: t('status.banned'),
  }

  useEffect(() => {
    Promise.all([dictionariesApi.getTags(), dictionariesApi.getSystemTags()])
      .then(([all, sys]) => {
        setAllTags(all.items ?? [])
        setSystemTags(sys.items ?? [])
      })
      .catch(() => {})
      .finally(() => setTagsLoading(false))
  }, [])

  async function handleCreateTag(name: string) {
    const tag = await dictionariesApi.createTag(name)
    setAllTags(prev => prev.some(tg => tg.id === tag.id) ? prev : [...prev, tag])
    setSelectedTagIds(prev => prev.includes(tag.id) ? prev : [...prev, tag.id])
  }

  async function handleRemoveTag(tagId: number) {
    setSelectedTagIds(prev => prev.filter(id => id !== tagId))
    try { await dictionariesApi.deleteTag(tagId) } catch { /* tag still used by others */ }
  }

  const pendingAsRoles: ProjectRole[] = pendingRoles.map((pr, idx) => ({
    id: -(idx + 1),
    project_id: 0,
    role_name: pr.roleName,
    grade: pr.grade,
    slots_total: pr.slots,
    slots_filled: 0,
  }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (title.trim().length < 3) { setError(t('projectForm.titleMin')); return }
    if (description.trim().length < 10) { setError(t('projectForm.descMin')); return }
    setLoading(true)
    setError('')
    try {
      const project = await projectsApi.create({
        title: title.trim(),
        description: description.trim(),
        status,
        tag_ids: selectedTagIds,
      })
      for (const r of pendingRoles) {
        try {
          await projectsApi.addRole(project.id, { role_name: r.roleName, grade: r.grade || undefined, slots_total: r.slots })
        } catch { /* skip — can add in edit */ }
      }
      navigate('/my-projects')
    } catch (err) {
      if (isApiException(err)) setError(err.message)
      else setError(t('projectForm.failedToCreate'))
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('projectForm.newTitle')}</h1>
        <p className={styles.subtitle}>{t('projectForm.newSubtitle')}</p>
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
            placeholder={t('projectForm.descPlaceholder')}
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

        {!tagsLoading && (
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
        )}

        <FormField label={t('projectForm.rolesLabel')} hint={t('projectForm.rolesHint')}>
          <RoleEditor
            roles={pendingAsRoles}
            pending
            onAddPending={role => setPendingRoles(prev => [...prev, role])}
            onRemovePending={idx => setPendingRoles(prev => prev.filter((_, i) => i !== idx))}
            onAdd={async () => {}}
            onUpdate={async () => {}}
            onDelete={async () => {}}
          />
        </FormField>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>{t('projectForm.cancelBtn')}</Button>
          <Button type="submit" loading={loading}>{t('projectForm.createBtn')}</Button>
        </div>
      </form>
    </div>
  )
}
