// Кнопка не блокируется требованием «остаток = 0»: ТЗ требует только не выходить за бюджет.
import { useEffect, useState } from 'react'

import {
  LANE_CAPTION,
  LANE_ICON,
  LANE_PATTERN,
  LANE_THEME,
  LANE_TITLE,
  LANES,
  checkPlan,
  comparePlanWithFact,
  planTotal,
  suggestPlan,
} from '../domain/budget'
import { ESSENTIAL_NEED_COST } from '../domain/rules'
import { Icon } from '../components/Icon'
import {
  Button,
  Card,
  ConfirmSheet,
  Money,
  Note,
  ProgressBar,
  ScreenHead,
  Stepper,
} from '../components/ui'
import { useGame } from '../store/gameStore'
import type { BudgetLane, BudgetPlan } from '../domain/types'
import type { Route } from '../navigation'

export function BudgetScreen({ go }: { go: (r: Route) => void }) {
  const { state, dispatch } = useGame()

  const available = state.balance
  const [draft, setDraft] = useState<BudgetPlan>(
    () => state.plan ?? suggestPlan(available, ESSENTIAL_NEED_COST),
  )
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (state.planConfirmed && state.plan) setDraft(state.plan)
  }, [state.planConfirmed, state.plan])

  if (state.planConfirmed && state.plan) return <PlanVsFact go={go} />

  const check = checkPlan(available, draft, ESSENTIAL_NEED_COST)

  const setLane = (lane: BudgetLane, value: number) => {
    const others = planTotal(draft) - draft[lane]
    const max = Math.max(0, available - others)
    setDraft({ ...draft, [lane]: Math.min(value, max) })
  }

  return (
    <>
      <ScreenHead
        title="План на неделю"
        sub={`Разложи ${available} фиников по трём конвертам. Сначала — то, без чего нельзя.`}
      />

      {LANES.map((lane) => {
        const theme = LANE_THEME[lane]
        const others = planTotal(draft) - draft[lane]
        const max = Math.max(0, available - others)
        const pct = available > 0 ? draft[lane] / available : 0
        return (
          <div
            key={lane}
            className="lane"
            style={{ background: theme.wash, borderColor: theme.border, boxShadow: `0 5px 0 ${theme.border}` }}
          >
            <div className="lane__flap" style={{ background: theme.border }} aria-hidden="true" />
            <div className="lane__body">
              <div className="row">
                <span className="glyph" style={{ background: theme.ink }} aria-hidden="true">
                  <Icon name={LANE_ICON[lane]} color="#fff" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="lane__title" style={{ display: 'block' }}>
                    {LANE_TITLE[lane]}
                  </span>
                  <span className="lane__caption">{LANE_CAPTION[lane]}</span>
                </span>
              </div>

              <Stepper
                value={draft[lane]}
                onChange={(v) => setLane(lane, v)}
                max={max}
                step={10}
                label={LANE_TITLE[lane]}
              />

              <span className="bar bar--onwash">
                <span
                  className={`bar__fill${
                    LANE_PATTERN[lane] === 'solid' ? '' : ` bar__fill--${LANE_PATTERN[lane]}`
                  }`}
                  style={{ width: `${pct * 100}%`, background: theme.ink }}
                />
              </span>
            </div>
          </div>
        )
      })}

      <Card>
        <div className="row row--between">
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 17 }}>
            Не разложено
          </span>
          <span
            className="num"
            style={{ fontSize: 24, color: check.remainder === 0 ? 'var(--need)' : 'var(--ink)' }}
          >
            {check.remainder} Ф{check.remainder === 0 && ' ✓'}
          </span>
        </div>
      </Card>

      {check.problem ? (
        <Note tone="danger" title="Так не получится">
          {check.problem}
        </Note>
      ) : (
        check.advice && <Note tone="hint">{check.advice}</Note>
      )}

      <Button block disabled={!check.ok} onClick={() => setConfirming(true)}>
        Подтвердить план
      </Button>
      <Button
        variant="quiet"
        block
        onClick={() => setDraft(suggestPlan(available, ESSENTIAL_NEED_COST))}
      >
        Разложить как обычно
      </Button>

      <p className="muted">План можно менять сколько угодно, пока не нажал «Подтвердить».</p>

      <ConfirmSheet
        open={confirming}
        title="Подтвердить план?"
        details={
          <div className="stack stack--tight">
            <span>
              Нужное — {draft.essential} Ф, Желанное — {draft.optional} Ф, Копилка — {draft.savings} Ф.
            </span>
            <span>После подтверждения мы будем сравнивать с ним настоящие траты.</span>
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
    </>
  )
}

function PlanVsFact({ go }: { go: (r: Route) => void }) {
  const { state } = useGame()
  const plan = state.plan!
  const fact = {
    essential: state.period.essentialSpent,
    optional: state.period.optionalSpent,
    savings: state.period.savedThisPeriod,
  }
  const rows = comparePlanWithFact(plan, fact)

  return (
    <>
      <ScreenHead title="План и факт" sub="План на эту неделю подтверждён. Теперь видно, как траты сходятся с ним." />

      {rows.map((row) => {
        const theme = LANE_THEME[row.lane]
        const max = Math.max(row.planned, row.actual, 1)
        return (
          <div
            key={row.lane}
            className="lane"
            style={{ background: theme.wash, borderColor: theme.border, boxShadow: `0 5px 0 ${theme.border}` }}
          >
            <div className="lane__flap" style={{ background: theme.border }} aria-hidden="true" />
            <div className="lane__body">
              <div className="row row--between">
                <span className="row" style={{ gap: 8 }}>
                  <Icon name={LANE_ICON[row.lane]} color={theme.ink} size={22} />
                  <span className="lane__title">{LANE_TITLE[row.lane]}</span>
                </span>
                <span className="tag" style={{ background: '#fff', color: theme.ink }}>
                  <Icon name={row.kept ? 'check' : 'bulb'} size={15} width={2.6} />
                  {row.kept ? 'по плану' : 'иначе'}
                </span>
              </div>

              <div className="stack stack--tight">
                <BarRow label="План" value={row.planned} max={max} color={theme.ink} ghost />
                <BarRow label="Факт" value={row.actual} max={max} color={theme.ink} />
              </div>

              <p className="muted">{row.note}</p>
            </div>
          </div>
        )
      })}

      <Button block icon="cart" onClick={() => go('shop')}>
        Перейти к покупкам
      </Button>
      <Button variant="quiet" block onClick={() => go('summary')}>
        Завершить неделю
      </Button>
    </>
  )
}

function BarRow({
  label,
  value,
  max,
  color,
  ghost,
}: {
  label: string
  value: number
  max: number
  color: string
  ghost?: boolean
}) {
  return (
    <div className="row" style={{ gap: 8 }}>
      <span className="muted" style={{ width: 44 }}>
        {label}
      </span>
      <span style={{ flex: 1 }}>
        <ProgressBar value={value / max} label={label} color={color} />
      </span>
      <span className="num" style={{ width: 58, textAlign: 'right', opacity: ghost ? 0.7 : 1 }}>
        <Money value={value} />
      </span>
    </div>
  )
}
