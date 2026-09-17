// Минимальный объём контента по ТЗ п. 2.6.
import { describe, expect, it } from 'vitest'

import { APPEARANCE_COMBINATIONS, STAGES } from './appearance'
import { GOAL_TEMPLATES } from './goals'
import { QUESTS } from './quests'
import { ESSENTIAL_ITEMS, OPTIONAL_ITEMS, SHOP_ITEMS } from './shop'
import { GLOSSARY } from './glossary'
import { DEMO_PERIODS, ESSENTIAL_NEED_COST, MAX_GROWTH_PER_PERIOD } from '../domain/rules'

describe('минимальный объём демонстрационного контента', () => {
  it('питомец: не менее 9 визуально различимых комбинаций', () => {
    expect(APPEARANCE_COMBINATIONS).toBeGreaterThanOrEqual(9)
  })

  it('задания: не менее 6 по 3 темам', () => {
    expect(QUESTS.length).toBeGreaterThanOrEqual(6)
    expect(new Set(QUESTS.map((q) => q.topic)).size).toBeGreaterThanOrEqual(3)
  })

  it('покупки: не менее 8 позиций двух типов', () => {
    expect(SHOP_ITEMS.length).toBeGreaterThanOrEqual(8)
    expect(ESSENTIAL_ITEMS.length).toBeGreaterThan(0)
    expect(OPTIONAL_ITEMS.length).toBeGreaterThan(0)
  })

  it('цели накопления: не менее 3', () => {
    expect(GOAL_TEMPLATES.length).toBeGreaterThanOrEqual(3)
  })

  it('рост питомца: не менее 3 стадий', () => {
    expect(STAGES.length).toBeGreaterThanOrEqual(3)
  })

  it('игровые периоды: последняя стадия достижима за 5 периодов', () => {
    const last = STAGES[STAGES.length - 1]
    expect(DEMO_PERIODS * MAX_GROWTH_PER_PERIOD).toBeGreaterThanOrEqual(last.minGrowth)
  })

  it('справочный раздел содержит основные термины', () => {
    const terms = GLOSSARY.map((g) => g.term.toLowerCase())
    for (const required of ['бюджет', 'накопления', 'финансовая цель']) {
      expect(terms.some((t) => t.includes(required))).toBe(true)
    }
  })
})

describe('согласованность каталога и правил', () => {
  it('минимальный набор обязательных покупок стоит не дороже порога нужд', () => {
    const cheapestFood = Math.min(
      ...ESSENTIAL_ITEMS.filter((i) => (i.effects.fullness ?? 0) >= 30).map((i) => i.price),
    )
    const cheapestCare = Math.min(
      ...ESSENTIAL_ITEMS.filter((i) => (i.effects.care ?? 0) >= 30).map((i) => i.price),
    )
    expect(cheapestFood + cheapestCare).toBeLessThanOrEqual(ESSENTIAL_NEED_COST)
  })

  it('идентификаторы товаров и целей уникальны', () => {
    expect(new Set(SHOP_ITEMS.map((i) => i.id)).size).toBe(SHOP_ITEMS.length)
    expect(new Set(GOAL_TEMPLATES.map((g) => g.id)).size).toBe(GOAL_TEMPLATES.length)
  })

  it('у каждого товара есть понятное описание влияния на питомца', () => {
    for (const item of SHOP_ITEMS) {
      expect(item.impact.length).toBeGreaterThan(5)
      expect(item.price).toBeGreaterThan(0)
      expect(item.perPeriodLimit).toBeGreaterThan(0)
    }
  })

  it('стадии развития идут по возрастанию порога', () => {
    for (let i = 1; i < STAGES.length; i += 1) {
      expect(STAGES[i].minGrowth).toBeGreaterThan(STAGES[i - 1].minGrowth)
    }
  })
})
