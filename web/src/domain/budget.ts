import { PLAN_TOLERANCE_ABS } from './rules'
import type { BudgetLane, BudgetPlan, IconName } from './types'

export const EMPTY_PLAN: BudgetPlan = { essential: 0, optional: 0, savings: 0 }

export const LANE_TITLE: Record<BudgetLane, string> = {
  essential: 'Нужное',
  optional: 'Желанное',
  savings: 'Копилка',
}

export const LANE_FULL_TITLE: Record<BudgetLane, string> = {
  essential: 'Обязательные расходы',
  optional: 'Необязательные расходы',
  savings: 'Накопления',
}

export const LANE_ICON: Record<BudgetLane, IconName> = {
  essential: 'bowl',
  optional: 'kite',
  savings: 'jar',
}

export const LANE_CAPTION: Record<BudgetLane, string> = {
  essential: 'Еда, вода, уход',
  optional: 'Игрушки и радости',
  savings: 'Шаг к большой цели',
}

export const LANE_THEME: Record<BudgetLane, { ink: string; wash: string; border: string }> = {
  essential: { ink: 'var(--need)', wash: 'var(--need-wash)', border: 'var(--need-border)' },
  optional: { ink: 'var(--want)', wash: 'var(--want-wash)', border: 'var(--want-border)' },
  savings: { ink: 'var(--save)', wash: 'var(--save-wash)', border: 'var(--save-border)' },
}

// узор — чтобы направление различалось не только цветом
export const LANE_PATTERN: Record<BudgetLane, 'solid' | 'stripes' | 'dots'> = {
  essential: 'solid',
  optional: 'stripes',
  savings: 'dots',
}

export const LANES: BudgetLane[] = ['essential', 'optional', 'savings']

export function planTotal(plan: BudgetPlan): number {
  return plan.essential + plan.optional + plan.savings
}

export function planRemainder(available: number, plan: BudgetPlan): number {
  return available - planTotal(plan)
}

export interface PlanCheck {
  total: number
  remainder: number
  ok: boolean
  problem: string | null
  advice: string | null
}

// Блокирует только перерасход, остальное — подсказки.
export function checkPlan(
  available: number,
  plan: BudgetPlan,
  essentialNeedCost: number,
): PlanCheck {
  const total = planTotal(plan)
  const remainder = available - total

  if (plan.essential < 0 || plan.optional < 0 || plan.savings < 0) {
    return {
      total,
      remainder,
      ok: false,
      problem: 'Сумма не может быть меньше нуля.',
      advice: null,
    }
  }

  if (remainder < 0) {
    return {
      total,
      remainder,
      ok: false,
      problem: `Разложено на ${-remainder} больше, чем есть. Убери лишнее.`,
      advice: null,
    }
  }

  let advice: string | null = null
  if (plan.essential < essentialNeedCost) {
    advice = `На еду и уход обычно нужно около ${essentialNeedCost} фиников. Сейчас в «Нужном» ${plan.essential}.`
  } else if (plan.savings === 0) {
    advice = 'В копилку ничего не отложено. Даже небольшая сумма приближает цель.'
  } else if (remainder > 0) {
    advice = `Ещё не разложено ${remainder} фиников. Их можно добавить в любой конверт.`
  }

  return { total, remainder, ok: true, problem: null, advice }
}

export interface LaneComparison {
  lane: BudgetLane
  planned: number
  actual: number
  diff: number
  kept: boolean
  note: string
}

export function compareLane(
  lane: BudgetLane,
  planned: number,
  actual: number,
): LaneComparison {
  const diff = actual - planned
  const kept =
    lane === 'savings' ? actual + PLAN_TOLERANCE_ABS >= planned : diff <= PLAN_TOLERANCE_ABS

  let note: string
  if (lane === 'savings') {
    if (actual >= planned) note = planned === 0 ? 'Отложено сверх плана.' : 'Отложено как планировали.'
    else note = `Отложено на ${planned - actual} меньше плана.`
  } else if (diff > PLAN_TOLERANCE_ABS) {
    note = `Потрачено на ${diff} больше плана.`
  } else if (diff < -PLAN_TOLERANCE_ABS) {
    note = `Потрачено на ${-diff} меньше плана — осталось свободное.`
  } else {
    note = 'Совпало с планом.'
  }

  return { lane, planned, actual, diff, kept, note }
}

export function comparePlanWithFact(
  plan: BudgetPlan,
  fact: { essential: number; optional: number; savings: number },
): LaneComparison[] {
  return [
    compareLane('essential', plan.essential, fact.essential),
    compareLane('optional', plan.optional, fact.optional),
    compareLane('savings', plan.savings, fact.savings),
  ]
}

export function isPlanKept(
  plan: BudgetPlan,
  fact: { essential: number; optional: number },
): boolean {
  return (
    compareLane('essential', plan.essential, fact.essential).kept &&
    compareLane('optional', plan.optional, fact.optional).kept
  )
}

export function suggestPlan(available: number, essentialNeedCost: number): BudgetPlan {
  const essential = Math.min(available, essentialNeedCost)
  const rest = available - essential
  const savings = Math.round(rest * 0.4)
  const optional = rest - savings
  return { essential, optional, savings }
}
