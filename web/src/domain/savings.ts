import type { Goal, GoalTemplate, LedgerEntry } from './types'

export function goalRemaining(goal: Goal): number {
  return Math.max(0, goal.cost - goal.saved)
}

export function goalProgress(goal: Goal): number {
  if (goal.cost <= 0) return 1
  return Math.min(1, goal.saved / goal.cost)
}

export function isGoalReached(goal: Goal): boolean {
  return goal.saved >= goal.cost
}

// Среднее только по периодам с пополнением; null, пока пополнений не было.
export function averageDeposit(ledger: LedgerEntry[]): number | null {
  const byPeriod = new Map<number, number>()
  for (const e of ledger) {
    if (e.kind === 'save') {
      byPeriod.set(e.periodIndex, (byPeriod.get(e.periodIndex) ?? 0) + e.amount)
    }
  }
  if (byPeriod.size === 0) return null
  let sum = 0
  for (const v of byPeriod.values()) sum += v
  return Math.round(sum / byPeriod.size)
}

export interface GoalForecast {
  remaining: number
  averagePerPeriod: number | null
  periods: number | null
  explanation: string
}

export function forecastGoal(goal: Goal, average: number | null): GoalForecast {
  const remaining = goalRemaining(goal)

  if (remaining === 0) {
    return {
      remaining: 0,
      averagePerPeriod: average,
      periods: 0,
      explanation: 'Цель уже накоплена. Можно забрать её или выбрать новую.',
    }
  }
  if (average === null || average <= 0) {
    return {
      remaining,
      averagePerPeriod: average,
      periods: null,
      explanation:
        'Пополни копилку хотя бы один раз — и мы посчитаем, сколько недель осталось до цели.',
    }
  }

  const periods = Math.ceil(remaining / average)
  return {
    remaining,
    averagePerPeriod: average,
    periods,
    explanation: `Ты откладываешь примерно ${average} ${pluralFinik(average)} в неделю. Осталось ${remaining} — это ещё ${periods} ${pluralWeek(periods)}.`,
  }
}

export interface WithdrawPreview {
  amount: number
  savedBefore: number
  savedAfter: number
  forecastBefore: GoalForecast
  forecastAfter: GoalForecast
  periodsDelta: number | null
  warning: string
}

export function previewWithdraw(
  goal: Goal,
  amount: number,
  average: number | null,
): WithdrawPreview {
  const clamped = Math.max(0, Math.min(amount, goal.saved))
  const after: Goal = { ...goal, saved: goal.saved - clamped }

  const forecastBefore = forecastGoal(goal, average)
  const forecastAfter = forecastGoal(after, average)

  const periodsDelta =
    forecastBefore.periods !== null && forecastAfter.periods !== null
      ? forecastAfter.periods - forecastBefore.periods
      : null

  let warning: string
  if (periodsDelta !== null && periodsDelta > 0) {
    warning = `Копилка уменьшится с ${goal.saved} до ${after.saved}. До цели станет дольше на ${periodsDelta} ${pluralWeekAcc(periodsDelta)}.`
  } else {
    warning = `Копилка уменьшится с ${goal.saved} до ${after.saved} ${pluralFinik(after.saved)}.`
  }

  return {
    amount: clamped,
    savedBefore: goal.saved,
    savedAfter: after.saved,
    forecastBefore,
    forecastAfter,
    periodsDelta,
    warning,
  }
}

export function goalFromTemplate(t: GoalTemplate, custom = false): Goal {
  return { ...t, custom, saved: 0, achievedAtPeriod: null }
}

export function pluralFinik(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'финик'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'финика'
  return 'фиников'
}

export function pluralWeek(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'неделя'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'недели'
  return 'недель'
}

/** Винительный падеж: «дольше на 1 неделю», «на 2 недели», «на 5 недель». */
export function pluralWeekAcc(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'неделю'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'недели'
  return 'недель'
}
