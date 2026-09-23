import { useMemo, useState } from 'react'

import { questById } from '../content/quests'
import { Icon } from '../components/Icon'
import {
  Button,
  Card,
  Glyph,
  Money,
  Note,
  RowButton,
  ScreenHead,
  Stepper,
} from '../components/ui'
import { LANE_THEME } from '../domain/budget'
import { playSound } from '../platform/sound'
import { useGame } from '../store/gameStore'
import type { QuestAnswer } from '../domain/quests'
import type {
  AllocateQuest,
  BasketQuest,
  BudgetLane,
  ChoiceQuest,
  NumberQuest,
  OrderQuest,
  Quest,
  QuestOutcome,
} from '../domain/types'

export function QuestPlayScreen({ questId, onBack }: { questId: string; onBack: () => void }) {
  const { state, submitQuest } = useGame()
  const quest = questById(questId)
  const [outcome, setOutcome] = useState<QuestOutcome | null>(null)

  if (!quest) return <Note tone="danger">Такого задания нет.</Note>

  const submit = (answer: QuestAnswer) => {
    const result = submitQuest(questId, answer)
    playSound(result.good ? 'success' : 'tap')
    setOutcome(result)
  }

  if (outcome) return <OutcomeView quest={quest} outcome={outcome} onBack={onBack} />
  if (state.quests[questId]) return <ReviewView quest={quest} onBack={onBack} />

  return (
    <>
      <Card>
        <h2>{quest.title}</h2>
        <p style={{ marginTop: 8 }}>{quest.situation}</p>
        <p className="muted" style={{ marginTop: 8 }}>
          {quest.task}
        </p>
      </Card>
      {renderPlayer(quest, submit)}
    </>
  )
}

function renderPlayer(quest: Quest, submit: (a: QuestAnswer) => void) {
  switch (quest.kind) {
    case 'allocate':
      return <AllocatePlayer quest={quest} submit={submit} />
    case 'basket':
      return <BasketPlayer quest={quest} submit={submit} />
    case 'order':
      return <OrderPlayer quest={quest} submit={submit} />
    case 'number':
      return <NumberPlayer quest={quest} submit={submit} />
    case 'choice':
      return <ChoicePlayer quest={quest} submit={submit} />
  }
}

function LeftBox({ label, value, bad }: { label: string; value: number; bad?: boolean }) {
  return (
    <div
      className="card"
      style={{
        background: bad ? 'var(--danger-wash)' : 'var(--need-wash)',
        borderColor: bad ? 'var(--danger-border)' : 'var(--need-border)',
        boxShadow: 'none',
      }}
    >
      <div className="row row--between">
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 17 }}>{label}</span>
        <span className="num" style={{ fontSize: 26, color: bad ? 'var(--danger)' : 'var(--need)' }}>
          {value} Ф
        </span>
      </div>
      {bad && (
        <p style={{ color: 'var(--danger)', marginTop: 8 }}>
          Это больше, чем есть. Убери что-нибудь.
        </p>
      )}
    </div>
  )
}

function AllocatePlayer({ quest, submit }: { quest: AllocateQuest; submit: (a: QuestAnswer) => void }) {
  const [lanes, setLanes] = useState<Record<string, number>>(
    () => Object.fromEntries(quest.lanes.map((l) => [l.id, 0])),
  )
  const total = Object.values(lanes).reduce((a, b) => a + b, 0)
  const left = quest.amount - total

  return (
    <>
      <LeftBox label="Осталось разложить" value={left} />

      {quest.lanes.map((lane) => {
        const theme = LANE_THEME[lane.id]
        const others = total - lanes[lane.id]
        const max = Math.max(0, quest.amount - others)
        return (
          <div
            key={lane.id}
            className="lane"
            style={{ background: theme.wash, borderColor: theme.border, boxShadow: `0 5px 0 ${theme.border}` }}
          >
            <div className="lane__flap" style={{ background: theme.border }} aria-hidden="true" />
            <div className="lane__body">
              <div className="row">
                <Glyph name={lane.icon} wash={theme.ink} color="#fff" size="sm" />
                <span className="lane__title">{lane.title}</span>
              </div>
              <Stepper
                value={lanes[lane.id]}
                onChange={(v) => setLanes({ ...lanes, [lane.id]: Math.min(v, max) })}
                max={max}
                step={10}
                label={lane.title}
              />
            </div>
          </div>
        )
      })}

      <Button
        block
        onClick={() => submit({ kind: 'allocate', lanes: lanes as Partial<Record<BudgetLane, number>> })}
      >
        Готово
      </Button>
      {left > 0 && (
        <p className="muted">Можно разложить не всё — но тогда часть фиников просто полежит.</p>
      )}
    </>
  )
}

function BasketPlayer({ quest, submit }: { quest: BasketQuest; submit: (a: QuestAnswer) => void }) {
  const [selected, setSelected] = useState<string[]>([])
  const spent = quest.options.filter((o) => selected.includes(o.id)).reduce((a, o) => a + o.price, 0)
  const left = quest.budget - spent

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <>
      <LeftBox label="Осталось денег" value={left} bad={left < 0} />

      <div className="stack">
        {quest.options.map((o) => {
          const picked = selected.includes(o.id)
          return (
            <button
              key={o.id}
              className="row-btn"
              aria-pressed={picked}
              onClick={() => toggle(o.id)}
              style={{
                background: picked ? 'var(--need-wash)' : 'var(--card)',
                borderColor: picked ? 'var(--need)' : 'var(--card-border)',
              }}
            >
              <Glyph name={o.icon} wash="#fff" color="var(--brand)" />
              <span className="row-btn__body">
                <span className="row-btn__title">{o.title}</span>
                <span className="row-btn__sub" style={{ fontWeight: 700 }}>
                  {picked ? '✓ в корзине' : 'нажми, чтобы положить'}
                </span>
              </span>
              <span className="row-btn__price">{o.price} Ф</span>
            </button>
          )
        })}
      </div>

      <Button block icon="cart" onClick={() => submit({ kind: 'basket', selected })}>
        К кассе
      </Button>
    </>
  )
}

function OrderPlayer({ quest, submit }: { quest: OrderQuest; submit: (a: QuestAnswer) => void }) {
  const [order, setOrder] = useState<string[]>(() => quest.items.map((i) => i.id))

  const move = (index: number, delta: number) => {
    const next = [...order]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setOrder(next)
  }

  const byId = useMemo(() => Object.fromEntries(quest.items.map((i) => [i.id, i])), [quest.items])

  return (
    <>
      <Note tone="hint">Стрелками подними наверх самое важное.</Note>

      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">
        {order.map((id, index) => (
          <li key={id} className="row-btn" style={{ cursor: 'default' }}>
            <Glyph name={byId[id].icon} wash="var(--brand-wash)" color="var(--brand)" />
            <span className="row-btn__body">
              <span className="row-btn__title">
                {index + 1}. {byId[id].title}
              </span>
            </span>
            <span className="row" style={{ gap: 6 }}>
              <button
                className="stepper__btn"
                style={{ width: 48, height: 48, fontSize: 20 }}
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`${byId[id].title}: поднять выше`}
              >
                ↑
              </button>
              <button
                className="stepper__btn"
                style={{ width: 48, height: 48, fontSize: 20 }}
                onClick={() => move(index, 1)}
                disabled={index === order.length - 1}
                aria-label={`${byId[id].title}: опустить ниже`}
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>

      <Button block onClick={() => submit({ kind: 'order', order })}>
        Готово
      </Button>
    </>
  )
}

function NumberPlayer({ quest, submit }: { quest: NumberQuest; submit: (a: QuestAnswer) => void }) {
  const [value, setValue] = useState('')
  const [showHint, setShowHint] = useState(false)
  const parsed = Number(value)
  const valid = value.trim() !== '' && Number.isFinite(parsed)

  return (
    <>
      <Card>
        <label className="stack stack--tight">
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800 }}>
            Твой ответ ({quest.unit})
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            style={{ fontSize: 26, textAlign: 'center' }}
          />
        </label>
      </Card>

      {!showHint ? (
        <Button variant="quiet" block icon="bulb" onClick={() => setShowHint(true)}>
          Подсказка
        </Button>
      ) : (
        <Note tone="hint" title="Подсказка">
          {quest.hint}
        </Note>
      )}

      <Button block disabled={!valid} onClick={() => submit({ kind: 'number', value: parsed })}>
        Ответить
      </Button>
    </>
  )
}

function ChoicePlayer({ quest, submit }: { quest: ChoiceQuest; submit: (a: QuestAnswer) => void }) {
  return (
    <div className="stack">
      {quest.options.map((o) => (
        <RowButton
          key={o.id}
          icon={o.icon}
          wash="var(--brand-wash)"
          color="var(--brand)"
          title={o.title}
          right={<Icon name="chevron" size={20} />}
          onClick={() => submit({ kind: 'choice', optionId: o.id })}
        />
      ))}
    </div>
  )
}

// Итог задания

function OutcomeView({
  quest,
  outcome,
  onBack,
}: {
  quest: Quest
  outcome: QuestOutcome
  onBack: () => void
}) {
  const good = outcome.good
  return (
    <div className="stack pop">
      <div
        className="card"
        style={{
          background: good ? 'var(--need-wash)' : 'var(--cream)',
          borderColor: good ? 'var(--need-border)' : 'var(--cream-border)',
          boxShadow: `0 5px 0 ${good ? 'var(--need-border)' : 'var(--cream-border)'}`,
          textAlign: 'center',
          padding: '22px 18px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <span
            style={{
              width: 76,
              height: 76,
              borderRadius: 999,
              background: '#fff',
              border: '3px solid var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-hidden="true"
          >
            <Icon
              name={good ? 'check' : 'bulb'}
              color={good ? 'var(--need)' : 'var(--want)'}
              size={38}
              width={2.6}
            />
          </span>
        </div>
        <h2>{good ? 'Получилось!' : 'Разберём вместе'}</h2>
        <p style={{ marginTop: 8 }}>{outcome.explanation}</p>
      </div>

      <div
        className="card"
        style={{
          background: 'var(--need-wash)',
          borderColor: 'var(--need-border)',
          boxShadow: 'none',
        }}
      >
        <div className="row row--between">
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 17 }}>
            Начислено
          </span>
          <span className="num" style={{ fontSize: 26, color: 'var(--need)' }}>
            <Money value={outcome.reward} sign="+" />
          </span>
        </div>
      </div>

      <p className="muted">За задание «{quest.title}».</p>

      <Button variant="good" block onClick={onBack}>
        Дальше
      </Button>
    </div>
  )
}

function ReviewView({ quest, onBack }: { quest: Quest; onBack: () => void }) {
  const { state } = useGame()
  const result = state.quests[quest.id]

  return (
    <>
      <ScreenHead title={quest.title} sub={quest.situation} />

      <Note tone={result.good ? 'good' : 'hint'} title="Задание уже пройдено">
        {result.good
          ? 'Ты решил его верно.'
          : 'Ты его прошёл — и теперь знаешь, как сделать лучше.'}{' '}
        Начислено {result.reward} Ф на неделе {result.periodIndex}.
      </Note>

      <Card>
        <h3>Как рассуждать</h3>
        <p style={{ marginTop: 8 }}>{explanationFor(quest)}</p>
      </Card>

      <Button block onClick={onBack}>
        Назад к заданиям
      </Button>
    </>
  )
}

function explanationFor(quest: Quest): string {
  if (quest.kind === 'choice') {
    const good = quest.options.find((o) => o.good)
    return good ? good.consequence : quest.situation
  }
  return quest.goodExplanation
}
