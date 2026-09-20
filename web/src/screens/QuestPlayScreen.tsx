import { useMemo, useState } from 'react'

import { questById } from '../content/quests'
import { Button, Card, Money, Note, Screen, Stepper } from '../components/ui'
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

export function QuestPlayScreen({
  questId,
  onBack,
}: {
  questId: string
  onBack: () => void
}) {
  const { state, submitQuest } = useGame()
  const quest = questById(questId)
  const [outcome, setOutcome] = useState<QuestOutcome | null>(null)

  const alreadyDone = Boolean(state.quests[questId])

  if (!quest) {
    return (
      <Screen title="Задание" onBack={onBack}>
        <Note tone="warn">Такого задания нет.</Note>
      </Screen>
    )
  }

  const submit = (answer: QuestAnswer) => {
    const result = submitQuest(questId, answer)
    playSound(result.good ? 'success' : 'tap')
    setOutcome(result)
  }

  if (outcome) {
    return <OutcomeView quest={quest} outcome={outcome} onBack={onBack} />
  }

  if (alreadyDone) {
    return <ReviewView quest={quest} onBack={onBack} />
  }

  return (
    <Screen title={quest.title} onBack={onBack}>
      <Card>
        <p style={{ fontSize: 18 }}>{quest.situation}</p>
        <p className="muted" style={{ marginTop: 8 }}>
          {quest.task}
        </p>
      </Card>

      {renderPlayer(quest, submit)}
    </Screen>
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

function AllocatePlayer({
  quest,
  submit,
}: {
  quest: AllocateQuest
  submit: (a: QuestAnswer) => void
}) {
  const [lanes, setLanes] = useState<Record<string, number>>(
    () => Object.fromEntries(quest.lanes.map((l) => [l.id, 0])),
  )
  const total = Object.values(lanes).reduce((a, b) => a + b, 0)
  const left = quest.amount - total

  return (
    <>
      <Card>
        <div className="row row--between">
          <span style={{ fontWeight: 700 }}>Осталось разложить</span>
          <span style={{ fontSize: 22, color: left === 0 ? 'var(--c-good)' : undefined }}>
            <Money value={left} />
            {left === 0 && <span aria-hidden="true"> ✓</span>}
          </span>
        </div>
      </Card>

      {quest.lanes.map((lane) => {
        const others = total - lanes[lane.id]
        const max = Math.max(0, quest.amount - others)
        return (
          <div key={lane.id} className={`lane lane--${lane.id}`}>
            <div style={{ fontWeight: 800, marginBottom: 'var(--sp-2)' }}>
              <span aria-hidden="true">{lane.emoji}</span> {lane.title}
            </div>
            <Stepper
              value={lanes[lane.id]}
              onChange={(v) => setLanes({ ...lanes, [lane.id]: Math.min(v, max) })}
              max={max}
              step={10}
              label={lane.title}
            />
          </div>
        )
      })}

      <Button
        block
        large
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
  const spent = quest.options
    .filter((o) => selected.includes(o.id))
    .reduce((a, o) => a + o.price, 0)
  const left = quest.budget - spent

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <>
      <Card>
        <div className="row row--between">
          <span style={{ fontWeight: 700 }}>Осталось денег</span>
          <span style={{ fontSize: 22, color: left < 0 ? 'var(--c-danger)' : undefined }}>
            <Money value={left} />
            {left < 0 && <span aria-hidden="true"> ⚠</span>}
          </span>
        </div>
        {left < 0 && (
          <p style={{ color: 'var(--c-danger)', marginTop: 8 }}>
            В корзине больше, чем есть денег. Убери что-нибудь.
          </p>
        )}
      </Card>

      <div className="stack">
        {quest.options.map((o) => {
          const picked = selected.includes(o.id)
          return (
            <button
              key={o.id}
              className="item"
              aria-pressed={picked}
              onClick={() => toggle(o.id)}
            >
              <span className="item__emoji" aria-hidden="true">
                {o.emoji}
              </span>
              <span className="stack stack--tight" style={{ minWidth: 0 }}>
                <span className="item__title">{o.title}</span>
                <span className="muted">{picked ? '✓ в корзине' : 'нажми, чтобы положить'}</span>
              </span>
              <span className="money">{o.price} Ф</span>
            </button>
          )
        })}
      </div>

      <Button block large onClick={() => submit({ kind: 'basket', selected })}>
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

  const byId = useMemo(
    () => Object.fromEntries(quest.items.map((i) => [i.id, i])),
    [quest.items],
  )

  return (
    <>
      <Note tone="info">Стрелками подними наверх самое важное.</Note>

      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">
        {order.map((id, index) => (
          <li key={id} className="item" style={{ cursor: 'default' }}>
            <span className="item__emoji" aria-hidden="true">
              {byId[id].emoji}
            </span>
            <span className="stack stack--tight" style={{ minWidth: 0 }}>
              <span className="item__title">
                {index + 1}. {byId[id].title}
              </span>
            </span>
            <span className="row" style={{ gap: 4 }}>
              <button
                className="stepper__btn"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`${byId[id].title}: поднять выше`}
              >
                ↑
              </button>
              <button
                className="stepper__btn"
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

      <Button block large onClick={() => submit({ kind: 'order', order })}>
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
          <span style={{ fontWeight: 700 }}>Твой ответ ({quest.unit})</span>
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            style={{ fontSize: 24, textAlign: 'center' }}
          />
        </label>
      </Card>

      {!showHint ? (
        <Button variant="ghost" block onClick={() => setShowHint(true)}>
          💡 Подсказка
        </Button>
      ) : (
        <Note tone="warn" title="Подсказка">
          {quest.hint}
        </Note>
      )}

      <Button
        block
        large
        disabled={!valid}
        onClick={() => submit({ kind: 'number', value: parsed })}
      >
        Ответить
      </Button>
    </>
  )
}

function ChoicePlayer({ quest, submit }: { quest: ChoiceQuest; submit: (a: QuestAnswer) => void }) {
  return (
    <div className="stack">
      {quest.options.map((o) => (
        <button
          key={o.id}
          className="item"
          onClick={() => submit({ kind: 'choice', optionId: o.id })}
        >
          <span className="item__emoji" aria-hidden="true">
            {o.emoji}
          </span>
          <span className="stack stack--tight" style={{ minWidth: 0 }}>
            <span className="item__title">{o.title}</span>
          </span>
          <span aria-hidden="true">›</span>
        </button>
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
  return (
    <Screen title={quest.title} onBack={onBack}>
      <Card>
        <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 56 }} aria-hidden="true">
            {outcome.good ? '🎉' : '💡'}
          </div>
          <h2>{outcome.good ? 'Получилось!' : 'Разберём вместе'}</h2>
          <p style={{ fontSize: 18 }}>{outcome.explanation}</p>
        </div>
      </Card>

      <Note tone="good" title="Начислено">
        <span style={{ fontSize: 20 }}>
          <Money value={outcome.reward} sign="+" />
        </span>{' '}
        за задание «{quest.title}».
      </Note>

      <Button block large onClick={onBack}>
        Дальше
      </Button>
    </Screen>
  )
}

function ReviewView({ quest, onBack }: { quest: Quest; onBack: () => void }) {
  const { state } = useGame()
  const result = state.quests[quest.id]

  return (
    <Screen title={quest.title} onBack={onBack}>
      <Card>
        <p style={{ fontSize: 18 }}>{quest.situation}</p>
        <p className="muted" style={{ marginTop: 8 }}>
          {quest.task}
        </p>
      </Card>

      <Note tone={result.good ? 'good' : 'warn'} title="Задание уже пройдено">
        {result.good
          ? 'Ты решил его верно.'
          : 'Ты его прошёл — и теперь знаешь, как сделать лучше.'}{' '}
        Начислено {result.reward} Ф на неделе {result.periodIndex}.
      </Note>

      <Card>
        <h3>Как рассуждать</h3>
        <p style={{ marginTop: 8 }}>{explanationFor(quest)}</p>
      </Card>

      <Button block large onClick={onBack}>
        Назад к заданиям
      </Button>
    </Screen>
  )
}

function explanationFor(quest: Quest): string {
  if (quest.kind === 'choice') {
    const good = quest.options.find((o) => o.good)
    return good ? good.consequence : quest.situation
  }
  return quest.goodExplanation
}
