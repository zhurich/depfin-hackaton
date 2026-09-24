import { QUESTS, TOPIC_TITLES } from '../content/quests'
import { STAGES } from '../content/appearance'
import { Icon } from '../components/Icon'
import { Button, Card, Money, Note, ProgressBar, ProgressRing, ScreenHead } from '../components/ui'
import { growthToNextStage, stageForGrowth } from '../domain/pet'
import { goalProgress, goalRemaining, pluralFinik } from '../domain/savings'
import { DEMO_PERIODS } from '../domain/rules'
import { useGame } from '../store/gameStore'
import type { IconName, LedgerEntry, PeriodSummary } from '../domain/types'
import type { Route } from '../navigation'

const LEDGER_STYLE: Record<LedgerEntry['kind'], { sign: '+' | '−'; icon: IconName; color: string }> = {
  income: { sign: '+', icon: 'coin', color: 'var(--need)' },
  essential: { sign: '−', icon: 'bowl', color: 'var(--need)' },
  optional: { sign: '−', icon: 'kite', color: 'var(--want)' },
  save: { sign: '−', icon: 'jar', color: 'var(--save)' },
  withdraw: { sign: '+', icon: 'refresh', color: 'var(--save)' },
}

export function ProgressScreen({ go }: { go: (r: Route) => void }) {
  const { state, activeGoal } = useGame()
  const stage = stageForGrowth(state.growth)
  const next = growthToNextStage(state.growth)
  const history = state.history
  const doneCount = Object.keys(state.quests).length

  return (
    <>
      <ScreenHead title="Путь Финни" sub="Каждая неделя — шаг. Назад путь не идёт никогда." />

      {/* Лента недель */}
      <Card>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {weekDots(state.periodIndex, history).map((d) => (
            <div
              key={d.week}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 7,
                flex: 1,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  background: d.bg,
                  border: `2.5px solid ${d.border}`,
                  color: d.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-hidden="true"
              >
                <span className="num" style={{ fontSize: 16 }}>
                  {d.week}
                </span>
              </span>
              <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink-soft)', textAlign: 'center' }}>
                {d.caption}
              </span>
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          Неделя {state.periodIndex}. Закрыто недель: {history.length} из {DEMO_PERIODS} в
          демонстрационном сценарии.
        </p>
      </Card>

      {/* Навыки */}
      {skillRows(history).map((sk) => (
        <Card key={sk.title}>
          <div className="stack stack--tight">
            <div className="row row--between">
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 16 }}>
                {sk.title}
              </span>
              <span className="num" style={{ fontSize: 16, color: sk.color }}>
                {sk.done} из {sk.total}
              </span>
            </div>
            <ProgressBar value={sk.total ? sk.done / sk.total : 0} label={sk.title} color={sk.color} />
            <span className="muted">{sk.note}</span>
          </div>
        </Card>
      ))}

      {/* Рост питомца */}
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
                <span className="row" style={{ gap: 8 }}>
                  <Icon
                    name={reached ? 'check' : 'minus'}
                    color={reached ? 'var(--need)' : 'var(--ink-soft)'}
                    size={20}
                  />
                  {s.title}
                </span>
                <span className="muted">{reached ? 'пройдено' : `нужно ${s.minGrowth} очков`}</span>
              </div>
            )
          })}
        </div>
        {next && (
          <p className="muted" style={{ marginTop: 12 }}>
            До стадии «{next.next.title}» осталось {next.needed} очков.
          </p>
        )}
      </Card>

      {/* Цель */}
      {activeGoal && (
        <Card>
          <h2>Цель</h2>
          <div className="row" style={{ marginTop: 10 }}>
            <ProgressRing value={goalProgress(activeGoal)} label={activeGoal.title} size={84} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 17 }}>
                {activeGoal.title}
              </div>
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
        {history[0] ? (
          <>
            <p className="muted" style={{ margin: '4px 0 10px' }}>
              Неделя {history[0].index} · получено {history[0].income} Ф · рост +
              {history[0].growthGained} очков
            </p>
            <ul style={{ margin: 0, paddingLeft: 20 }} className="stack stack--tight">
              {history[0].notes.map((n, i) => (
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
                <span className="row" style={{ gap: 8, minWidth: 0 }}>
                  <Icon
                    name={result ? (result.good ? 'check' : 'bulb') : 'minus'}
                    color={result ? 'var(--need)' : 'var(--ink-soft)'}
                    size={18}
                  />
                  <span style={{ minWidth: 0 }}>
                    {q.title}
                    <span className="muted"> · {TOPIC_TITLES[q.topic]}</span>
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
            {state.ledger.slice(0, 20).map((e) => {
              const st = LEDGER_STYLE[e.kind]
              return (
                <li key={e.id} className="row row--between">
                  <span className="row" style={{ gap: 8, minWidth: 0 }}>
                    <Icon name={st.icon} color={st.color} size={18} />
                    <span style={{ minWidth: 0 }}>
                      {e.source}
                      <span className="muted"> · неделя {e.periodIndex}</span>
                    </span>
                  </span>
                  <Money value={e.amount} sign={st.sign} />
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Note tone="info" title="Не знаешь слово?">
        В словарике коротко объяснены бюджет, накопления, цель и другие слова.
      </Note>
      <Button variant="quiet" block icon="book" onClick={() => go('glossary')}>
        Открыть словарик
      </Button>
    </>
  )
}

function weekDots(current: number, history: PeriodSummary[]) {
  const last = Math.max(DEMO_PERIODS, current)
  const first = Math.max(1, last - DEMO_PERIODS + 1)
  const closed = new Set(history.map((h) => h.index))

  return Array.from({ length: last - first + 1 }, (_, i) => {
    const week = first + i
    const done = closed.has(week)
    const now = week === current
    return {
      week,
      caption: done ? 'пройдена' : now ? 'сейчас' : '',
      bg: done ? 'var(--need-deep)' : now ? 'var(--sun)' : 'var(--neutral)',
      border: done || now ? 'var(--ink)' : 'var(--neutral-border)',
      color: done ? '#fff' : 'var(--ink)',
    }
  })
}

function skillRows(history: PeriodSummary[]) {
  const total = history.length
  const count = (f: (h: PeriodSummary) => boolean) => history.filter(f).length

  return [
    {
      title: 'Планирование',
      done: count((h) => h.planKept),
      total,
      color: 'var(--want)',
      note: total
        ? 'Недель, где настоящие траты сошлись с планом.'
        : 'Появится, когда закроешь первую неделю.',
    },
    {
      title: 'Обязательные расходы',
      done: count((h) => h.needsCovered),
      total,
      color: 'var(--need)',
      note: total
        ? 'Недель, где Финни был сыт и ухожен.'
        : 'Появится, когда закроешь первую неделю.',
    },
    {
      title: 'Накопление',
      done: count((h) => h.savedAsPlanned),
      total,
      color: 'var(--save)',
      note: total ? 'Недель, где копилка пополнялась.' : 'Появится, когда закроешь первую неделю.',
    },
  ]
}
