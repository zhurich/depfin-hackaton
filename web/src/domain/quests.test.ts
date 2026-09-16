import { describe, expect, it } from 'vitest'

import { QUESTS, questById } from '../content/quests'
import { evaluateQuest } from './quests'
import type { AllocateQuest, BasketQuest, NumberQuest, OrderQuest } from './types'

describe('каталог заданий', () => {
  it('покрывает минимум ТЗ: не менее 6 заданий по 3 темам', () => {
    expect(QUESTS.length).toBeGreaterThanOrEqual(6)
    const topics = new Set(QUESTS.map((q) => q.topic))
    expect(topics.size).toBeGreaterThanOrEqual(3)
  })

  it('не сводится к выбору ответа из вариантов', () => {
    const kinds = new Set(QUESTS.map((q) => q.kind))
    expect(kinds.size).toBeGreaterThanOrEqual(3)
    const nonChoice = QUESTS.filter((q) => q.kind !== 'choice')
    expect(nonChoice.length).toBeGreaterThan(QUESTS.length / 2)
  })

  it('идентификаторы уникальны', () => {
    expect(new Set(QUESTS.map((q) => q.id)).size).toBe(QUESTS.length)
  })
})

describe('объяснение выдаётся при любом ответе', () => {
  it.each(QUESTS.map((q) => [q.id] as const))('%s', (id) => {
    const quest = questById(id)!
    const answers = wrongAndRightAnswers(quest.id)
    for (const answer of answers) {
      const outcome = evaluateQuest(quest, answer)
      expect(outcome.explanation.length).toBeGreaterThan(10)
      expect(outcome.reward).toBeGreaterThan(0)
    }
  })
})

describe('задание с распределением суммы', () => {
  const quest = questById('plan-week') as AllocateQuest

  it('засчитывает разумное распределение', () => {
    const o = evaluateQuest(quest, {
      kind: 'allocate',
      lanes: { essential: 60, optional: 30, savings: 30 },
    })
    expect(o.good).toBe(true)
    expect(o.reward).toBe(quest.baseReward)
  })

  it('отдельно объясняет перерасход', () => {
    const o = evaluateQuest(quest, {
      kind: 'allocate',
      lanes: { essential: 100, optional: 100, savings: 100 },
    })
    expect(o.good).toBe(false)
    expect(o.explanation).toContain('не должны превышать')
  })

  it('объясняет, почему на нужное мало', () => {
    const o = evaluateQuest(quest, {
      kind: 'allocate',
      lanes: { essential: 10, optional: 80, savings: 30 },
    })
    expect(o.good).toBe(false)
    expect(o.explanation).toContain('60')
  })

  it('за неточное решение всё равно даёт награду, но меньше', () => {
    const o = evaluateQuest(quest, { kind: 'allocate', lanes: { essential: 0 } })
    expect(o.reward).toBeGreaterThan(0)
    expect(o.reward).toBeLessThan(quest.baseReward)
  })
})

describe('задание с корзиной', () => {
  const quest = questById('shop-basket') as BasketQuest

  it('засчитывает корзину со всем обязательным в рамках бюджета', () => {
    const o = evaluateQuest(quest, { kind: 'basket', selected: quest.mustHave })
    expect(o.good).toBe(true)
  })

  it('отклоняет корзину дороже бюджета', () => {
    const o = evaluateQuest(quest, {
      kind: 'basket',
      selected: quest.options.map((opt) => opt.id),
    })
    expect(o.good).toBe(false)
    expect(o.explanation).toContain('больше, чем есть денег')
  })

  it('называет, какого обязательного не хватает', () => {
    const o = evaluateQuest(quest, { kind: 'basket', selected: [quest.mustHave[0]] })
    expect(o.good).toBe(false)
    expect(o.explanation).toContain('не хватает')
  })
})

describe('задание с порядком', () => {
  const quest = questById('plan-order') as OrderQuest

  it('засчитывает точный порядок', () => {
    const o = evaluateQuest(quest, { kind: 'order', order: [...quest.correctOrder] })
    expect(o.good).toBe(true)
  })

  it('не засчитывает перестановку', () => {
    const swapped = [...quest.correctOrder].reverse()
    expect(evaluateQuest(quest, { kind: 'order', order: swapped }).good).toBe(false)
  })
})

describe('задание с числом', () => {
  const quest = questById('save-howmuch') as NumberQuest

  it('засчитывает верный ответ', () => {
    expect(evaluateQuest(quest, { kind: 'number', value: quest.correct }).good).toBe(true)
  })

  it('показывает верный ответ при ошибке', () => {
    const o = evaluateQuest(quest, { kind: 'number', value: 10 })
    expect(o.good).toBe(false)
    expect(o.explanation).toContain(String(quest.correct))
  })
})

describe('задание с выбором', () => {
  it('каждый вариант объясняет своё последствие', () => {
    const quest = questById('save-temptation')!
    if (quest.kind !== 'choice') throw new Error('ожидался choice')
    for (const option of quest.options) {
      const o = evaluateQuest(quest, { kind: 'choice', optionId: option.id })
      expect(o.explanation).toBe(option.consequence)
      expect(o.good).toBe(option.good)
    }
  })

  it('падает на неизвестном варианте, а не молча засчитывает', () => {
    const quest = questById('save-temptation')!
    expect(() => evaluateQuest(quest, { kind: 'choice', optionId: 'нет-такого' })).toThrow()
  })
})

function wrongAndRightAnswers(id: string) {
  const quest = questById(id)!
  switch (quest.kind) {
    case 'allocate':
      return [
        { kind: 'allocate' as const, lanes: { essential: quest.amount } },
        { kind: 'allocate' as const, lanes: { essential: 0, optional: quest.amount * 3 } },
      ]
    case 'basket':
      return [
        { kind: 'basket' as const, selected: quest.mustHave },
        { kind: 'basket' as const, selected: [] },
      ]
    case 'order':
      return [
        { kind: 'order' as const, order: [...quest.correctOrder] },
        { kind: 'order' as const, order: [...quest.correctOrder].reverse() },
      ]
    case 'number':
      return [
        { kind: 'number' as const, value: quest.correct },
        { kind: 'number' as const, value: quest.correct + 100 },
      ]
    case 'choice':
      return quest.options.map((o) => ({ kind: 'choice' as const, optionId: o.id }))
  }
}
