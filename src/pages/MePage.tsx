import { useState, useEffect, useRef, type FormEvent } from 'react'
import { meApi, dictionariesApi } from '@/shared/api/services'
import type { Skill } from '@/shared/types/api'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Textarea } from '@/shared/ui/Textarea'
import { FormField } from '@/shared/ui/FormField'
import { Alert } from '@/shared/ui/Alert'
import { SkillPicker } from '@/shared/ui/SkillPicker'
import { isApiException } from '@/shared/api/error'
import { formatDate } from '@/shared/utils/date'
import { BACKEND_URL } from '@/shared/utils/constants'
import styles from './MePage.module.css'

export function MePage() {
  const { user, refreshUser } = useAuth()

  const [editing, setEditing] = useState(false)
  const [allSkills, setAllSkills] = useState<Skill[]>([])

  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([])

  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    dictionariesApi.getSkills().then(r => setAllSkills(r.items ?? [])).catch(() => {})
  }, [])

  function startEdit() {
    if (!user) return
    setUsername(user.username)
    setBio(user.bio ?? '')
    setSelectedSkillIds((user.skills ?? []).map(s => s.id))
    setError('')
    setSuccess(false)
    setEditing(true)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setError('')
    try {
      await meApi.uploadAvatar(file)
      await refreshUser()
    } catch (err) {
      if (isApiException(err)) setError(err.message)
      else setError('Failed to upload avatar')
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleAvatarDelete() {
    setAvatarUploading(true)
    setError('')
    try {
      await meApi.deleteAvatar()
      await refreshUser()
    } catch (err) {
      if (isApiException(err)) setError(err.message)
      else setError('Failed to remove avatar')
    } finally {
      setAvatarUploading(false)
    }
  }

  function selectSkill(skill: Skill) {
    setSelectedSkillIds(prev => prev.includes(skill.id) ? prev : [...prev, skill.id])
  }

  function removeSkill(skillId: number) {
    setSelectedSkillIds(prev => prev.filter(id => id !== skillId))
  }

  const [fieldErrors, setFieldErrors] = useState<{ username?: string }>({})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errs: { username?: string } = {}
    if (!username.trim()) errs.username = 'Username is required'
    else if (username.trim().length < 2) errs.username = 'At least 2 characters'
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await meApi.update({
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        skill_ids: selectedSkillIds,
      })
      await refreshUser()
      setEditing(false)
      setSuccess(true)
    } catch (err) {
      if (isApiException(err)) setError(err.message)
      else setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          {user.avatar_url ? (
            <img
              src={user.avatar_url.startsWith('/uploads') ? `${BACKEND_URL}${user.avatar_url}` : user.avatar_url}
              alt={user.username}
              className="avatar avatar-lg"
            />
          ) : (
            <span className="avatar avatar-lg">{user.username[0]?.toUpperCase()}</span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={styles.fileInput}
            onChange={handleAvatarChange}
          />
          <div className={styles.avatarActions}>
            <button
              type="button"
              className={styles.avatarUploadBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              title="Upload avatar"
            >
              {avatarUploading ? '…' : '✎'}
            </button>
            {user.avatar_url && (
              <button
                type="button"
                className={styles.avatarDeleteBtn}
                onClick={handleAvatarDelete}
                disabled={avatarUploading}
                title="Remove avatar"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className={styles.info}>
          <h1 className={styles.username}>{user.username}</h1>
          <p className={styles.email}>{user.email}</p>
          <p className={styles.since}>Member since {formatDate(user.created_at)}</p>
        </div>
        {!editing && (
          <Button variant="secondary" size="sm" onClick={startEdit}>Edit profile</Button>
        )}
      </div>

      {success && <Alert type="success">Profile updated successfully</Alert>}

      {editing ? (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && <Alert type="error">{error}</Alert>}

          <FormField label="Username" hint="2–64 characters" error={fieldErrors.username}>
            <Input
              value={username}
              onChange={e => { setUsername(e.target.value); setFieldErrors(p => ({ ...p, username: undefined })) }}
              maxLength={64}
              error={!!fieldErrors.username}
            />
          </FormField>

          <FormField label="Bio" hint="Up to 500 characters">
            <Textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={500}
              placeholder="Tell others about yourself..."
            />
          </FormField>

          {allSkills.length > 0 && (
            <FormField label="Skills">
              <SkillPicker
                allSkills={allSkills}
                selectedSkillIds={selectedSkillIds}
                onSelect={selectSkill}
                onRemove={removeSkill}
              />
            </FormField>
          )}

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save changes</Button>
          </div>
        </form>
      ) : (
        <div className={styles.view}>
          {user.bio && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Bio</h2>
              <p className={styles.bioText}>{user.bio}</p>
            </div>
          )}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Skills</h2>
            {(user.skills ?? []).length === 0 ? (
              <p className={styles.empty}>No skills added yet</p>
            ) : (
              <div className={styles.skillList}>
                {user.skills.map(s => (
                  <span key={s.id} className="tag-chip active">{s.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
