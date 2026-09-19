import { useState } from 'react'

import { ONBOARDING_SLIDES } from '../content/glossary'
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
        <Card>
          <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 68 }} aria-hidden="true">
              {slide.emoji}
            </div>
            <h1>{slide.title}</h1>
            <p style={{ fontSize: 18 }}>{slide.text}</p>
          </div>
        </Card>

        <div className="row" style={{ justifyContent: 'center' }} aria-hidden="true">
          {ONBOARDING_SLIDES.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === index ? 26 : 10,
                height: 10,
                borderRadius: 999,
                background: i === index ? 'var(--c-brand)' : 'var(--c-border)',
                transition: 'width .2s ease',
              }}
            />
          ))}
        </div>
        <p className="visually-hidden" aria-live="polite">
          Шаг {index + 1} из {ONBOARDING_SLIDES.length}
        </p>

        <div className="stack">
          <Button
            block
            large
            onClick={() => (last ? onDone() : setIndex(index + 1))}
          >
            {last ? (reviewMode ? 'Закрыть' : 'Начать игру') : 'Дальше'}
          </Button>

          {index > 0 && (
            <Button variant="ghost" block onClick={() => setIndex(index - 1)}>
              Назад
            </Button>
          )}
          {index === 0 && onSkip && (
            <Button variant="ghost" block onClick={onSkip}>
              Пропустить
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
