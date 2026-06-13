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
import { PROJECT_STATUS_LABEL, PROJECT_STATUSES } from '@/shared/utils/constants'
import type { ProjectRole } from '@/shared/types/api'
import styles from './ProjectFormPage.module.css'

interface PendingRole { roleName: string; grade: string; slots: number }

export function CreateProjectPage() {
  const navigate = useNavigate()

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
    setAllTags(prev => prev.some(t => t.id === tag.id) ? prev : [...prev, tag])
    setSelectedTagIds(prev => prev.includes(tag.id) ? prev : [...prev, tag.id])
  }

  async function handleRemoveTag(tagId: number) {
    setSelectedTagIds(prev => prev.filter(id => id !== tagId))
    // Attempt to clean up tag if unused — fire-and-forget
    try { await dictionariesApi.deleteTag(tagId) } catch { /* tag still used by others — ignore */ }
  }

  // Pending roles for create mode — no API calls until project created
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
    if (title.trim().length < 3) { setError('Title must be at least 3 characters'); return }
    if (description.trim().length < 10) { setError('Description must be at least 10 characters'); return }
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
      else setError('Failed to create project')
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>New project</h1>
        <p className={styles.subtitle}>Describe your idea and start recruiting</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {error && <Alert type="error">{error}</Alert>}

        <FormField label="Title" hint="3–120 characters">
          <Input
            placeholder="My awesome project"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
            autoFocus
          />
        </FormField>

        <FormField label="Description" hint="10–2000 characters">
          <Textarea
            placeholder="What are you building? What problem does it solve?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={2000}
            rows={6}
          />
        </FormField>

        <FormField label="Status">
          <Select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)}>
            {PROJECT_STATUSES.map(s => (
              <option key={s} value={s}>{PROJECT_STATUS_LABEL[s]}</option>
            ))}
          </Select>
        </FormField>

        {!tagsLoading && (
          <FormField label="Tags" hint="Search existing tags or create new ones">
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

        <FormField label="Roles" hint="Add roles you are looking for (optional)">
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
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={loading}>Create project</Button>
        </div>
      </form>
    </div>
  )
}
