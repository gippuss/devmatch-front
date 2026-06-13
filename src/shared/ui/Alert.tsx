import './ui.css'

type AlertType = 'error' | 'success' | 'info'

interface Props {
  type?: AlertType
  children: React.ReactNode
}

export function Alert({ type = 'error', children }: Props) {
  return <div className={`alert alert-${type}`}>{children}</div>
}
