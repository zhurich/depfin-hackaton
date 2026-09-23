import { useState } from 'react'

import { ONBOARDING_SLIDES } from '../content/glossary'
import { Icon } from '../components/Icon'
import { Button, Card } from '../components/ui'

export function OnboardingScreen({
  onDone,
  onSkip,
  reviewMode = false,
}: {
  onDone: () => void
  onSkip?: () => void
  reviewMode?: boolean
}) {
  const [index, setIndex] = useState(0)
  const slide = ONBOARDING_SLIDES[index]
  const last = index === ONBOARDING_SLIDES.length - 1

  return (
    <div className="screen">
      <main className="content" style={{ justifyContent: 'center' }}>
        <Card tone="cream" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <span
              style={{
                width: 92,
                height: 92,
                borderRadius: 999,
                background: '#fff',
                border: '3px solid var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-hidden="true"
            >
              <Icon name={slide.icon} color="var(--brand)" size={44} width={2.4} />
            </span>
          </div>
          <h1>{slide.title}</h1>
          <p style={{ marginTop: 10 }}>{slide.text}</p>
        </Card>

        <div className="row" style={{ justifyContent: 'center', gap: 6 }} aria-hidden="true">
          {ONBOARDING_SLIDES.map((_, i) => (
            <span
              style={{
                width: i === index ? 28 : 10,
                height: 10,
                borderRadius: 999,
                background: i === index ? 'var(--brand)' : 'var(--cream-border)',
                transition: 'width .2s ease',
              }}
              key={i}
            />
          ))}
        </div>
        <p className="visually-hidden" aria-live="polite">
          Шаг {index + 1} из {ONBOARDING_SLIDES.length}
        </p>

        <Button block onClick={() => (last ? onDone() : setIndex(index + 1))}>
          {last ? (reviewMode ? 'Закрыть' : 'Начать игру') : 'Дальше'}
        </Button>

        {index > 0 && (
          <Button variant="quiet" block onClick={() => setIndex(index - 1)}>
            Назад
          </Button>
        )}
        {index === 0 && onSkip && (
          <Button variant="quiet" block onClick={onSkip}>
            Пропустить
          </Button>
        )}
      </main>
    </div>
  )
}
