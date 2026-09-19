import { useState } from 'react'

import { CUSTOM_GOAL_COSTS, CUSTOM_GOAL_SUBJECTS } from '../content/goals'
import { Button, Card, ConfirmSheet, Money, Note, ProgressBar, Screen, Sheet, Stepper } from '../components/ui'
import {
  averageDeposit,
  forecastGoal,
  goalProgress,
  goalRemaining,
  pluralFinik,
  previewWithdraw,
} from '../domain/savings'
import { playSound } from '../platform/sound'
import { useGame } from '../store/gameStore'
import type { Goal } from '../domain/types'

export function SavingsScreen({ onBack }: { onBack: () => void }) {
  const { state, dispatch, activeGoal } = useGame()

  const [depositAmount, setDepositAmount] = useState(() => Math.min(20, state.balance))
  const [withdrawAmount, setWithdrawAmount] = useState(0)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)

  const average = averageDeposit(state.ledger)

  if (!activeGoal) {
    return (
      <Screen title="Выбери цель" onBack={onBack}>
        <Note tone="info" title="Зачем нужна цель">
          Цель — это то, ради чего копят. У неё есть цена, и видно, сколько осталось.
        </Note>
        <GoalPicker onPick={(id) => dispatch({ type: 'chooseGoal', goalId: id })} />
        <Button variant="secondary" block onClick={() => setCustomOpen(true)}>
          ✏️ Придумать свою цель
        </Button>
        <CustomGoalSheet
          open={customOpen}
          onClose={() => setCustomOpen(false)}
          onCreate={(goal) => {
            dispatch({ type: 'addCustomGoal', goal })
            setCustomOpen(false)
          }}
        />
      </Screen>
    )
  }

  const forecast = forecastGoal(activeGoal, average)
  const remaining = goalRemaining(activeGoal)
  const maxDeposit = Math.min(state.balance, remaining > 0 ? remaining : state.balance)
  const preview = previewWithdraw(activeGoal, withdrawAmount, average)

  return (
    <Screen title="Копилка" onBack={onBack}>
      <Card>
        <div className="row">
          <span style={{ fontSize: 44 }} aria-hidden="true">
            {activeGoal.emoji}
          </span>
          <div style={{ minWidth: 0 }}>
            <h2>{activeGoal.title}</h2>
            <p className="muted">{activeGoal.caption}</p>
          </div>
        </div>

        <div style={{ marginTop: 'var(--sp-3)' }} className="stack stack--tight">
          <ProgressBar value={goalProgress(activeGoal)} label={activeGoal.title} />
          <div className="row row--between">
            <span className="muted">Накоплено</span>
            <span className="money">
              {activeGoal.saved} из {activeGoal.cost} Ф
            </span>
          </div>
          <div className="row row--between">
            <span className="muted">Осталось накопить</span>
            <span className="money">
              {remaining} {pluralFinik(remaining)}
            </span>
          </div>
        </div>
      </Card>

      <Note tone={forecast.periods === 0 ? 'good' : 'info'} title="Когда накопим">
        {forecast.explanation}
      </Note>

      {remaining > 0 && (
        <Card>
          <h3>Отложить в копилку</h3>
          <p className="muted" style={{ margin: '4px 0 12px' }}>
            Свободно: <Money value={state.balance} />
          </p>

          <Stepper
            value={Math.min(depositAmount, maxDeposit)}
            onChange={setDepositAmount}
            max={maxDeposit}
            step={10}
            label="Сумма пополнения"
          />

          <div style={{ marginTop: 'var(--sp-3)' }}>
            <Button
              block
              large
              disabled={maxDeposit <= 0 || depositAmount <= 0}
              onClick={() => {
                dispatch({ type: 'deposit', amount: Math.min(depositAmount, maxDeposit) })
                playSound('coin')
              }}
            >
              🐷 Отложить {Math.min(depositAmount, maxDeposit)} Ф
            </Button>
            {maxDeposit <= 0 && (
              <p className="muted" style={{ marginTop: 8 }}>
                Свободных фиников нет. Выполни задание или дождись следующей недели.
              </p>
            )}
          </div>
        </Card>
      )}

      {activeGoal.saved >= activeGoal.cost && (
        <Note tone="good" title="Цель накоплена!">
          Ты накопил на «{activeGoal.title}». Можно выбрать новую цель и копить дальше.
        </Note>
      )}

      {activeGoal.saved > 0 && (
        <Button
          variant="ghost"
          block
          onClick={() => {
            setWithdrawAmount(Math.min(10, activeGoal.saved))
            setWithdrawOpen(true)
          }}
        >
          Снять из копилки
        </Button>
      )}

      <Button variant="secondary" block onClick={() => dispatch({ type: 'chooseGoal', goalId: '' })}>
        🎯 Выбрать другую цель
      </Button>

      {/* Снятие: предпросмотр последствий */}
      <Sheet open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Снять из копилки">
        <div className="stack">
          <p>Сколько снять?</p>
          <Stepper
            value={withdrawAmount}
            onChange={setWithdrawAmount}
            max={activeGoal.saved}
            step={10}
            label="Сумма снятия"
          />

          <Note tone="warn" title="Что изменится">
            <div className="stack stack--tight">
              <span>{preview.warning}</span>
              <span className="muted">{preview.forecastAfter.explanation}</span>
            </div>
          </Note>

          <Button
            variant="danger"
            block
            large
            disabled={withdrawAmount <= 0}
            onClick={() => setConfirmWithdraw(true)}
          >
            Снять {withdrawAmount} Ф
          </Button>
          <Button variant="ghost" block onClick={() => setWithdrawOpen(false)}>
            Оставить в копилке
          </Button>
        </div>
      </Sheet>

      <ConfirmSheet
        open={confirmWithdraw}
        title="Точно снять?"
        tone="danger"
        details={preview.warning}
        confirmLabel={`Да, снять ${withdrawAmount} Ф`}
        cancelLabel="Нет, передумал"
        onConfirm={() => {
          dispatch({ type: 'withdraw', amount: withdrawAmount, purpose: activeGoal.title })
          setConfirmWithdraw(false)
          setWithdrawOpen(false)
        }}
        onCancel={() => setConfirmWithdraw(false)}
      />
    </Screen>
  )
}

function GoalPicker({ onPick }: { onPick: (id: string) => void }) {
  const { state } = useGame()
  return (
    <div className="stack">
      {state.goals.map((g) => (
        <button key={g.id} className="item" onClick={() => onPick(g.id)}>
          <span className="item__emoji" aria-hidden="true">
            {g.emoji}
          </span>
          <span className="stack stack--tight" style={{ minWidth: 0 }}>
            <span className="item__title">{g.title}</span>
            <span className="muted">{g.caption}</span>
            {g.saved > 0 && (
              <span className="muted">Уже накоплено: {g.saved} Ф</span>
            )}
          </span>
          <span className="money">{g.cost} Ф</span>
        </button>
      ))}
    </div>
  )
}

function CustomGoalSheet({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (goal: Goal) => void
}) {
  const [subjectId, setSubjectId] = useState(CUSTOM_GOAL_SUBJECTS[0].id)
  const [cost, setCost] = useState(CUSTOM_GOAL_COSTS[1])
  const subject = CUSTOM_GOAL_SUBJECTS.find((s) => s.id === subjectId)!

  return (
    <Sheet open={open} onClose={onClose} title="Своя цель">
      <div className="stack">
        <p>На что копим?</p>
        <div className="tiles" role="radiogroup" aria-label="На что копим">
          {CUSTOM_GOAL_SUBJECTS.map((s) => (
            <button
              key={s.id}
              role="radio"
              aria-checked={subjectId === s.id}
              className="tile tile--rel"
              onClick={() => setSubjectId(s.id)}
            >
              {subjectId === s.id && (
                <span className="tile__check" aria-hidden="true">
                  ✓
                </span>
              )}
              <span style={{ fontSize: 28 }} aria-hidden="true">
                {s.emoji}
              </span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        <p>Сколько стоит?</p>
        <div className="tiles" role="radiogroup" aria-label="Стоимость цели">
          {CUSTOM_GOAL_COSTS.map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={cost === c}
              className="tile tile--rel"
              onClick={() => setCost(c)}
            >
              {cost === c && (
                <span className="tile__check" aria-hidden="true">
                  ✓
                </span>
              )}
              <span style={{ fontSize: 20, fontWeight: 800 }}>{c} Ф</span>
            </button>
          ))}
        </div>

        <Button
          block
          large
          onClick={() =>
            onCreate({
              id: `custom-${subject.id}-${cost}`,
              title: subject.title,
              emoji: subject.emoji,
              cost,
              caption: 'Твоя собственная цель.',
              custom: true,
              saved: 0,
              achievedAtPeriod: null,
            })
          }
        >
          Копить на {subject.title.toLowerCase()}
        </Button>
        <Button variant="ghost" block onClick={onClose}>
          Отмена
        </Button>
      </div>
    </Sheet>
  )
}
