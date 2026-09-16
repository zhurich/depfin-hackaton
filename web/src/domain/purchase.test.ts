import { describe, expect, it } from 'vitest'

import { checkPurchase, findCheaperAlternative, spentByKind } from './purchase'
import type { PurchaseContext } from './purchase'
import type { PurchaseEntry, ShopItem } from './types'

const ball: ShopItem = {
  id: 'ball',
  title: 'Мячик',
  emoji: '⚽',
  price: 50,
  kind: 'optional',
  effects: { joy: 20 },
  impact: 'Радость вырастет.',
  perPeriodLimit: 1,
}

const stickers: ShopItem = {
  id: 'stickers',
  title: 'Наклейки',
  emoji: '✨',
  price: 20,
  kind: 'optional',
  effects: { joy: 10 },
  impact: 'Немного радости.',
  perPeriodLimit: 2,
}

function ctx(patch: Partial<PurchaseContext> = {}): PurchaseContext {
  return {
    balance: 100,
    purchases: [],
    cheaperAlternative: null,
    averagePendingQuestReward: 0,
    activeGoalSaved: 0,
    ...patch,
  }
}

function entry(item: ShopItem): PurchaseEntry {
  return {
    itemId: item.id,
    title: item.title,
    emoji: item.emoji,
    price: item.price,
    kind: item.kind,
    at: 0,
  }
}

describe('проверка покупки', () => {
  it('разрешает покупку, когда денег хватает', () => {
    expect(checkPurchase(ball, ctx()).allowed).toBe(true)
  })

  it('разрешает покупку ровно на весь остаток — баланс станет нулём, но не минусом', () => {
    const check = checkPurchase(ball, ctx({ balance: 50 }))
    expect(check.allowed).toBe(true)
  })

  it('запрещает покупку при нехватке средств и называет точную недостачу', () => {
    const check = checkPurchase(ball, ctx({ balance: 30 }))
    expect(check.allowed).toBe(false)
    expect(check.reason).toBe('insufficient-funds')
    expect(check.shortfall).toBe(20)
    expect(check.message).toContain('20')
  })

  it('при нехватке средств всегда предлагает хотя бы один выход', () => {
    const check = checkPurchase(ball, ctx({ balance: 0 }))
    expect(check.options.length).toBeGreaterThan(0)
    expect(check.options.some((o) => o.id === 'next-period')).toBe(true)
  })

  it('предлагает задание, дешёвую замену и копилку, когда они доступны', () => {
    const check = checkPurchase(
      ball,
      ctx({
        balance: 10,
        cheaperAlternative: stickers,
        averagePendingQuestReward: 18,
        activeGoalSaved: 90,
      }),
    )
    const ids = check.options.map((o) => o.id)
    expect(ids).toContain('quest')
    expect(ids).toContain('cheaper')
    expect(ids).toContain('withdraw')
  })

  it('не предлагает копилку, если в ней пусто', () => {
    const check = checkPurchase(ball, ctx({ balance: 10, activeGoalSaved: 0 }))
    expect(check.options.some((o) => o.id === 'withdraw')).toBe(false)
  })

  it('блокирует покупку сверх лимита за период', () => {
    const check = checkPurchase(ball, ctx({ purchases: [entry(ball)] }))
    expect(check.allowed).toBe(false)
    expect(check.reason).toBe('limit-reached')
  })

  it('лимит считается по каждому предмету отдельно', () => {
    const check = checkPurchase(stickers, ctx({ purchases: [entry(stickers)] }))
    expect(check.allowed).toBe(true)
  })
})

describe('вспомогательные расчёты', () => {
  it('суммирует траты по типу расхода', () => {
    const purchases = [entry(ball), entry(stickers)]
    expect(spentByKind(purchases, 'optional')).toBe(70)
    expect(spentByKind(purchases, 'essential')).toBe(0)
  })

  it('ищет самую дорогую из доступных замен того же типа', () => {
    const cheap: ShopItem = { ...stickers, id: 'cheap', price: 5 }
    const alt = findCheaperAlternative(ball, [ball, stickers, cheap], {
      balance: 25,
      purchases: [],
    })
    expect(alt?.id).toBe('stickers')
  })

  it('не предлагает замену, исчерпавшую лимит', () => {
    const alt = findCheaperAlternative(ball, [ball, stickers], {
      balance: 25,
      purchases: [entry(stickers), entry(stickers)],
    })
    expect(alt).toBeNull()
  })

  it('не предлагает замену, которая тоже не по карману', () => {
    const alt = findCheaperAlternative(ball, [ball, stickers], { balance: 5, purchases: [] })
    expect(alt).toBeNull()
  })
})
