import { useEffect, useState } from 'react'

import {
  LANE_EMOJI,
  LANE_FULL_TITLE,
  LANE_TITLE,
  LANES,
  checkPlan,
  comparePlanWithFact,
  planTotal,
  suggestPlan,
} from '../domain/budget'
import { ESSENTIAL_NEED_COST } from '../domain/rules'
import { Button, Card, ConfirmSheet, Money, Note, Screen, Stepper } from '../components/ui'
import { useGame } from '../store/gameStore'
import type { BudgetLane, BudgetPlan } from '../domain/types'
import type { Route } from '../navigation'

export function BudgetScreen({ go, onBack }: { go: (r: Route) => void; onBack: () => void }) {
  const { state, dispatch } = useGame()

  const available = state.balance
  const [draft, setDraft] = useState<BudgetPlan>(
    () => state.plan ?? suggestPlan(available, ESSENTIAL_NEED_COST),
  )
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (state.planConfirmed && state.plan) setDraft(state.plan)
  }, [state.planConfirmed, state.plan])

  if (state.planConfirmed && state.plan) {
    return <PlanVsFact onBack={onBack} go={go} />
  }

  const check = checkPlan(available, draft, ESSENTIAL_NEED_COST)

  const setLane = (lane: BudgetLane, value: number) => {
    const others = planTotal(draft) - draft[lane]
    const max = Math.max(0, available - others)
    setDraft({ ...draft, [lane]: Math.min(value, max) })
  }

  return (
    <Screen title="План на неделю" onBack={onBack}>
      <Card>
        <div className="row row--between">
          <span style={{ fontWeight: 700 }}>Всего на неделю</span>
          <span style={{ fontSize: 22 }}>
            <Money value={available} />
          </span>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          Разложи финики по трём конвертам. Сначала — то, без чего нельзя.
        </p>
      </Card>

      {LANES.map((lane) => {
        const others = planTotal(draft) - draft[lane]
        const max = Math.max(0, available - others)
        return (
          <div key={lane} className={`lane lane--${lane}`}>
            <div className="row row--between" style={{ marginBottom: 'var(--sp-2)' }}>
              <span style={{ fontWeight: 800 }}>
                <span aria-hidden="true">{LANE_EMOJI[lane]}</span> {LANE_TITLE[lane]}
              </span>
              <span className="muted">{LANE_FULL_TITLE[lane]}</span>
            </div>

            <Stepper
              value={draft[lane]}
              onChange={(v) => setLane(lane, v)}
              max={max}
              step={10}
              label={LANE_FULL_TITLE[lane]}
            />

            <input
              type="range"
              min={0}
              max={max}
              step={5}
              value={draft[lane]}
              onChange={(e) => setLane(lane, Number(e.target.value))}
              aria-label={`${LANE_FULL_TITLE[lane]}: точная настройка`}
            />

            <div className={`lane__bar lane__bar--${lane}`} style={{ width: `${available > 0 ? (draft[lane] / available) * 100 : 0}%` }} />
          </div>
        )
      })}

      <Card>
        <div className="row row--between">
          <span style={{ fontWeight: 700 }}>Не разложено</span>
          <span style={{ fontSize: 22, color: check.remainder === 0 ? 'var(--c-good)' : undefined }}>
            <Money value={check.remainder} />
            {check.remainder === 0 && <span aria-hidden="true"> ✓</span>}
          </span>
        </div>
      </Card>

      {check.problem && (
        <Note tone="danger" title="Так не получится">
          {check.problem}
        </Note>
      )}
      {!check.problem && check.advice && <Note tone="warn">{check.advice}</Note>}

      <Button
        block
        large
        disabled={!check.ok}
        onClick={() => setConfirming(true)}
      >
        Подтвердить план
      </Button>

      <Button
        variant="ghost"
        block
        onClick={() => setDraft(suggestPlan(available, ESSENTIAL_NEED_COST))}
      >
        Разложить как обычно
      </Button>

      <p className="muted">
        План можно менять сколько угодно, пока не нажал «Подтвердить».
      </p>

      <ConfirmSheet
        open={confirming}
        title="Подтвердить план?"
        tone="info"
        details={
          <div className="stack stack--tight">
            <span>
              Нужное — {draft.essential} Ф, Желанное — {draft.optional} Ф, Копилка — {draft.savings} Ф.
            </span>
            <span>После подтверждения мы будем сравнивать с ним твои настоящие траты.</span>
          </div>
        }
        confirmLabel="Да, это мой план"
        onConfirm={() => {
          dispatch({ type: 'setPlan', plan: draft })
          dispatch({ type: 'confirmPlan' })
          setConfirming(false)
        }}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  )
}

function PlanVsFact({ onBack, go }: { onBack: () => void; go: (r: Route) => void }) {
  const { state } = useGame()
  const plan = state.plan!
  const fact = {
    essential: state.period.essentialSpent,
    optional: state.period.optionalSpent,
    savings: state.period.savedThisPeriod,
  }
  const rows = comparePlanWithFact(plan, fact)

  return (
    <Screen title="План и факт" onBack={onBack}>
      <Note tone="info" title="План на эту неделю подтверждён">
        Теперь видно, как настоящие траты сходятся с планом.
      </Note>

      {rows.map((row) => (
        <div key={row.lane} className={`lane lane--${row.lane}`}>
          <div className="row row--between">
            <span style={{ fontWeight: 800 }}>
              <span aria-hidden="true">{LANE_EMOJI[row.lane]}</span> {LANE_TITLE[row.lane]}
            </span>
            <span aria-hidden="true">{row.kept ? '✓' : '!'}</span>
          </div>

          <div className="stack stack--tight" style={{ marginTop: 'var(--sp-2)' }}>
            <BarRow label="План" value={row.planned} max={Math.max(row.planned, row.actual, 1)} lane={row.lane} ghost />
            <BarRow label="Факт" value={row.actual} max={Math.max(row.planned, row.actual, 1)} lane={row.lane} />
          </div>

          <p className="muted" style={{ marginTop: 'var(--sp-2)' }}>
            {row.note}
          </p>
        </div>
      ))}

      <Button block large onClick={() => go('shop')}>
        🛒 Перейти к покупкам
      </Button>
      <Button variant="ghost" block onClick={() => go('summary')}>
        Завершить неделю
      </Button>
    </Screen>
  )
}

function BarRow({
  label,
  value,
  max,
  lane,
  ghost,
}: {
  label: string
  value: number
  max: number
  lane: BudgetLane
  ghost?: boolean
}) {
  return (
    <div className="row" style={{ gap: 'var(--sp-2)' }}>
      <span className="muted" style={{ width: 44 }}>
        {label}
      </span>
      <div style={{ flex: 1, background: 'rgba(255,255,255,.65)', borderRadius: 999, height: 12 }}>
        <div
          className={`lane__bar lane__bar--${lane}`}
          style={{ width: `${(value / max) * 100}%`, opacity: ghost ? 0.45 : 1 }}
        />
      </div>
      <span className="money" style={{ width: 56, textAlign: 'right' }}>
        {value} Ф
      </span>
    </div>
  )
}
