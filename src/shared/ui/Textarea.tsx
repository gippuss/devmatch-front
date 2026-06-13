import './ui.css'

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ error, className = '', ...rest }: Props) {
  return (
    <textarea
      className={`textarea ${error ? 'input-error' : ''} ${className}`}
      {...rest}
    />
  )
}
