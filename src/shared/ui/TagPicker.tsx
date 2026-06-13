import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import type { Tag } from '@/shared/types/api'
import styles from './TagPicker.module.css'

interface TagPickerProps {
  allTags: Tag[]
  systemTags: Tag[]
  selectedTagIds: number[]
  onSelect: (tag: Tag) => void
  onRemove: (tagId: number) => void
  onCreate: (name: string) => Promise<void>
}

export function TagPicker({ allTags, systemTags, selectedTagIds, onSelect, onRemove, onCreate }: TagPickerProps) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [creating, setCreating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedTags = selectedTagIds.map(id => allTags.find(t => t.id === id)).filter(Boolean) as Tag[]
  // dropdown only shows system tags (not yet selected)
  const available = systemTags.filter(t => !selectedTagIds.includes(t.id))
  const filtered = input.trim()
    ? available.filter(t => t.name.toLowerCase().includes(input.trim().toLowerCase()))
    : available

  const exactMatch = filtered.some(t => t.name.toLowerCase() === input.trim().toLowerCase())
  const showCreate = input.trim() !== '' && !exactMatch
  const totalOptions = filtered.length + (showCreate ? 1 : 0)

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

  const handleSelect = useCallback((tag: Tag) => {
    onSelect(tag)
    setInput('')
    inputRef.current?.focus()
  }, [onSelect])

  const handleCreate = useCallback(async () => {
    const name = input.trim()
    if (!name || creating) return
    setCreating(true)
    try {
      await onCreate(name)
      setInput('')
    } finally {
      setCreating(false)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [input, onCreate, creating])

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlighted(prev => (prev + 1) % Math.max(totalOptions, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(prev => (prev - 1 + Math.max(totalOptions, 1)) % Math.max(totalOptions, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (!open || totalOptions === 0) return
      if (highlighted < filtered.length) {
        handleSelect(filtered[highlighted])
      } else if (showCreate) {
        handleCreate()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setInput('')
    }
  }

  return (
    <div className={styles.root} ref={containerRef}>
      <div className={styles.box} onClick={() => inputRef.current?.focus()}>
        {selectedTags.map(tag => (
          <span key={tag.id} className={styles.chip}>
            {tag.name}
            <button
              type="button"
              className={styles.chipRemove}
              onClick={e => { e.stopPropagation(); onRemove(tag.id) }}
              aria-label={`Remove ${tag.name}`}
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
          placeholder={selectedTags.length === 0 ? 'Type to search or create tags…' : 'Add more tags…'}
          value={input}
          onChange={e => { setInput(e.target.value); setOpen(true) }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
      </div>

      {open && (totalOptions > 0 || input.trim() === '') && (
        <div className={styles.dropdown}>
          {filtered.length === 0 && !showCreate && (
            <div className={styles.empty}>No matching tags</div>
          )}
          {filtered.map((tag, idx) => (
            <div
              key={tag.id}
              className={`${styles.option} ${highlighted === idx ? styles.highlighted : ''}`}
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); handleSelect(tag) }}
              onMouseEnter={() => setHighlighted(idx)}
            >
              {tag.name}
            </div>
          ))}
          {showCreate && (
            <div
              className={`${styles.option} ${styles.createOption} ${highlighted === filtered.length ? styles.highlighted : ''}`}
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); handleCreate() }}
              onMouseEnter={() => setHighlighted(filtered.length)}
            >
              {creating ? (
                <span className={styles.creating}>
                  <span className="spinner spinner-sm" />
                  Creating…
                </span>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Create &ldquo;{input.trim()}&rdquo;
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
