import { describe, expect, it } from 'vitest'

import {
  averageDeposit,
  forecastGoal,
  goalProgress,
  goalRemaining,
  isGoalReached,
  previewWithdraw,
} from './savings'
import type { Goal, LedgerEntry } from './types'

function goal(patch: Partial<Goal> = {}): Goal {
  return {
    id: 'scooter',
    title: 'Самокат',
    emoji: '🛴',
    cost: 240,
    caption: '',
    custom: false,
    saved: 0,
    achievedAtPeriod: null,
    ...patch,
  }
}

function save(periodIndex: number, amount: number): LedgerEntry {
  return { id: `${periodIndex}-${amount}`, periodIndex, kind: 'save', source: 'Копилка', amount, at: 0 }
}

describe('прогресс цели', () => {
  it('показывает остаток и долю накопленного', () => {
    const g = goal({ saved: 60 })
    expect(goalRemaining(g)).toBe(180)
    expect(goalProgress(g)).toBeCloseTo(0.25)
  })

  it('не уходит в отрицательный остаток при перенакоплении', () => {
    const g = goal({ saved: 300 })
    expect(goalRemaining(g)).toBe(0)
    expect(goalProgress(g)).toBe(1)
    expect(isGoalReached(g)).toBe(true)
  })
})

describe('средняя сумма регулярного пополнения', () => {
  it('не считается, пока пополнений не было', () => {
    expect(averageDeposit([])).toBeNull()
  })

  it('усредняет по периодам, а не по отдельным операциям', () => {
    // В периоде 1 два пополнения по 20, в периоде 2 — одно на 60.
    const ledger = [save(1, 20), save(1, 20), save(2, 60)]
    expect(averageDeposit(ledger)).toBe(50)
  })

  it('игнорирует операции, не относящиеся к копилке', () => {
    const ledger: LedgerEntry[] = [
      save(1, 40),
      { id: 'x', periodIndex: 1, kind: 'optional', source: 'Мячик', amount: 100, at: 0 },
    ]
    expect(averageDeposit(ledger)).toBe(40)
  })
})

describe('срок достижения цели', () => {
  it('не выдумывает срок, пока нет ни одного пополнения', () => {
    const f = forecastGoal(goal(), null)
    expect(f.periods).toBeNull()
    expect(f.explanation).toContain('Пополни копилку')
  })

  it('считает срок делением остатка на среднее пополнение и округляет вверх', () => {
    const f = forecastGoal(goal({ saved: 100 }), 60)
    // Осталось 140, по 60 в неделю -> 3 недели.
    expect(f.remaining).toBe(140)
    expect(f.periods).toBe(3)
    expect(f.explanation).toContain('60')
  })

  it('сообщает, что цель уже накоплена', () => {
    const f = forecastGoal(goal({ saved: 240 }), 60)
    expect(f.periods).toBe(0)
  })
})

describe('предпросмотр снятия из копилки', () => {
  it('показывает сумму до и после снятия', () => {
    const p = previewWithdraw(goal({ saved: 200 }), 60, 60)
    expect(p.savedBefore).toBe(200)
    expect(p.savedAfter).toBe(140)
  })

  it('показывает, на сколько отодвинется цель', () => {
    // Было: осталось 40 -> 1 неделя. Стало: осталось 100 -> 2 недели.
    const p = previewWithdraw(goal({ saved: 200 }), 60, 60)
    expect(p.periodsDelta).toBe(1)
    expect(p.warning).toContain('дольше')
  })

  it('не даёт снять больше, чем накоплено', () => {
    const p = previewWithdraw(goal({ saved: 50 }), 500, 25)
    expect(p.amount).toBe(50)
    expect(p.savedAfter).toBe(0)
  })

  it('обходится без срока, когда пополнений ещё не было', () => {
    const p = previewWithdraw(goal({ saved: 50 }), 20, null)
    expect(p.periodsDelta).toBeNull()
    expect(p.savedAfter).toBe(30)
  })
})
