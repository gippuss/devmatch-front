import './ui.css'

interface Props {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  className?: string
}

export function Stepper({ value, min = 1, max = 100, onChange, className = '' }: Props) {
  function dec() { if (value > min) onChange(value - 1) }
  function inc() { if (value < max) onChange(value + 1) }

  return (
    <div className={`stepper ${className}`}>
      <button
        type="button"
        className="stepper-btn"
        onClick={dec}
        disabled={value <= min}
        aria-label="Decrease"
      >
        −
      </button>
      <span className="stepper-value">{value}</span>
      <button
        type="button"
        className="stepper-btn"
        onClick={inc}
        disabled={value >= max}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  )
}
