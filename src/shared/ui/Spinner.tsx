import './ui.css'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  center?: boolean
}

export function Spinner({ size = 'md', center = false }: Props) {
  const cls = `spinner ${size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : ''}`
  if (center) {
    return <div className="page-loader"><span className={cls} /></div>
  }
  return <span className={cls} />
}
