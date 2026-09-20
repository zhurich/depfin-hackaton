import { useState } from 'react'

import { LANE_EMOJI, LANE_TITLE, comparePlanWithFact } from '../domain/budget'
import { Pet } from '../components/Pet'
import { Button, Card, ConfirmSheet, Money, Note, Screen } from '../components/ui'
import { moodOf, stageForGrowth, stageIndex } from '../domain/pet'
import { settlePeriod } from '../domain/period'
import { PERIOD_INCOME } from '../domain/rules'
import { playSound } from '../platform/sound'
import { useGame } from '../store/gameStore'
import type { Route } from '../navigation'

export function SummaryScreen({ go, onBack }: { go: (r: Route) => void; onBack: () => void }) {
  const { state, dispatch } = useGame()
  const [confirming, setConfirming] = useState(false)
  const [finished, setFinished] = useState(false)

  const lastSummary = state.history[0]

  if (finished && lastSummary) {
    return <AfterView go={go} />
  }

  if (!state.plan) {
    return (
      <Screen title="Итоги недели" onBack={onBack}>
        <Note tone="warn" title="Сначала план">
          Чтобы сравнить план с фактом, нужно составить план на эту неделю.
        </Note>
        <Button block large onClick={() => go('budget')}>
          🗂️ Составить план
        </Button>
      </Screen>
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
  const rows = comparePlanWithFact(state.plan, fact)

  return (
    <Screen title={`Итоги недели ${state.periodIndex}`} onBack={onBack}>
      <Card>
        <div className="row row--between">
          <span>Получено за неделю</span>
          <Money value={state.period.income} sign="+" />
        </div>
        <div className="row row--between" style={{ marginTop: 6 }}>
          <span>Осталось свободных</span>
          <Money value={state.balance} />
        </div>
      </Card>

      <h2>План и факт</h2>
      {rows.map((row) => (
        <div key={row.lane} className={`lane lane--${row.lane}`}>
          <div className="row row--between">
            <span style={{ fontWeight: 800 }}>
              <span aria-hidden="true">{LANE_EMOJI[row.lane]}</span> {LANE_TITLE[row.lane]}
            </span>
            <span>
              {row.planned} → {row.actual} Ф <span aria-hidden="true">{row.kept ? '✓' : '!'}</span>
            </span>
          </div>
          <p className="muted" style={{ marginTop: 6 }}>
            {row.note}
          </p>
        </div>
      ))}

      <h2>Что будет с Финни</h2>
      <Card>
        <ul style={{ margin: 0, paddingLeft: 20 }} className="stack stack--tight">
          {preview.summary.notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
        <div style={{ marginTop: 'var(--sp-3)' }}>
          <Note tone={preview.summary.growthGained > 0 ? 'good' : 'warn'} title="Очки роста">
            За эту неделю: +{preview.summary.growthGained}. Всего станет {preview.growthAfter}.
          </Note>
        </div>
      </Card>

      {preview.summary.growthGained < 6 && (
        <Note tone="warn" title="Ещё можно успеть">
          {preview.summary.nextStep}
        </Note>
      )}

      <div className="stack">
        <Button variant="secondary" block onClick={() => go('shop')}>
          🛒 Докупить нужное
        </Button>
        <Button variant="secondary" block onClick={() => go('savings')}>
          🐷 Отложить в копилку
        </Button>
        <Button block large onClick={() => setConfirming(true)}>
          Завершить неделю {state.periodIndex}
        </Button>
      </div>

      <ConfirmSheet
        open={confirming}
        title="Завершить неделю?"
        tone="info"
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
    </Screen>
  )
}

function AfterView({ go }: { go: (r: Route) => void }) {
  const { state } = useGame()
  const summary = state.history[0]
  const stage = stageForGrowth(state.growth)
  const previousStageId = state.history[1]?.stageIdAfter
  const grewUp = previousStageId !== undefined && previousStageId !== summary.stageIdAfter

  return (
    <Screen title={`Неделя ${summary.index} закрыта`}>
      <Card>
        <div className="pet-stage">
          <Pet
            look={state.pet!}
            mood={moodOf(state.stats)}
            size={150}
            stageIndex={stageIndex(stage.id)}
            animate={state.settings.motion}
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2>{stage.title}</h2>
          <p className="muted">{stage.caption}</p>
        </div>
      </Card>

      {grewUp && (
        <Note tone="good" title="Финни подрос!">
          Новая стадия — «{stage.title}». Так бывает, когда решения за несколько недель складываются
          в хорошую привычку.
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

      <Button block large onClick={() => go('budget')}>
        🗂️ Составить план на неделю {state.periodIndex}
      </Button>
      <Button variant="ghost" block onClick={() => go('home')}>
        На главный экран
      </Button>
    </Screen>
  )
}
