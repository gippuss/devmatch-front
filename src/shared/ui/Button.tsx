import './ui.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  full?: boolean
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: Props) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
  return (
    <button
      className={`btn btn-${variant} ${sizeClass} ${full ? 'btn-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="spinner spinner-sm" />}
      {children}
    </button>
  )
}
