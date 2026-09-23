import { useState } from 'react'

import { Pet } from '../components/Pet'
import { Icon } from '../components/Icon'
import { Button, Card, ConfirmSheet, Money, Note, ScreenHead } from '../components/ui'
import { moodOf, stageForGrowth, stageIndex } from '../domain/pet'
import { settlePeriod } from '../domain/period'
import { MAX_GROWTH_PER_PERIOD, PERIOD_INCOME } from '../domain/rules'
import { growthToNextStage } from '../domain/pet'
import { playSound } from '../platform/sound'
import { useGame } from '../store/gameStore'
import type { Route } from '../navigation'

export function SummaryScreen({ go, onBack }: { go: (r: Route) => void; onBack: () => void }) {
  const { state, dispatch } = useGame()
  const [confirming, setConfirming] = useState(false)
  const [finished, setFinished] = useState(false)

  if (finished && state.history[0]) return <AfterView go={go} />

  if (!state.plan) {
    return (
      <>
        <Note tone="hint" title="Сначала план">
          Чтобы сравнить план с фактом, нужно составить план на эту неделю.
        </Note>
        <Button block icon="envelope" onClick={() => go('budget')}>
          Составить план
        </Button>
        <Button variant="quiet" block onClick={onBack}>
          Назад
        </Button>
      </>
    )
  }

  const fact = {
    essential: state.period.essentialSpent,
    optional: state.period.optionalSpent,
    savings: state.period.savedThisPeriod,
  }
  const preview = settlePeriod({
    periodIndex: state.periodIndex,
    income: state.period.income,
    plan: state.plan,
    fact,
    stats: state.stats,
    growthBefore: state.growth,
  })
  const s = preview.summary

  const rows = [
    {
      ok: s.needsCovered,
      title: s.needsCovered ? 'Обязательные нужды закрыты' : 'Обязательные нужды пока не закрыты',
      note: s.needsCovered
        ? `Потрачено на нужное: ${fact.essential} Ф — этого хватает`
        : `Потрачено на нужное: ${fact.essential} Ф. Финни ещё не сыт или не ухожен`,
      theme: 'need' as const,
    },
    {
      ok: s.planKept,
      title: s.planKept ? 'План соблюдён' : 'План пока не соблюдён',
      note: s.planKept
        ? 'Факт сошёлся с планом'
        : 'Потрачено больше плана — одну покупку можно перенести, это не ошибка',
      theme: 'want' as const,
    },
    {
      ok: s.savedAsPlanned,
      title: s.savedAsPlanned ? 'Отложено как планировал' : 'В копилку отложено меньше плана',
      note: `Отложено на этой неделе: ${fact.savings} Ф из ${state.plan.savings} по плану`,
      theme: 'save' as const,
    },
  ]

  return (
    <>
      <ScreenHead title={`Итоги недели ${state.periodIndex}`} sub="Это описание опыта, а не оценка." />

      {rows.map((row) => (
        <SummaryRow key={row.title} {...row} />
      ))}

      <Card tone="cream" style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sun-ink)' }}>Очки роста Финни</div>
        <div className="num" style={{ fontSize: 34, marginTop: 2 }}>
          {preview.growthAfter}
        </div>
        <div className="muted" style={{ marginTop: 4 }}>
          За эту неделю: +{s.growthGained} из {MAX_GROWTH_PER_PERIOD}.{' '}
          {growthNote(preview.growthAfter)}
        </div>
      </Card>

      {s.growthGained < MAX_GROWTH_PER_PERIOD && (
        <Note tone="hint" title="Ещё можно успеть">
          {s.nextStep}
        </Note>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Button variant="quiet" icon="cart" onClick={() => go('shop')}>
          Докупить
        </Button>
        <Button variant="quiet" icon="jar" onClick={() => go('savings')}>
          Отложить
        </Button>
      </div>

      <Button block onClick={() => setConfirming(true)}>
        Завершить неделю {state.periodIndex}
      </Button>

      <ConfirmSheet
        open={confirming}
        title="Завершить неделю?"
        details={
          <div className="stack stack--tight">
            <span>Неделя закроется, итоги сохранятся в истории.</span>
            <span>
              На следующую неделю придёт <Money value={PERIOD_INCOME} /> — и можно будет составить
              новый план.
            </span>
          </div>
        }
        confirmLabel="Да, завершить"
        onConfirm={() => {
          dispatch({ type: 'endPeriod' })
          playSound('success')
          setConfirming(false)
          setFinished(true)
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}

function growthNote(growth: number): string {
  const next = growthToNextStage(growth)
  return next ? `До стадии «${next.next.title}» осталось ${next.needed}.` : 'Это последняя стадия.'
}

function SummaryRow({
  ok,
  title,
  note,
  theme,
}: {
  ok: boolean
  title: string
  note: string
  theme: 'need' | 'want' | 'save'
}) {
  const ink = ok ? `var(--${theme})` : 'var(--ink-soft)'
  const wash = ok ? `var(--${theme}-wash)` : 'var(--neutral)'
  return (
    <Card>
      <div className="row">
        <span className="glyph" style={{ background: wash }} aria-hidden="true">
          <Icon name={ok ? 'check' : 'minus'} color={ink} width={2.8} />
        </span>
        <span className="row-btn__body">
          <span className="row-btn__title">{title}</span>
          <span className="row-btn__sub">{note}</span>
        </span>
        <span className="num" style={{ fontSize: 17, color: ink }}>
          {ok ? '+2' : '0'}
        </span>
      </div>
    </Card>
  )
}

function AfterView({ go }: { go: (r: Route) => void }) {
  const { state } = useGame()
  const summary = state.history[0]
  const stage = stageForGrowth(state.growth)
  const previousStageId = state.history[1]?.stageIdAfter
  const grewUp = previousStageId !== undefined && previousStageId !== summary.stageIdAfter

  return (
    <div className="stack pop">
      <Card tone="cream" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Pet
            look={state.pet!}
            mood={moodOf(state.stats)}
            size={160}
            stageIndex={stageIndex(stage.id)}
            animate={state.settings.motion}
          />
        </div>
        <h2>{stage.title}</h2>
        <p className="muted" style={{ marginTop: 4 }}>
          {stage.caption}
        </p>
      </Card>

      {grewUp && (
        <Note tone="good" title="Финни подрос!">
          Новая стадия — «{stage.title}». Так бывает, когда решения за несколько недель
          складываются в хорошую привычку.
        </Note>
      )}

      <Card>
        <h3>Почему так вышло</h3>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }} className="stack stack--tight">
          {summary.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </Card>

      <Note tone="info" title="Следующий шаг">
        {summary.nextStep}
      </Note>

      <Button block icon="envelope" onClick={() => go('budget')}>
        Составить план на неделю {state.periodIndex}
      </Button>
      <Button variant="quiet" block icon="home" onClick={() => go('home')}>
        На главный экран
      </Button>
    </div>
  )
}
