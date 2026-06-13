import './ui.css'

interface Props {
  label?: string
  error?: string
  hint?: string
  children: React.ReactNode
}

export function FormField({ label, error, hint, children }: Props) {
  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      {children}
      {error && <span className="form-error">{error}</span>}
      {!error && hint && <span className="form-hint">{hint}</span>}
    </div>
  )
}
