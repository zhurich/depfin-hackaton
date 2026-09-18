import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useEffect, useRef } from 'react'

import { CURRENCY_SHORT } from '../domain/rules'

// Каркас экрана

export function Screen({
  title,
  onBack,
  children,
  action,
}: {
  title: string
  onBack?: () => void
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="screen">
      <header className="topbar">
        {onBack && (
          <button className="topbar__back" onClick={onBack} aria-label="Назад">
            ←
          </button>
        )}
        <div className="topbar__title">{title}</div>
        {action}
      </header>
      <main className="content">{children}</main>
    </div>
  )
}

export function Card({
  children,
  flat,
  ...rest
}: { children: ReactNode; flat?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card${flat ? ' card--flat' : ''}`} {...rest}>
      {children}
    </div>
  )
}

// Кнопки

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  variant = 'primary',
  block,
  large,
  children,
  className = '',
  ...rest
}: {
  variant?: ButtonVariant
  block?: boolean
  large?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = [
    'btn',
    `btn--${variant}`,
    block ? 'btn--block' : '',
    large ? 'btn--lg' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}

export function Money({ value, sign }: { value: number; sign?: '+' | '−' }) {
  return (
    <span className="money">
      {sign ?? ''}
      {value} {CURRENCY_SHORT}
    </span>
  )
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="chip">{children}</span>
}

export function StatBar({
  emoji,
  label,
  value,
  color,
  lowThreshold = 45,
}: {
  emoji: string
  label: string
  value: number
  color: string
  lowThreshold?: number
}) {
  const low = value < lowThreshold
  return (
    <div className="statbar">
      <span aria-hidden="true" style={{ fontSize: 20 }}>
        {emoji}
      </span>
      <div
        className="statbar__track"
        role="img"
        aria-label={`${label}: ${value} из 100${low ? ', мало' : ''}`}
      >
        <div
          className={`statbar__fill${low ? ' statbar__fill--low' : ''}`}
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="statbar__value">
        {value}
        {low && <span aria-hidden="true"> ⚠</span>}
      </span>
    </div>
  )
}

// Счётчик суммы

export function Stepper({
  value,
  onChange,
  step = 10,
  min = 0,
  max,
  label,
}: {
  value: number
  onChange: (next: number) => void
  step?: number
  min?: number
  max: number
  label: string
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n))
  return (
    <div className="stepper">
      <button
        className="stepper__btn"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label={`${label}: убавить на ${step}`}
      >
        −
      </button>
      <div className="stepper__value" aria-live="polite">
        {value} {CURRENCY_SHORT}
        <span className="visually-hidden">{label}</span>
      </div>
      <button
        className="stepper__btn"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        aria-label={`${label}: добавить ${step}`}
      >
        +
      </button>
    </div>
  )
}

// Пояснения

export type NoteTone = 'info' | 'good' | 'warn' | 'danger'

const NOTE_ICON: Record<NoteTone, string> = {
  info: 'ℹ️',
  good: '✅',
  warn: '💡',
  danger: '⛔',
}

export function Note({
  tone = 'info',
  title,
  children,
}: {
  tone?: NoteTone
  title?: string
  children: ReactNode
}) {
  return (
    <div className={`note${tone === 'info' ? '' : ` note--${tone}`}`} role="status">
      {title && (
        <div className="note__title">
          <span aria-hidden="true">{NOTE_ICON[tone]}</span>
          {title}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) ref.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      className="sheet-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: 'var(--sp-3)' }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function ConfirmSheet({
  open,
  title,
  details,
  confirmLabel,
  cancelLabel = 'Отмена',
  tone = 'info',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  details: ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: NoteTone
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      <div className="stack">
        <Note tone={tone}>{details}</Note>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} block large onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="ghost" block onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </Sheet>
  )
}

export function ProgressBar({
  value,
  label,
}: {
  value: number
  label: string
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="progress" role="img" aria-label={`${label}: ${pct}%`}>
      <div className="progress__fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <Card flat>
      <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 40 }} aria-hidden="true">
          {emoji}
        </div>
        <p className="muted">{text}</p>
      </div>
    </Card>
  )
}
