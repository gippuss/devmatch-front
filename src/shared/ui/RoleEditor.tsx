import { useState } from 'react'
import type { ProjectRole } from '@/shared/types/api'
import { Button } from './Button'
import { Input } from './Input'
import { Stepper } from './Stepper'
import styles from './RoleEditor.module.css'

interface RoleEditorProps {
  roles: ProjectRole[]
  onAdd: (data: { role_name: string; grade?: string; slots_total: number }) => Promise<void>
  onUpdate: (roleId: number, data: { role_name: string; grade?: string; slots_total: number }) => Promise<void>
  onDelete: (roleId: number) => Promise<void>
  /** For create mode — roles are pending (not yet saved), no API calls on add */
  pending?: boolean
  onAddPending?: (data: { roleName: string; grade: string; slots: number }) => void
  onRemovePending?: (idx: number) => void
}

interface EditingState {
  roleName: string
  grade: string
  slots: number
}

export function RoleEditor({ roles, onAdd, onUpdate, onDelete, pending, onAddPending, onRemovePending }: RoleEditorProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editState, setEditState] = useState<EditingState>({ roleName: '', grade: '', slots: 1 })
  const [savingId, setSavingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [addName, setAddName] = useState('')
  const [addGrade, setAddGrade] = useState('')
  const [addSlots, setAddSlots] = useState(1)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  function startEdit(role: ProjectRole) {
    setEditingId(role.id)
    setEditState({ roleName: role.role_name, grade: role.grade ?? '', slots: role.slots_total })
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleSaveEdit(role: ProjectRole) {
    if (!editState.roleName.trim()) return
    setSavingId(role.id)
    try {
      await onUpdate(role.id, {
        role_name: editState.roleName.trim(),
        grade: editState.grade.trim() || undefined,
        slots_total: editState.slots,
      })
      setEditingId(null)
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(roleId: number) {
    setDeletingId(roleId)
    try {
      await onDelete(roleId)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleAdd() {
    if (!addName.trim()) { setAddError('Role name is required'); return }
    setAddError('')

    if (pending && onAddPending) {
      onAddPending({ roleName: addName.trim(), grade: addGrade.trim(), slots: addSlots })
      setAddName('')
      setAddGrade('')
      setAddSlots(1)
      return
    }

    setAdding(true)
    try {
      await onAdd({ role_name: addName.trim(), grade: addGrade.trim() || undefined, slots_total: addSlots })
      setAddName('')
      setAddGrade('')
      setAddSlots(1)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className={styles.root}>
      {roles.map((role, idx) => (
        <div key={role.id ?? idx} className={styles.row}>
          {editingId === role.id ? (
            <div className={styles.editForm}>
              <Input
                value={editState.roleName}
                onChange={e => setEditState(s => ({ ...s, roleName: e.target.value }))}
                placeholder="Role name"
                maxLength={100}
                className={styles.editName}
              />
              <Input
                value={editState.grade}
                onChange={e => setEditState(s => ({ ...s, grade: e.target.value }))}
                placeholder="Grade"
                maxLength={50}
                className={styles.editGrade}
              />
              <div className={styles.editSlots}>
                <span className={styles.slotsLabel}>Slots:</span>
                <Stepper value={editState.slots} min={1} max={100} onChange={v => setEditState(s => ({ ...s, slots: v }))} />
              </div>
              <div className={styles.editActions}>
                <Button type="button" variant="primary" size="sm" loading={savingId === role.id} onClick={() => handleSaveEdit(role)}>
                  Save
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className={styles.viewRow}>
              <div className={styles.roleInfo}>
                <span className={styles.roleName}>{role.role_name}</span>
                <div className={styles.roleMeta}>
                  {role.grade && <span className={styles.gradeChip}>{role.grade}</span>}
                  <span className={styles.slotsChip}>
                    {role.slots_filled !== undefined ? `${role.slots_filled}/${role.slots_total}` : role.slots_total} slot{role.slots_total !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => startEdit(role)}
                  aria-label={`Edit ${role.role_name}`}
                  title="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => pending && onRemovePending ? onRemovePending(idx) : handleDelete(role.id)}
                  disabled={deletingId === role.id}
                  aria-label={`Remove ${role.role_name}`}
                  title="Remove"
                >
                  {deletingId === role.id
                    ? <span className="spinner spinner-sm" />
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {addError && <p className={styles.addError}>{addError}</p>}

      <div className={styles.addRow}>
        <Input
          placeholder="Role name (e.g. Backend Developer)"
          value={addName}
          onChange={e => setAddName(e.target.value)}
          className={styles.addName}
          maxLength={100}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        />
        <Input
          placeholder="Grade (e.g. Senior)"
          value={addGrade}
          onChange={e => setAddGrade(e.target.value)}
          className={styles.addGrade}
          maxLength={50}
        />
        <div className={styles.addSlots}>
          <span className={styles.slotsLabel}>Slots:</span>
          <Stepper value={addSlots} min={1} max={100} onChange={setAddSlots} />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={adding}
          onClick={handleAdd}
          disabled={!addName.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  )
}
