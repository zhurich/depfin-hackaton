import { GOAL_TEMPLATES } from '../content/goals'
import { ACCESSORIES, PALETTES, SPECIES } from '../content/appearance'
import { goalFromTemplate } from './savings'
import { SCHEMA_VERSION } from './rules'
import type { GameState, PetStats } from './types'

export const INITIAL_STATS: PetStats = { fullness: 70, care: 70, joy: 60 }

export function createInitialState(now: number = Date.now()): GameState {
  return {
    schemaVersion: SCHEMA_VERSION,
    onboardingDone: false,
    playerName: '',
    pet: null,
    balance: 0,
    stats: { ...INITIAL_STATS },
    growth: 0,
    goals: GOAL_TEMPLATES.map((t) => goalFromTemplate(t)),
    activeGoalId: null,
    periodIndex: 1,
    plan: null,
    planConfirmed: false,
    period: emptyPeriod(),
    lastBonusDate: null,
    ledger: [],
    quests: {},
    history: [],
    savingStreak: 0,
    settings: { sound: true, motion: true, demoMode: false },
    parentBonusTotal: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export function emptyPeriod(): GameState['period'] {
  return {
    income: 0,
    essentialSpent: 0,
    optionalSpent: 0,
    savedThisPeriod: 0,
    purchases: [],
    questsDone: [],
    bonusesTaken: 0,
    parentBonusThisPeriod: 0,
  }
}

export function createTestProfile(now: number = Date.now()): GameState {
  const state = createInitialState(now)
  state.settings.demoMode = true
  return state
}

export function randomLook(rnd: () => number = Math.random) {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]
  return {
    speciesId: pick(SPECIES).id,
    paletteId: pick(PALETTES).id,
    accessoryId: pick(ACCESSORIES).id,
  }
}

export function migrate(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null
  const base = createInitialState()
  const loaded = raw as Partial<GameState>

  if (typeof loaded.schemaVersion !== 'number') return null

  return {
    ...base,
    ...loaded,
    schemaVersion: SCHEMA_VERSION,
    stats: { ...base.stats, ...(loaded.stats ?? {}) },
    period: { ...base.period, ...(loaded.period ?? {}) },
    settings: { ...base.settings, ...(loaded.settings ?? {}) },
    goals: Array.isArray(loaded.goals) && loaded.goals.length > 0 ? loaded.goals : base.goals,
    ledger: Array.isArray(loaded.ledger) ? loaded.ledger : [],
    history: Array.isArray(loaded.history) ? loaded.history : [],
    quests: loaded.quests ?? {},
  }
}
