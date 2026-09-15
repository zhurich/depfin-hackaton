// Доменные типы, без зависимостей от React/DOM.

export type ExpenseKind = 'essential' | 'optional'

export type BudgetLane = ExpenseKind | 'savings'

export interface PetStats {
  fullness: number
  care: number
  joy: number
}

export type PetStatKey = keyof PetStats

export interface PetLook {
  speciesId: string
  paletteId: string
  accessoryId: string
}

export interface PetProfile extends PetLook {
  name: string
}

export interface PetStage {
  id: string
  title: string
  minGrowth: number
  caption: string
}

export interface BudgetPlan {
  essential: number
  optional: number
  savings: number
}

export interface ShopItem {
  id: string
  title: string
  emoji: string
  price: number
  kind: ExpenseKind
  effects: Partial<PetStats>
  // показывается до подтверждения покупки
  impact: string
  perPeriodLimit: number
}

export interface GoalTemplate {
  id: string
  title: string
  emoji: string
  cost: number
  caption: string
}

export interface Goal extends GoalTemplate {
  custom: boolean
  saved: number
  achievedAtPeriod: number | null
}

export type QuestTopic = 'planning' | 'saving' | 'spending'

export type QuestKind = 'allocate' | 'basket' | 'order' | 'number' | 'choice'

export interface QuestOutcome {
  good: boolean
  explanation: string
  reward: number
  effects?: Partial<PetStats>
}

interface QuestBase {
  id: string
  topic: QuestTopic
  title: string
  situation: string
  task: string
  baseReward: number
}

export interface AllocateQuest extends QuestBase {
  kind: 'allocate'
  amount: number
  lanes: { id: BudgetLane; title: string; emoji: string }[]
  rules: { lane: BudgetLane; min?: number; max?: number; because: string }[]
  goodExplanation: string
  softExplanation: string
}

export interface BasketQuest extends QuestBase {
  kind: 'basket'
  budget: number
  options: { id: string; title: string; emoji: string; price: number; needed: boolean }[]
  mustHave: string[]
  goodExplanation: string
  softExplanation: string
}

export interface OrderQuest extends QuestBase {
  kind: 'order'
  items: { id: string; title: string; emoji: string }[]
  correctOrder: string[]
  goodExplanation: string
  softExplanation: string
}

export interface NumberQuest extends QuestBase {
  kind: 'number'
  unit: string
  correct: number
  tolerance: number
  hint: string
  goodExplanation: string
  softExplanation: string
}

export interface ChoiceQuest extends QuestBase {
  kind: 'choice'
  options: {
    id: string
    title: string
    emoji: string
    good: boolean
    consequence: string
    rewardDelta?: number
    effects?: Partial<PetStats>
  }[]
}

export type Quest =
  | AllocateQuest
  | BasketQuest
  | OrderQuest
  | NumberQuest
  | ChoiceQuest

export interface LedgerEntry {
  id: string
  periodIndex: number
  kind: 'income' | 'essential' | 'optional' | 'save' | 'withdraw'
  source: string
  // всегда > 0, знак определяется kind
  amount: number
  at: number
}

export interface PurchaseEntry {
  itemId: string
  title: string
  emoji: string
  price: number
  kind: ExpenseKind
  at: number
}

export interface PeriodSummary {
  index: number
  income: number
  plan: BudgetPlan
  fact: { essential: number; optional: number; savings: number }
  needsCovered: boolean
  planKept: boolean
  savedAsPlanned: boolean
  growthGained: number
  stageIdAfter: string
  notes: string[]
  nextStep: string
}

export interface QuestResult {
  questId: string
  good: boolean
  reward: number
  periodIndex: number
  at: number
}

export interface Settings {
  sound: boolean
  motion: boolean
  demoMode: boolean
}

export interface GameState {
  schemaVersion: number
  onboardingDone: boolean
  playerName: string
  pet: PetProfile | null
  balance: number
  stats: PetStats
  growth: number
  goals: Goal[]
  activeGoalId: string | null
  periodIndex: number
  plan: BudgetPlan | null
  planConfirmed: boolean
  period: {
    income: number
    essentialSpent: number
    optionalSpent: number
    savedThisPeriod: number
    purchases: PurchaseEntry[]
    questsDone: string[]
    bonusesTaken: number
    parentBonusThisPeriod: number
  }
  // ГГГГ-ММ-ДД
  lastBonusDate: string | null
  ledger: LedgerEntry[]
  quests: Record<string, QuestResult>
  history: PeriodSummary[]
  savingStreak: number
  settings: Settings
  parentBonusTotal: number
  createdAt: number
  updatedAt: number
}
