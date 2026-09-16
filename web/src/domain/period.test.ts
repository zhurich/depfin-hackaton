import { describe, expect, it } from 'vitest'

import { settlePeriod, type SettlementInput } from './period'
import { MAX_GROWTH_PER_PERIOD, PERIOD_DECAY, STAT_MIN } from './rules'
import { stageForGrowth } from './pet'
import { STAGES } from '../content/appearance'

function input(patch: Partial<SettlementInput> = {}): SettlementInput {
  return {
    periodIndex: 1,
    income: 120,
    plan: { essential: 50, optional: 40, savings: 30 },
    fact: { essential: 50, optional: 40, savings: 30 },
    stats: { fullness: 80, care: 80, joy: 70 },
    growthBefore: 0,
    ...patch,
  }
}

describe('закрытие игрового периода', () => {
  it('за идеальную неделю даёт максимум очков роста', () => {
    const r = settlePeriod(input())
    expect(r.summary.needsCovered).toBe(true)
    expect(r.summary.planKept).toBe(true)
    expect(r.summary.savedAsPlanned).toBe(true)
    expect(r.summary.growthGained).toBe(MAX_GROWTH_PER_PERIOD)
  })

  it('не начисляет очки за нужды, если Финни голоден', () => {
    const r = settlePeriod(input({ stats: { fullness: 10, care: 80, joy: 70 } }))
    expect(r.summary.needsCovered).toBe(false)
    expect(r.summary.growthGained).toBeLessThan(MAX_GROWTH_PER_PERIOD)
    expect(r.summary.notes.join(' ')).toContain('проголодался')
  })

  it('не начисляет очки за план при перерасходе на желанное', () => {
    const r = settlePeriod(input({ fact: { essential: 50, optional: 90, savings: 30 } }))
    expect(r.summary.planKept).toBe(false)
    expect(r.summary.nextStep).toContain('Желанное')
  })

  it('не засчитывает регулярность накоплений, если в копилку ничего не попало', () => {
    const r = settlePeriod(
      input({
        plan: { essential: 50, optional: 40, savings: 0 },
        fact: { essential: 50, optional: 40, savings: 0 },
      }),
    )
    expect(r.summary.savedAsPlanned).toBe(false)
  })

  it('засчитывает накопления сверх плана', () => {
    const r = settlePeriod(input({ fact: { essential: 50, optional: 40, savings: 45 } }))
    expect(r.summary.savedAsPlanned).toBe(true)
  })

  it('очки роста только накапливаются — неудачная неделя не обнуляет прогресс', () => {
    const r = settlePeriod(
      input({
        growthBefore: 12,
        stats: { fullness: 5, care: 5, joy: 5 },
        fact: { essential: 0, optional: 200, savings: 0 },
      }),
    )
    expect(r.summary.growthGained).toBe(0)
    expect(r.growthAfter).toBe(12)
    expect(stageForGrowth(r.growthAfter).id).toBe(stageForGrowth(12).id)
  })

  it('снижает показатели питомца к началу следующего периода, но не ниже нуля', () => {
    const r = settlePeriod(input({ stats: { fullness: 80, care: 10, joy: 5 } }))
    expect(r.statsNext.fullness).toBe(80 - PERIOD_DECAY.fullness)
    expect(r.statsNext.care).toBe(STAT_MIN)
    expect(r.statsNext.joy).toBe(STAT_MIN)
  })

  it('всегда объясняет итог и предлагает следующий шаг', () => {
    const r = settlePeriod(input())
    expect(r.summary.notes.length).toBeGreaterThan(0)
    expect(r.summary.nextStep.length).toBeGreaterThan(0)
  })

  it('сначала предлагает закрыть обязательные расходы', () => {
    const r = settlePeriod(
      input({
        stats: { fullness: 10, care: 10, joy: 90 },
        fact: { essential: 0, optional: 200, savings: 0 },
      }),
    )
    expect(r.summary.nextStep).toContain('Нужное')
  })
})

describe('стадии развития', () => {
  it('начинается с первой стадии', () => {
    expect(stageForGrowth(0).id).toBe(STAGES[0].id)
  })

  it('переключается на следующую стадию ровно на пороге', () => {
    const second = STAGES[1]
    expect(stageForGrowth(second.minGrowth - 1).id).toBe(STAGES[0].id)
    expect(stageForGrowth(second.minGrowth).id).toBe(second.id)
  })

  it('последняя стадия достижима за пять периодов обязательного сценария', () => {
    const last = STAGES[STAGES.length - 1]
    expect(5 * MAX_GROWTH_PER_PERIOD).toBeGreaterThanOrEqual(last.minGrowth)
  })

  it('не выходит за последнюю стадию при большом росте', () => {
    expect(stageForGrowth(999).id).toBe(STAGES[STAGES.length - 1].id)
  })
})
