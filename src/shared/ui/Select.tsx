import './ui.css'

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className = '', children, ...rest }: Props) {
  return (
    <select className={`select ${className}`} {...rest}>
      {children}
    </select>
  )
}
