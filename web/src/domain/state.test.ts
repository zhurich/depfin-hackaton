import { describe, expect, it } from 'vitest'

import { SCHEMA_VERSION } from './rules'
import { createInitialState, migrate } from './state'

// профиль сборки до редизайна (schema v1)
function legacyProfileV1() {
  return {
    schemaVersion: 1,
    onboardingDone: true,
    playerName: 'Капитан',
    pet: { speciesId: 'bunny', paletteId: 'mint', accessoryId: 'none', name: 'Финни' },
    balance: 80,
    stats: { fullness: 70, care: 70, joy: 60 },
    growth: 4,
    goals: [
      { id: 'scooter', title: 'Самокат для Финни', emoji: '🛴', cost: 240, caption: '', custom: false, saved: 40, achievedAtPeriod: null },
      { id: 'custom-bike-250', title: 'Велосипед', emoji: '🚲', cost: 250, caption: '', custom: true, saved: 0, achievedAtPeriod: null },
      { id: 'unknown-goal', title: 'Что-то своё', emoji: '❓', cost: 100, caption: '', custom: true, saved: 0, achievedAtPeriod: null },
    ],
    activeGoalId: 'scooter',
    periodIndex: 2,
    plan: { essential: 45, optional: 25, savings: 30 },
    planConfirmed: true,
    period: {
      income: 100,
      essentialSpent: 20,
      optionalSpent: 0,
      savedThisPeriod: 0,
      purchases: [
        { itemId: 'porridge', title: 'Каша', emoji: '🥣', price: 20, kind: 'essential', at: 0 },
        { itemId: 'снятый-с-продажи', title: 'Старый товар', emoji: '🎈', price: 10, kind: 'optional', at: 0 },
      ],
      questsDone: [],
      bonusesTaken: 0,
      parentBonusThisPeriod: 0,
    },
    lastBonusDate: null,
    ledger: [],
    quests: {},
    history: [],
    savingStreak: 0,
    settings: { sound: true, motion: true, demoMode: false },
    parentBonusTotal: 0,
    createdAt: 0,
    updatedAt: 0,
  }
}

describe('миграция профиля', () => {
  it('отклоняет мусор вместо профиля', () => {
    expect(migrate(null)).toBeNull()
    expect(migrate('строка')).toBeNull()
    expect(migrate({})).toBeNull()
  })

  it('поднимает версию схемы до текущей', () => {
    const state = migrate(legacyProfileV1())!
    expect(state.schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('сохраняет игровой прогресс из старого профиля', () => {
    const state = migrate(legacyProfileV1())!
    expect(state.playerName).toBe('Капитан')
    expect(state.balance).toBe(80)
    expect(state.growth).toBe(4)
    expect(state.periodIndex).toBe(2)
    expect(state.goals.find((g) => g.id === 'scooter')!.saved).toBe(40)
  })

  it('подставляет иконки целям, у которых их не было', () => {
    const state = migrate(legacyProfileV1())!
    for (const goal of state.goals) {
      expect(typeof goal.icon).toBe('string')
      expect(goal.icon.length).toBeGreaterThan(0)
    }
    expect(state.goals.find((g) => g.id === 'scooter')!.icon).toBe('scooter')
    expect(state.goals.find((g) => g.id === 'custom-bike-250')!.icon).toBe('bike')
    expect(state.goals.find((g) => g.id === 'unknown-goal')!.icon).toBe('target')
  })

  it('подставляет иконки покупкам текущего периода', () => {
    const state = migrate(legacyProfileV1())!
    const purchases = state.period.purchases
    expect(purchases[0].icon).toBe('bowl')
    expect(purchases[1].icon).toBe('kite')
  })

  it('дозаполняет поля, которых в старом профиле не было', () => {
    const legacy = legacyProfileV1() as Record<string, unknown>
    delete legacy.savingStreak
    delete legacy.lastBonusDate
    delete legacy.settings

    const state = migrate(legacy)!
    const base = createInitialState()
    expect(state.savingStreak).toBe(base.savingStreak)
    expect(state.lastBonusDate).toBe(base.lastBonusDate)
    expect(state.settings).toEqual(base.settings)
  })

  it('выдерживает профиль с испорченными списками', () => {
    const legacy = legacyProfileV1() as Record<string, unknown>
    legacy.goals = 'не массив'
    legacy.ledger = null
    legacy.history = undefined
    legacy.period = null

    const state = migrate(legacy)!
    expect(state.goals.length).toBeGreaterThan(0)
    expect(state.ledger).toEqual([])
    expect(state.history).toEqual([])
    expect(state.period.purchases).toEqual([])
  })
})
