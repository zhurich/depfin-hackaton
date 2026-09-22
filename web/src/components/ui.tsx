import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useEffect, useRef } from 'react'

import { Icon } from './Icon'
import { CURRENCY_SHORT } from '../domain/rules'
import type { IconName } from '../domain/types'

// Значок в плашке

export function Glyph({
  name,
  wash,
  color,
  size = 'md',
  ink,
}: {
  name: IconName
  wash: string
  color: string
  size?: 'sm' | 'md'
  ink?: boolean
}) {
  return (
    <span
      className={`glyph${size === 'sm' ? ' glyph--sm' : ''}${ink ? ' glyph--ink' : ''}`}
      style={{ background: wash }}
    >
      <Icon name={name} color={color} size={size === 'sm' ? 20 : 24} />
    </span>
  )
}

// Каркас экрана

export interface TabDef {
  key: string
  label: string
  icon: IconName
  badge?: number
}

export function AppShell({
  children,
  week,
  playerName,
  balance,
  onParent,
  title,
  onBack,
  tabs,
  activeTab,
  onTab,
}: {
  children: ReactNode
  week?: number
  playerName?: string
  balance?: number
  onParent?: () => void
  title?: string
  onBack?: () => void
  tabs?: TabDef[]
  activeTab?: string
  onTab?: (key: string) => void
}) {
  return (
    <div className="screen">
      <header className="topbar">
        {onBack ? (
          <>
            <button className="topbar__btn" onClick={onBack} aria-label="Назад">
              <Icon name="back" color="#fff" />
            </button>
            <div className="topbar__title">{title}</div>
          </>
        ) : (
          <>
            <span className="week-chip">
              <span className="week-chip__dot" aria-hidden="true" />
              Неделя {week}
            </span>
            <div className="topbar__title">{playerName}</div>
          </>
        )}

        {balance !== undefined && (
          <span className="coin-pill" aria-label={`Свободно ${balance} фиников`}>
            <span className="coin-pill__coin" aria-hidden="true">
              {CURRENCY_SHORT}
            </span>
            <span className="coin-pill__value">{balance}</span>
          </span>
        )}

        {onParent && (
          <button className="topbar__btn" onClick={onParent} aria-label="Раздел для взрослого">
            <Icon name="user" color="#fff" />
          </button>
        )}
      </header>

      <main className={`content${tabs ? ' content--tabbed' : ''}`}>{children}</main>

      {tabs && onTab && <TabBar tabs={tabs} active={activeTab} onTab={onTab} />}
    </div>
  )
}

function TabBar({
  tabs,
  active,
  onTab,
}: {
  tabs: TabDef[]
  active?: string
  onTab: (key: string) => void
}) {
  return (
    <nav className="tabbar" aria-label="Разделы игры">
      {tabs.map((t) => {
        const on = t.key === active
        return (
          <button
            key={t.key}
            className="tab"
            aria-current={on ? 'page' : undefined}
            onClick={() => onTab(t.key)}
          >
            <Icon name={t.icon} color={on ? '#fff' : 'var(--ink-soft)'} size={23} />
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className="tab__badge" aria-label={`Новых: ${t.badge}`}>
                {t.badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

export function ScreenHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h1 className="screen-head__title">{title}</h1>
      {sub && <p className="screen-head__sub">{sub}</p>}
    </div>
  )
}

export function Card({
  children,
  tone,
  flat,
  ...rest
}: {
  children: ReactNode
  tone?: 'cream' | 'quiet'
  flat?: boolean
} & React.HTMLAttributes<HTMLDivElement>) {
  const cls = ['card', tone ? `card--${tone}` : '', flat ? 'card--flat' : '']
    .filter(Boolean)
    .join(' ')
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}

// Кнопки

export function Button({
  variant = 'primary',
  block,
  icon,
  children,
  className = '',
  ...rest
}: {
  variant?: 'primary' | 'good' | 'save' | 'sun' | 'danger' | 'quiet'
  block?: boolean
  icon?: IconName
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = ['btn', `btn--${variant}`, block ? 'btn--block' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button className={cls} {...rest}>
      {icon && <Icon name={icon} size={22} />}
      {children}
    </button>
  )
}

export function RowButton({
  icon,
  wash,
  color,
  title,
  sub,
  note,
  noteColor,
  right,
  dim,
  ...rest
}: {
  icon: IconName
  wash: string
  color: string
  title: ReactNode
  sub?: ReactNode
  note?: ReactNode
  noteColor?: string
  right?: ReactNode
  dim?: boolean
  // title здесь — текст строки, а не HTML-подсказка
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'>) {
  return (
    <button className="row-btn" style={dim ? { opacity: 0.65 } : undefined} {...rest}>
      <Glyph name={icon} wash={wash} color={color} />
      <span className="row-btn__body">
        <span className="row-btn__title">{title}</span>
        {sub && <span className="row-btn__sub">{sub}</span>}
        {note && (
          <span
            className="row-btn__sub"
            style={{ color: noteColor ?? 'var(--ink-soft)', fontWeight: 700 }}
          >
            {note}
          </span>
        )}
      </span>
      {right}
    </button>
  )
}

// Деньги и числа

export function Money({ value, sign }: { value: number; sign?: '+' | '−' }) {
  return (
    <span className="num">
      {sign ?? ''}
      {value} {CURRENCY_SHORT}
    </span>
  )
}

export function StatTile({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color?: string
}) {
  return (
    <div className="stat-tile">
      <div className="stat-tile__label">{label}</div>
      <div className="stat-tile__value" style={color ? { color } : undefined}>
        {value} <span className="stat-tile__unit">{CURRENCY_SHORT}</span>
      </div>
    </div>
  )
}

// Показатели и прогресс

export function StatBar({
  icon,
  label,
  value,
  color,
  wash,
  lowThreshold = 45,
}: {
  icon: IconName
  label: string
  value: number
  color: string
  wash: string
  lowThreshold?: number
}) {
  const low = value < lowThreshold
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'center', gap: 10 }}>
      <Glyph name={icon} wash={wash} color={color} size="sm" />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-soft)' }}>
          {label}
          {low && <span style={{ color: 'var(--warn-ink)' }}> · мало</span>}
        </span>
        <span
          className="bar"
          role="img"
          aria-label={`${label}: ${value} из 100${low ? ', мало' : ''}`}
        >
          <span className="bar__fill" style={{ width: `${value}%`, background: color }} />
        </span>
      </span>
      <span className="num" style={{ fontSize: 17, minWidth: 40, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

export function ProgressBar({
  value,
  label,
  color = 'var(--save)',
  pattern,
}: {
  value: number
  label: string
  color?: string
  pattern?: 'stripes' | 'dots'
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <span className="bar" role="img" aria-label={`${label}: ${pct}%`}>
      <span
        className={`bar__fill${pattern ? ` bar__fill--${pattern}` : ''}`}
        style={{ width: `${pct}%`, background: color }}
      />
    </span>
  )
}

export function ProgressRing({
  value,
  label,
  size = 128,
}: {
  value: number
  label: string
  size?: number
}) {
  const pct = Math.max(0, Math.min(1, value))
  const r = 50
  const len = 2 * Math.PI * r
  return (
    <svg
      className="progress-ring"
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`${label}: ${Math.round(pct * 100)}%`}
    >
      <circle cx="60" cy="60" r={r} fill="#fff" stroke="var(--save-border)" strokeWidth="12" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="var(--save)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${len * pct} ${len}`}
        transform="rotate(-90 60 60)"
      />
    </svg>
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
        {value} <span className="stepper__unit">{CURRENCY_SHORT}</span>
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

export type NoteTone = 'hint' | 'good' | 'info' | 'danger'

const NOTE_ICON: Record<NoteTone, IconName> = {
  hint: 'bulb',
  good: 'check',
  info: 'bulb',
  danger: 'close',
}

const NOTE_MARK: Record<NoteTone, { bg: string; ink: string }> = {
  hint: { bg: 'var(--sun)', ink: '#4A3208' },
  good: { bg: 'var(--need-deep)', ink: '#fff' },
  info: { bg: 'var(--save)', ink: '#fff' },
  danger: { bg: 'var(--danger)', ink: '#fff' },
}

export function Note({
  tone = 'hint',
  title,
  children,
}: {
  tone?: NoteTone
  title?: string
  children: ReactNode
}) {
  const mark = NOTE_MARK[tone]
  return (
    <div className={`note${tone === 'hint' ? '' : ` note--${tone}`}`} role="status">
      <span className="note__mark" style={{ background: mark.bg }} aria-hidden="true">
        <Icon name={NOTE_ICON[tone]} color={mark.ink} size={16} width={2.6} />
      </span>
      <span style={{ minWidth: 0 }}>
        {title && <span className="note__title">{title}</span>}
        <span style={{ display: 'block' }}>{children}</span>
      </span>
    </div>
  )
}

export function Speech({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div className="speech">
      <span className="speech__avatar" style={{ background: color }} aria-hidden="true">
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: 'var(--ink)',
            boxShadow: '8px 0 0 var(--ink)',
            marginLeft: -4,
          }}
        />
      </span>
      <div className="speech__bubble">{children}</div>
    </div>
  )
}

// Модальные окна

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
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
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
  tone = 'hint',
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
      <h2>{title}</h2>
      <Note tone={tone}>{details}</Note>
      <Button variant={tone === 'danger' ? 'danger' : 'primary'} block onClick={onConfirm}>
        {confirmLabel}
      </Button>
      <Button variant="quiet" block onClick={onCancel}>
        {cancelLabel}
      </Button>
    </Sheet>
  )
}

export function EmptyState({ icon, text }: { icon: IconName; text: string }) {
  return (
    <Card tone="quiet" flat>
      <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        <Glyph name={icon} wash="var(--card)" color="var(--ink-soft)" />
        <p className="muted">{text}</p>
      </div>
    </Card>
  )
}
