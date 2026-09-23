import { useState } from 'react'

import { CUSTOM_GOAL_COSTS, CUSTOM_GOAL_SUBJECTS } from '../content/goals'
import { Icon } from '../components/Icon'
import {
  Button,
  Card,
  ConfirmSheet,
  Glyph,
  Money,
  Note,
  ProgressRing,
  RowButton,
  ScreenHead,
  Sheet,
  Stepper,
} from '../components/ui'
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

export function SavingsScreen() {
  const { state, dispatch, activeGoal } = useGame()

  const [depositAmount, setDepositAmount] = useState(() => Math.min(20, state.balance))
  const [withdrawAmount, setWithdrawAmount] = useState(0)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)

  const average = averageDeposit(state.ledger)

  if (!activeGoal) {
    return (
      <>
        <ScreenHead title="Выбери цель" sub="Цель — это то, ради чего копят. У неё есть цена, и видно, сколько осталось." />
        <div className="stack">
          {state.goals.map((g) => (
            <RowButton
              key={g.id}
              icon={g.icon}
              wash="var(--save-wash)"
              color="var(--save)"
              title={g.title}
              sub={g.caption}
              note={g.saved > 0 ? `уже накоплено ${g.saved} Ф` : undefined}
              noteColor="var(--save-deep)"
              right={<span className="row-btn__price">{g.cost} Ф</span>}
              onClick={() => dispatch({ type: 'chooseGoal', goalId: g.id })}
            />
          ))}
        </div>
        <Button variant="quiet" block icon="plus" onClick={() => setCustomOpen(true)}>
          Придумать свою цель
        </Button>
        <CustomGoalSheet
          open={customOpen}
          onClose={() => setCustomOpen(false)}
          onCreate={(goal) => {
            dispatch({ type: 'addCustomGoal', goal })
            setCustomOpen(false)
          }}
        />
      </>
    )
  }

  const forecast = forecastGoal(activeGoal, average)
  const remaining = goalRemaining(activeGoal)
  const maxDeposit = Math.min(state.balance, remaining > 0 ? remaining : state.balance)
  const preview = previewWithdraw(activeGoal, withdrawAmount, average)

  return (
    <>
      <ScreenHead title="Копилка" sub="Откладывай сразу, как появились финики — так цель придёт быстрее." />

      <Card
        style={{
          background: 'var(--save-wash)',
          borderColor: 'var(--save-border)',
          boxShadow: '0 5px 0 var(--save-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          textAlign: 'center',
        }}
      >
        <div className="row" style={{ gap: 9 }}>
          <Glyph name={activeGoal.icon} wash="var(--save)" color="#fff" size="sm" />
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 19 }}>
            {activeGoal.title}
          </span>
        </div>

        <ProgressRing value={goalProgress(activeGoal)} label={activeGoal.title} />

        <div>
          <div className="num" style={{ fontSize: 32, color: 'var(--save-deep)', lineHeight: 1 }}>
            {activeGoal.saved} / {activeGoal.cost}
          </div>
          <div className="muted" style={{ color: 'var(--save-ink)', marginTop: 5 }}>
            осталось {remaining} {pluralFinik(remaining)}
          </div>
        </div>
      </Card>

      <Note tone={forecast.periods === 0 ? 'good' : 'info'} title="Когда накопим">
        {forecast.explanation}
      </Note>

      {remaining > 0 && (
        <Card>
          <div className="stack">
            <h3>Отложить в копилку</h3>
            <Stepper
              value={Math.min(depositAmount, maxDeposit)}
              onChange={setDepositAmount}
              max={maxDeposit}
              step={10}
              label="Сумма пополнения"
            />
            <Button
              variant="save"
              block
              icon="jar"
              disabled={maxDeposit <= 0 || depositAmount <= 0}
              onClick={() => {
                dispatch({ type: 'deposit', amount: Math.min(depositAmount, maxDeposit) })
                playSound('coin')
              }}
            >
              Отложить {Math.min(depositAmount, maxDeposit)} Ф
            </Button>
            <p className="muted">
              Свободно сейчас: <Money value={state.balance} />.
              {maxDeposit <= 0 && ' Выполни задание или дождись следующей недели.'}
            </p>
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
          variant="quiet"
          block
          onClick={() => {
            setWithdrawAmount(Math.min(10, activeGoal.saved))
            setWithdrawOpen(true)
          }}
        >
          Снять из копилки
        </Button>
      )}

      <Button variant="quiet" block icon="target" onClick={() => dispatch({ type: 'chooseGoal', goalId: '' })}>
        Выбрать другую цель
      </Button>

      {/* Снятие: предпросмотр последствий */}
      <Sheet open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Снять из копилки">
        <h2>Снять из копилки</h2>
        <Stepper
          value={withdrawAmount}
          onChange={setWithdrawAmount}
          max={activeGoal.saved}
          step={10}
          label="Сумма снятия"
        />
        <Note tone="hint" title="Что изменится">
          <div className="stack stack--tight">
            <span>{preview.warning}</span>
            <span className="muted">{preview.forecastAfter.explanation}</span>
          </div>
        </Note>
        <Button
          variant="danger"
          block
          disabled={withdrawAmount <= 0}
          onClick={() => setConfirmWithdraw(true)}
        >
          Снять {withdrawAmount} Ф
        </Button>
        <Button variant="quiet" block onClick={() => setWithdrawOpen(false)}>
          Оставить в копилке
        </Button>
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
    </>
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
      <h2>Своя цель</h2>

      <p>На что копим?</p>
      <div className="tiles" role="radiogroup" aria-label="На что копим">
        {CUSTOM_GOAL_SUBJECTS.map((s) => (
          <button
            key={s.id}
            role="radio"
            aria-checked={subjectId === s.id}
            className="tile"
            onClick={() => setSubjectId(s.id)}
          >
            {subjectId === s.id && (
              <span className="tile__check" aria-hidden="true">
                <Icon name="check" color="#fff" size={14} width={3} />
              </span>
            )}
            <Icon name={s.icon} size={28} color="var(--brand)" />
            {s.title}
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
            className="tile"
            style={{ minHeight: 64 }}
            onClick={() => setCost(c)}
          >
            {cost === c && (
              <span className="tile__check" aria-hidden="true">
                <Icon name="check" color="#fff" size={14} width={3} />
              </span>
            )}
            <span className="num" style={{ fontSize: 20 }}>
              {c} Ф
            </span>
          </button>
        ))}
      </div>

      <Button
        variant="save"
        block
        onClick={() =>
          onCreate({
            id: `custom-${subject.id}-${cost}`,
            title: subject.title,
            icon: subject.icon,
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
      <Button variant="quiet" block onClick={onClose}>
        Отмена
      </Button>
    </Sheet>
  )
}
