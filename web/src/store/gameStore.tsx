import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'

import { GOAL_TEMPLATES } from '../content/goals'
import { QUESTS, questById } from '../content/quests'
import { SHOP_ITEMS, shopItemById } from '../content/shop'
import { spentByKind } from '../domain/purchase'
import { applyEffects } from '../domain/pet'
import { settlePeriod } from '../domain/period'
import { goalFromTemplate } from '../domain/savings'
import {
  DAILY_BONUS,
  DAILY_BONUS_LIMIT,
  PARENT_BONUS_PER_PERIOD_LIMIT,
  PARENT_BONUS_STEP,
  PERIOD_INCOME,
  STARTING_BALANCE,
} from '../domain/rules'
import { createInitialState, createTestProfile, emptyPeriod } from '../domain/state'
import { evaluateQuest, type QuestAnswer } from '../domain/quests'
import type {
  BudgetPlan,
  GameState,
  Goal,
  LedgerEntry,
  PetLook,
  QuestOutcome,
  Settings,
} from '../domain/types'
import { clearState, loadState, saveState } from '../platform/storage'

let ledgerSeq = 0
function ledgerEntry(
  state: GameState,
  kind: LedgerEntry['kind'],
  source: string,
  amount: number,
): LedgerEntry {
  ledgerSeq += 1
  return {
    id: `l${Date.now().toString(36)}-${ledgerSeq}`,
    periodIndex: state.periodIndex,
    kind,
    source,
    amount,
    at: Date.now(),
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export type Action =
  | { type: 'hydrate'; state: GameState }
  | { type: 'finishOnboarding' }
  | { type: 'createPet'; playerName: string; petName: string; look: PetLook }
  | { type: 'claimBonus' }
  | { type: 'setPlan'; plan: BudgetPlan }
  | { type: 'confirmPlan' }
  | { type: 'buy'; itemId: string }
  | { type: 'chooseGoal'; goalId: string }
  | { type: 'addCustomGoal'; goal: Goal }
  | { type: 'deposit'; amount: number }
  | { type: 'withdraw'; amount: number; purpose: string }
  | { type: 'questDone'; questId: string; outcome: QuestOutcome }
  | { type: 'endPeriod' }
  | { type: 'parentBonus' }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'resetProfile' }
  | { type: 'newProfile' }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'hydrate':
      return action.state

    case 'finishOnboarding':
      return touch({ ...state, onboardingDone: true })

    case 'createPet': {
      const next: GameState = {
        ...state,
        playerName: action.playerName,
        pet: { ...action.look, name: action.petName },
        balance: STARTING_BALANCE,
        period: { ...state.period, income: STARTING_BALANCE },
      }
      return touch({
        ...next,
        ledger: [ledgerEntry(state, 'income', 'Стартовый бюджет', STARTING_BALANCE), ...state.ledger],
      })
    }

    case 'claimBonus': {
      if (!canClaimBonus(state)) return state
      return touch({
        ...state,
        balance: state.balance + DAILY_BONUS,
        lastBonusDate: todayKey(),
        period: {
          ...state.period,
          income: state.period.income + DAILY_BONUS,
          bonusesTaken: state.period.bonusesTaken + 1,
        },
        ledger: [ledgerEntry(state, 'income', 'Бонус за вход в игру', DAILY_BONUS), ...state.ledger],
      })
    }

    case 'setPlan':
      return touch({ ...state, plan: action.plan })

    case 'confirmPlan':
      return state.plan ? touch({ ...state, planConfirmed: true }) : state

    case 'buy': {
      const item = shopItemById(action.itemId)
      if (!item || item.price > state.balance) return state

      const purchase = {
        itemId: item.id,
        title: item.title,
        icon: item.icon,
        price: item.price,
        kind: item.kind,
        at: Date.now(),
      }
      const purchases = [...state.period.purchases, purchase]

      return touch({
        ...state,
        balance: state.balance - item.price,
        stats: applyEffects(state.stats, item.effects),
        period: {
          ...state.period,
          purchases,
          essentialSpent: spentByKind(purchases, 'essential'),
          optionalSpent: spentByKind(purchases, 'optional'),
        },
        ledger: [ledgerEntry(state, item.kind, item.title, item.price), ...state.ledger],
      })
    }

    case 'chooseGoal':
      return touch({ ...state, activeGoalId: action.goalId })

    case 'addCustomGoal':
      return touch({
        ...state,
        goals: [...state.goals, action.goal],
        activeGoalId: action.goal.id,
      })

    case 'deposit': {
      const goal = state.goals.find((g) => g.id === state.activeGoalId)
      if (!goal) return state
      const amount = Math.min(action.amount, state.balance)
      if (amount <= 0) return state

      return touch({
        ...state,
        balance: state.balance - amount,
        goals: state.goals.map((g) =>
          g.id === goal.id ? markAchieved({ ...g, saved: g.saved + amount }, state.periodIndex) : g,
        ),
        period: { ...state.period, savedThisPeriod: state.period.savedThisPeriod + amount },
        ledger: [ledgerEntry(state, 'save', `Копилка: ${goal.title}`, amount), ...state.ledger],
      })
    }

    case 'withdraw': {
      const goal = state.goals.find((g) => g.id === state.activeGoalId)
      if (!goal) return state
      const amount = Math.min(action.amount, goal.saved)
      if (amount <= 0) return state

      return touch({
        ...state,
        balance: state.balance + amount,
        goals: state.goals.map((g) => (g.id === goal.id ? { ...g, saved: g.saved - amount } : g)),
        period: {
          ...state.period,
          savedThisPeriod: Math.max(0, state.period.savedThisPeriod - amount),
        },
        ledger: [
          ledgerEntry(state, 'withdraw', `Снято из копилки: ${action.purpose}`, amount),
          ...state.ledger,
        ],
      })
    }

    case 'questDone': {
      const { questId, outcome } = action
      if (state.quests[questId]) return state
      const quest = questById(questId)

      return touch({
        ...state,
        balance: state.balance + outcome.reward,
        stats: outcome.effects ? applyEffects(state.stats, outcome.effects) : state.stats,
        period: {
          ...state.period,
          income: state.period.income + outcome.reward,
          questsDone: [...state.period.questsDone, questId],
        },
        quests: {
          ...state.quests,
          [questId]: {
            questId,
            good: outcome.good,
            reward: outcome.reward,
            periodIndex: state.periodIndex,
            at: Date.now(),
          },
        },
        ledger: [
          ledgerEntry(state, 'income', `Задание «${quest?.title ?? questId}»`, outcome.reward),
          ...state.ledger,
        ],
      })
    }

    case 'endPeriod': {
      if (!state.plan) return state

      const { summary, growthAfter, statsNext } = settlePeriod({
        periodIndex: state.periodIndex,
        income: state.period.income,
        plan: state.plan,
        fact: {
          essential: state.period.essentialSpent,
          optional: state.period.optionalSpent,
          savings: state.period.savedThisPeriod,
        },
        stats: state.stats,
        growthBefore: state.growth,
      })

      const afterSettle: GameState = {
        ...state,
        growth: growthAfter,
        stats: statsNext,
        history: [summary, ...state.history],
        savingStreak: summary.savedAsPlanned ? state.savingStreak + 1 : 0,
        periodIndex: state.periodIndex + 1,
        plan: null,
        planConfirmed: false,
        period: { ...emptyPeriod(), income: PERIOD_INCOME },
        balance: state.balance + PERIOD_INCOME,
      }

      return touch({
        ...afterSettle,
        ledger: [
          ledgerEntry(afterSettle, 'income', `Финики за неделю ${afterSettle.periodIndex}`, PERIOD_INCOME),
          ...state.ledger,
        ],
      })
    }

    case 'parentBonus': {
      if (state.period.parentBonusThisPeriod >= PARENT_BONUS_PER_PERIOD_LIMIT) return state
      return touch({
        ...state,
        balance: state.balance + PARENT_BONUS_STEP,
        parentBonusTotal: state.parentBonusTotal + PARENT_BONUS_STEP,
        period: {
          ...state.period,
          income: state.period.income + PARENT_BONUS_STEP,
          parentBonusThisPeriod: state.period.parentBonusThisPeriod + PARENT_BONUS_STEP,
        },
        ledger: [
          ledgerEntry(state, 'income', 'Баллы от взрослого', PARENT_BONUS_STEP),
          ...state.ledger,
        ],
      })
    }

    case 'settings':
      return touch({ ...state, settings: { ...state.settings, ...action.patch } })

    case 'resetProfile': {
      // demoMode сохраняется
      const fresh = state.settings.demoMode ? createTestProfile() : createInitialState()
      return { ...fresh, settings: { ...fresh.settings, ...state.settings } }
    }

    case 'newProfile':
      return createInitialState()
  }
}

function touch(state: GameState): GameState {
  return { ...state, updatedAt: Date.now() }
}

function markAchieved(goal: Goal, periodIndex: number): Goal {
  if (goal.achievedAtPeriod === null && goal.saved >= goal.cost) {
    return { ...goal, achievedAtPeriod: periodIndex }
  }
  return goal
}

export function canClaimBonus(state: GameState): boolean {
  if (state.period.bonusesTaken >= DAILY_BONUS_LIMIT) return false
  if (state.settings.demoMode) return true
  return state.lastBonusDate !== todayKey()
}

export interface GameApi {
  state: GameState
  dispatch: (action: Action) => void
  submitQuest: (questId: string, answer: QuestAnswer) => QuestOutcome
  activeGoal: Goal | null
  totalSaved: number
  pendingQuestIds: string[]
  storageOk: boolean
}

const GameContext = createContext<GameApi | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => loadState() ?? createInitialState())
  const storageOk = useRef(true)

  useEffect(() => {
    storageOk.current = saveState(state)
  }, [state])

  const submitQuest = useCallback(
    (questId: string, answer: QuestAnswer): QuestOutcome => {
      const quest = questById(questId)
      if (!quest) throw new Error(`Задание не найдено: ${questId}`)
      const outcome = evaluateQuest(quest, answer)
      dispatch({ type: 'questDone', questId, outcome })
      return outcome
    },
    [dispatch],
  )

  const value = useMemo<GameApi>(() => {
    const activeGoal = state.goals.find((g) => g.id === state.activeGoalId) ?? null
    const doneIds = new Set(Object.keys(state.quests))
    return {
      state,
      dispatch,
      submitQuest,
      activeGoal,
      totalSaved: state.goals.reduce((acc, g) => acc + g.saved, 0),
      pendingQuestIds: QUESTS.filter((q) => !doneIds.has(q.id)).map((q) => q.id),
      storageOk: storageOk.current,
    }
  }, [state, submitQuest])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameApi {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame должен вызываться внутри <GameProvider>')
  return ctx
}

export function wipeLocalProfile(dispatch: (a: Action) => void) {
  clearState()
  dispatch({ type: 'newProfile' })
}

export { GOAL_TEMPLATES, QUESTS, SHOP_ITEMS, goalFromTemplate }
