import { useState } from 'react'

import { GLOSSARY } from '../content/glossary'
import { Icon } from '../components/Icon'
import { Button, Card, Glyph, ScreenHead } from '../components/ui'
import { OnboardingScreen } from './OnboardingScreen'

export function GlossaryScreen() {
  const [intro, setIntro] = useState(false)
  const [openTerm, setOpenTerm] = useState<string | null>(null)

  if (intro) return <OnboardingScreen reviewMode onDone={() => setIntro(false)} />

  return (
    <>
      <ScreenHead title="Словарик" sub="Короткие объяснения слов, которые встречаются в игре." />

      <Button variant="quiet" block icon="paw" onClick={() => setIntro(true)}>
        Посмотреть знакомство ещё раз
      </Button>

      {GLOSSARY.map((entry) => {
        const open = openTerm === entry.term
        return (
          <Card key={entry.term} flat={!open}>
            <button
              onClick={() => setOpenTerm(open ? null : entry.term)}
              aria-expanded={open}
              style={{
                width: '100%',
                minHeight: 48,
                border: 'none',
                background: 'transparent',
                font: 'inherit',
                color: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 0,
              }}
            >
              <Glyph name={entry.icon} wash="var(--brand-wash)" color="var(--brand)" size="sm" />
              <span style={{ flex: 1, fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 17 }}>
                {entry.term}
              </span>
              <span
                aria-hidden="true"
                style={{ transform: open ? 'rotate(90deg)' : 'none', display: 'flex' }}
              >
                <Icon name="chevron" size={20} color="var(--ink-soft)" />
              </span>
            </button>

            {open && (
              <div className="stack stack--tight" style={{ marginTop: 10 }}>
                <p>{entry.short}</p>
                <p className="muted">Например: {entry.example}</p>
              </div>
            )}
          </Card>
        )
      })}
    </>
  )
}
