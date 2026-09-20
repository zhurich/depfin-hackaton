import { useState } from 'react'

import { GLOSSARY } from '../content/glossary'
import { Button, Card, Screen } from '../components/ui'
import { OnboardingScreen } from './OnboardingScreen'

export function GlossaryScreen({ onBack }: { onBack: () => void }) {
  const [intro, setIntro] = useState(false)
  const [openTerm, setOpenTerm] = useState<string | null>(null)

  if (intro) {
    return <OnboardingScreen reviewMode onDone={() => setIntro(false)} />
  }

  return (
    <Screen title="Словарик" onBack={onBack}>
      <Button variant="secondary" block large onClick={() => setIntro(true)}>
        ▶️ Посмотреть знакомство ещё раз
      </Button>

      {GLOSSARY.map((entry) => {
        const open = openTerm === entry.term
        return (
          <Card key={entry.term} flat>
            <button
              onClick={() => setOpenTerm(open ? null : entry.term)}
              aria-expanded={open}
              style={{
                width: '100%',
                minHeight: 'var(--tap)',
                border: 'none',
                background: 'transparent',
                font: 'inherit',
                color: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-3)',
              }}
            >
              <span style={{ fontSize: 26 }} aria-hidden="true">
                {entry.emoji}
              </span>
              <span style={{ flex: 1, fontWeight: 700 }}>{entry.term}</span>
              <span aria-hidden="true">{open ? '▾' : '▸'}</span>
            </button>

            {open && (
              <div className="stack stack--tight" style={{ marginTop: 'var(--sp-2)' }}>
                <p>{entry.short}</p>
                <p className="muted">Например: {entry.example}</p>
              </div>
            )}
          </Card>
        )
      })}
    </Screen>
  )
}
