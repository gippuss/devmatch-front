import './ui.css'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error, className = '', ...rest }: Props) {
  return (
    <input
      className={`input ${error ? 'input-error' : ''} ${className}`}
      {...rest}
    />
  )
}
