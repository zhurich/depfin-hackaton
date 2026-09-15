import { describe, expect, it } from 'vitest'

import {
  checkPlan,
  compareLane,
  comparePlanWithFact,
  isPlanKept,
  planRemainder,
  planTotal,
  suggestPlan,
} from './budget'
import { ESSENTIAL_NEED_COST } from './rules'

describe('план личного бюджета', () => {
  it('считает сумму и остаток по трём направлениям', () => {
    const plan = { essential: 50, optional: 30, savings: 20 }
    expect(planTotal(plan)).toBe(100)
    expect(planRemainder(120, plan)).toBe(20)
  })

  it('не даёт подтвердить план с перерасходом и называет размер перебора', () => {
    const check = checkPlan(100, { essential: 60, optional: 40, savings: 30 }, ESSENTIAL_NEED_COST)
    expect(check.ok).toBe(false)
    expect(check.remainder).toBe(-30)
    expect(check.problem).toContain('30')
  })

  it('разрешает план, который в точности равен бюджету', () => {
    const check = checkPlan(100, { essential: 50, optional: 30, savings: 20 }, ESSENTIAL_NEED_COST)
    expect(check.ok).toBe(true)
    expect(check.remainder).toBe(0)
  })

  it('отклоняет отрицательные суммы', () => {
    const check = checkPlan(100, { essential: -10, optional: 0, savings: 0 }, ESSENTIAL_NEED_COST)
    expect(check.ok).toBe(false)
  })

  it('подсказывает, но не блокирует, если на нужное отложено мало', () => {
    const check = checkPlan(100, { essential: 10, optional: 60, savings: 30 }, ESSENTIAL_NEED_COST)
    expect(check.ok).toBe(true)
    expect(check.advice).toContain('еду и уход')
  })

  it('подсказывает про пустую копилку', () => {
    const check = checkPlan(100, { essential: 60, optional: 40, savings: 0 }, ESSENTIAL_NEED_COST)
    expect(check.ok).toBe(true)
    expect(check.advice).toContain('копилку')
  })
})

describe('сравнение плана с фактом', () => {
  it('для расходов «уложился» значит «потратил не больше плана»', () => {
    expect(compareLane('optional', 40, 35).kept).toBe(true)
    expect(compareLane('optional', 40, 40).kept).toBe(true)
    expect(compareLane('optional', 40, 70).kept).toBe(false)
  })

  it('допускает небольшое превышение в пределах допуска', () => {
    expect(compareLane('essential', 50, 58).kept).toBe(true)
    expect(compareLane('essential', 50, 65).kept).toBe(false)
  })

  it('для накоплений «уложился» значит «отложил не меньше плана»', () => {
    expect(compareLane('savings', 30, 40).kept).toBe(true)
    expect(compareLane('savings', 30, 30).kept).toBe(true)
    expect(compareLane('savings', 30, 5).kept).toBe(false)
  })

  it('возвращает разбор по всем трём направлениям', () => {
    const rows = comparePlanWithFact(
      { essential: 50, optional: 30, savings: 20 },
      { essential: 45, optional: 55, savings: 20 },
    )
    expect(rows).toHaveLength(3)
    expect(rows[1].note).toContain('больше плана')
  })

  it('план выполнен, только когда уложились оба направления расходов', () => {
    const plan = { essential: 50, optional: 30, savings: 20 }
    expect(isPlanKept(plan, { essential: 50, optional: 30 })).toBe(true)
    expect(isPlanKept(plan, { essential: 50, optional: 60 })).toBe(false)
    expect(isPlanKept(plan, { essential: 90, optional: 30 })).toBe(false)
  })
})

describe('подсказка распределения', () => {
  it('сначала закрывает обязательные нужды, остальное делит', () => {
    const plan = suggestPlan(120, ESSENTIAL_NEED_COST)
    expect(plan.essential).toBe(ESSENTIAL_NEED_COST)
    expect(planTotal(plan)).toBe(120)
  })

  it('не уходит в минус при очень маленьком бюджете', () => {
    const plan = suggestPlan(20, ESSENTIAL_NEED_COST)
    expect(plan.essential).toBe(20)
    expect(plan.optional).toBeGreaterThanOrEqual(0)
    expect(plan.savings).toBeGreaterThanOrEqual(0)
    expect(planTotal(plan)).toBe(20)
  })
})
