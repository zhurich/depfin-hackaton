import { compareLane, isPlanKept } from './budget'
import { decayStats, stageForGrowth } from './pet'
import { pluralFinik } from './savings'
import {
  ESSENTIAL_NEED_COST,
  GROWTH_POINTS,
  NEEDS_THRESHOLD,
  PERIOD_DECAY,
  PLAN_TOLERANCE_ABS,
} from './rules'
import type { BudgetPlan, PeriodSummary, PetStats } from './types'

export interface SettlementInput {
  periodIndex: number
  income: number
  plan: BudgetPlan
  fact: { essential: number; optional: number; savings: number }
  stats: PetStats
  growthBefore: number
}

export interface SettlementResult {
  summary: PeriodSummary
  growthAfter: number
  statsNext: PetStats
}

export function settlePeriod(input: SettlementInput): SettlementResult {
  const { plan, fact, stats } = input

  const needsCovered =
    stats.fullness >= NEEDS_THRESHOLD && stats.care >= NEEDS_THRESHOLD

  const planKept = isPlanKept(plan, fact)

  // план «отложить 0» не засчитывается
  const savedAsPlanned =
    fact.savings > 0 && fact.savings + PLAN_TOLERANCE_ABS >= plan.savings

  const growthGained =
    (needsCovered ? GROWTH_POINTS.needsCovered : 0) +
    (planKept ? GROWTH_POINTS.planKept : 0) +
    (savedAsPlanned ? GROWTH_POINTS.savedAsPlanned : 0)

  const growthAfter = input.growthBefore + growthGained

  const notes = buildNotes({ needsCovered, planKept, savedAsPlanned, plan, fact, stats })
  const nextStep = buildNextStep({ needsCovered, planKept, savedAsPlanned, plan, fact })

  const summary: PeriodSummary = {
    index: input.periodIndex,
    income: input.income,
    plan,
    fact,
    needsCovered,
    planKept,
    savedAsPlanned,
    growthGained,
    stageIdAfter: stageForGrowth(growthAfter).id,
    notes,
    nextStep,
  }

  return {
    summary,
    growthAfter,
    statsNext: decayStats(stats, PERIOD_DECAY),
  }
}

function buildNotes(args: {
  needsCovered: boolean
  planKept: boolean
  savedAsPlanned: boolean
  plan: BudgetPlan
  fact: { essential: number; optional: number; savings: number }
  stats: PetStats
}): string[] {
  const { needsCovered, planKept, savedAsPlanned, plan, fact, stats } = args
  const notes: string[] = []

  if (needsCovered) {
    notes.push('Финни сыт и ухожен — обязательные расходы ты закрыл.')
  } else if (stats.fullness < NEEDS_THRESHOLD && stats.care < NEEDS_THRESHOLD) {
    notes.push(
      `На еду и уход ушло ${fact.essential} ${pluralFinik(fact.essential)}. Этого не хватило: Финни голоден и давно не купался.`,
    )
  } else if (stats.fullness < NEEDS_THRESHOLD) {
    notes.push('Еды на неделю не хватило — Финни проголодался.')
  } else {
    notes.push('Ухода на неделю не хватило — Финни давно не купался.')
  }

  const essential = compareLane('essential', plan.essential, fact.essential)
  const optional = compareLane('optional', plan.optional, fact.optional)
  notes.push(`Нужное: план ${plan.essential}, факт ${fact.essential}. ${essential.note}`)
  notes.push(`Желанное: план ${plan.optional}, факт ${fact.optional}. ${optional.note}`)

  if (savedAsPlanned) {
    notes.push(`В копилку ушло ${fact.savings} ${pluralFinik(fact.savings)} — как и планировал.`)
  } else if (fact.savings === 0) {
    notes.push('В копилку на этой неделе ничего не попало.')
  } else {
    notes.push(
      `В копилку ушло ${fact.savings} вместо ${plan.savings}. Цель стала ближе, но медленнее, чем планировал.`,
    )
  }

  if (planKept) {
    notes.push('Траты совпали с планом — это главный навык недели.')
  }

  return notes
}

function buildNextStep(args: {
  needsCovered: boolean
  planKept: boolean
  savedAsPlanned: boolean
  plan: BudgetPlan
  fact: { essential: number; optional: number; savings: number }
}): string {
  const { needsCovered, planKept, savedAsPlanned, plan, fact } = args

  if (!needsCovered) {
    return `На следующей неделе положи в конверт «Нужное» хотя бы ${ESSENTIAL_NEED_COST} фиников и купи еду и купание первыми.`
  }
  if (!planKept && fact.optional > plan.optional) {
    return 'На следующей неделе попробуй не выходить за конверт «Желанное»: одну покупку можно перенести — это не ошибка.'
  }
  if (!planKept) {
    return 'На следующей неделе сверяйся с планом перед каждой покупкой — так факт совпадёт с планом.'
  }
  if (!savedAsPlanned) {
    return 'Попробуй отложить в копилку сразу после получения фиников, а тратить — то, что осталось.'
  }
  return 'Отличная неделя. Можно поставить цель побольше или выполнить новое задание.'
}
