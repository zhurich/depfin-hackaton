// Константы экономики. Формулы — в docs/GAME-ECONOMY.md.

export const CURRENCY = 'финик'
export const CURRENCY_SHORT = 'Ф'

export const STARTING_BALANCE = 120

export const PERIOD_INCOME = 100

export const DAILY_BONUS = 10

export const DAILY_BONUS_LIMIT = 3

export const PARENT_BONUS_STEP = 20

export const PARENT_BONUS_PER_PERIOD_LIMIT = 40

export const STAT_MIN = 0
export const STAT_MAX = 100

export const PERIOD_DECAY = {
  fullness: 35,
  care: 30,
  joy: 15,
} as const

export const NEEDS_THRESHOLD = 45

// = цена набора «каша + купание»
export const ESSENTIAL_NEED_COST = 45

export const PLAN_TOLERANCE_ABS = 10

export const GROWTH_POINTS = {
  needsCovered: 2,
  planKept: 2,
  savedAsPlanned: 2,
} as const

export const MAX_GROWTH_PER_PERIOD =
  GROWTH_POINTS.needsCovered + GROWTH_POINTS.planKept + GROWTH_POINTS.savedAsPlanned

export const DEMO_PERIODS = 5

export const SCHEMA_VERSION = 1
