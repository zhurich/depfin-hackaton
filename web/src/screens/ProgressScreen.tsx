import { QUESTS, TOPIC_EMOJI, TOPIC_TITLES } from '../content/quests'
import { STAGES } from '../content/appearance'
import { Button, Card, Money, Note, ProgressBar, Screen } from '../components/ui'
import { growthToNextStage, stageForGrowth } from '../domain/pet'
import { goalProgress, goalRemaining, pluralFinik } from '../domain/savings'
import { useGame } from '../store/gameStore'
import type { LedgerEntry } from '../domain/types'
import type { Route } from '../navigation'

const LEDGER_LABEL: Record<LedgerEntry['kind'], { sign: '+' | '−'; emoji: string }> = {
  income: { sign: '+', emoji: '💰' },
  essential: { sign: '−', emoji: '🥣' },
  optional: { sign: '−', emoji: '🎈' },
  save: { sign: '−', emoji: '🐷' },
  withdraw: { sign: '+', emoji: '↩️' },
}

export function ProgressScreen({ go, onBack }: { go: (r: Route) => void; onBack: () => void }) {
  const { state, activeGoal } = useGame()
  const stage = stageForGrowth(state.growth)
  const next = growthToNextStage(state.growth)
  const lastSummary = state.history[0]
  const doneCount = Object.keys(state.quests).length

  return (
    <Screen title="Прогресс" onBack={onBack}>
      <Card>
        <h2>Как растёт Финни</h2>
        <p className="muted" style={{ margin: '4px 0 12px' }}>
          Сейчас: {stage.title}. {stage.caption}
        </p>

        <div className="stack stack--tight">
          {STAGES.map((s) => {
            const reached = state.growth >= s.minGrowth
            return (
              <div key={s.id} className="row row--between">
                <span>
                  <span aria-hidden="true">{reached ? '✅' : '⬜'}</span> {s.title}
                </span>
                <span className="muted">
                  {reached ? 'пройдено' : `нужно ${s.minGrowth} ⭐`}
                </span>
              </div>
            )
          })}
        </div>

        {next && (
          <p className="muted" style={{ marginTop: 12 }}>
            До стадии «{next.next.title}» осталось {next.needed} ⭐.
          </p>
        )}
      </Card>

      {/* Цель */}
      {activeGoal && (
        <Card>
          <h2>Цель</h2>
          <div className="row" style={{ marginTop: 8 }}>
            <span style={{ fontSize: 34 }} aria-hidden="true">
              {activeGoal.emoji}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{activeGoal.title}</div>
              <ProgressBar value={goalProgress(activeGoal)} label={activeGoal.title} />
              <p className="muted" style={{ marginTop: 4 }}>
                {activeGoal.saved} из {activeGoal.cost} Ф · осталось {goalRemaining(activeGoal)}{' '}
                {pluralFinik(goalRemaining(activeGoal))}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Итоги последней недели */}
      <Card>
        <h2>Последняя неделя</h2>
        {lastSummary ? (
          <>
            <p className="muted" style={{ margin: '4px 0 10px' }}>
              Неделя {lastSummary.index} · получено {lastSummary.income} Ф · рост +
              {lastSummary.growthGained} ⭐
            </p>
            <ul style={{ margin: 0, paddingLeft: 20 }} className="stack stack--tight">
              {lastSummary.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="muted" style={{ marginTop: 8 }}>
            Первая неделя ещё не закрыта. Заверши её — и здесь появятся итоги.
          </p>
        )}
      </Card>

      {/* Задания */}
      <Card>
        <h2>Задания</h2>
        <p className="muted" style={{ margin: '4px 0 10px' }}>
          Выполнено {doneCount} из {QUESTS.length}
        </p>
        <div className="stack stack--tight">
          {QUESTS.map((q) => {
            const result = state.quests[q.id]
            return (
              <div key={q.id} className="row row--between">
                <span style={{ minWidth: 0 }}>
                  <span aria-hidden="true">{result ? (result.good ? '✅' : '📘') : '⬜'}</span>{' '}
                  {q.title}
                  <span className="muted">
                    {' '}
                    · {TOPIC_EMOJI[q.topic]} {TOPIC_TITLES[q.topic]}
                  </span>
                </span>
                <span className="muted">{result ? `+${result.reward} Ф` : '—'}</span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Журнал операций */}
      <Card>
        <h2>Откуда финики</h2>
        <p className="muted" style={{ margin: '4px 0 10px' }}>
          Каждая строчка — одна операция с источником и суммой.
        </p>
        {state.ledger.length === 0 ? (
          <p className="muted">Пока операций не было.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack stack--tight">
            {state.ledger.slice(0, 20).map((e) => (
              <li key={e.id} className="row row--between">
                <span style={{ minWidth: 0 }}>
                  <span aria-hidden="true">{LEDGER_LABEL[e.kind].emoji}</span> {e.source}
                  <span className="muted"> · неделя {e.periodIndex}</span>
                </span>
                <Money value={e.amount} sign={LEDGER_LABEL[e.kind].sign} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {state.history.length > 1 && (
        <Card>
          <h2>Все недели</h2>
          <div className="stack stack--tight" style={{ marginTop: 8 }}>
            {state.history.map((h) => (
              <div key={h.index} className="row row--between">
                <span>Неделя {h.index}</span>
                <span className="muted">
                  {h.needsCovered ? '✅' : '⬜'} нужды · {h.planKept ? '✅' : '⬜'} план ·{' '}
                  {h.savedAsPlanned ? '✅' : '⬜'} копилка
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Note tone="info" title="Не знаешь слово?">
        В словарике коротко объяснены бюджет, накопления, цель и другие слова.
      </Note>
      <Button variant="secondary" block onClick={() => go('glossary')}>
        📖 Открыть словарик
      </Button>
    </Screen>
  )
}
