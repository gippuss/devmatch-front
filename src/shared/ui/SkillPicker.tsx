import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import type { Skill } from '@/shared/types/api'
import styles from './TagPicker.module.css'

interface SkillPickerProps {
  allSkills: Skill[]
  selectedSkillIds: number[]
  onSelect: (skill: Skill) => void
  onRemove: (skillId: number) => void
}

export function SkillPicker({ allSkills, selectedSkillIds, onSelect, onRemove }: SkillPickerProps) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedSkills = selectedSkillIds.map(id => allSkills.find(s => s.id === id)).filter(Boolean) as Skill[]
  const available = allSkills.filter(s => !selectedSkillIds.includes(s.id))
  const filtered = input.trim()
    ? available.filter(s => s.name.toLowerCase().includes(input.trim().toLowerCase()))
    : available

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => { setHighlighted(0) }, [input])

  const handleSelect = useCallback((skill: Skill) => {
    onSelect(skill)
    setInput('')
    inputRef.current?.focus()
  }, [onSelect])

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlighted(prev => (prev + 1) % Math.max(filtered.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(prev => (prev - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (!open || filtered.length === 0) return
      handleSelect(filtered[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setInput('')
    }
  }

  return (
    <div className={styles.root} ref={containerRef}>
      <div className={styles.box} onClick={() => inputRef.current?.focus()}>
        {selectedSkills.map(skill => (
          <span key={skill.id} className={styles.chip}>
            {skill.name}
            <button
              type="button"
              className={styles.chipRemove}
              onClick={e => { e.stopPropagation(); onRemove(skill.id) }}
              aria-label={`Remove ${skill.name}`}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 1l8 8M9 1L1 9"/>
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={selectedSkills.length === 0 ? 'Type to search skills…' : 'Add more skills…'}
          value={input}
          onChange={e => { setInput(e.target.value); setOpen(true) }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
      </div>

      {open && filtered.length > 0 && (
        <div className={styles.dropdown}>
          {filtered.map((skill, idx) => (
            <div
              key={skill.id}
              className={`${styles.option} ${highlighted === idx ? styles.highlighted : ''}`}
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); handleSelect(skill) }}
              onMouseEnter={() => setHighlighted(idx)}
            >
              {skill.name}
            </div>
          ))}
        </div>
      )}

      {open && filtered.length === 0 && input.trim() !== '' && (
        <div className={styles.dropdown}>
          <div className={styles.empty}>No matching skills</div>
        </div>
      )}
    </div>
  )
}
