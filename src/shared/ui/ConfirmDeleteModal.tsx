import { Button } from './Button'
import styles from './ConfirmDeleteModal.module.css'

interface ConfirmDeleteModalProps {
  title: string
  description: string
  highlight?: string
  deleting: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDeleteModal({
  title,
  description,
  highlight,
  deleting,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={deleting}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.text}>
            {highlight && (
              <><span className={styles.highlight}>"{highlight}"</span>{' '}</>
            )}
            {description}
          </p>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  )
}
