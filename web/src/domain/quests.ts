// Объяснение выдаётся при любом ответе; за неразумное решение — половина награды.
import type {
  AllocateQuest,
  BasketQuest,
  BudgetLane,
  ChoiceQuest,
  NumberQuest,
  OrderQuest,
  Quest,
  QuestOutcome,
} from './types'

export type QuestAnswer =
  | { kind: 'allocate'; lanes: Partial<Record<BudgetLane, number>> }
  | { kind: 'basket'; selected: string[] }
  | { kind: 'order'; order: string[] }
  | { kind: 'number'; value: number }
  | { kind: 'choice'; optionId: string }

export const SOFT_REWARD_RATIO = 0.5

function softReward(base: number): number {
  return Math.max(1, Math.round(base * SOFT_REWARD_RATIO))
}

export function evaluateQuest(quest: Quest, answer: QuestAnswer): QuestOutcome {
  switch (quest.kind) {
    case 'allocate':
      return evaluateAllocate(quest, answer)
    case 'basket':
      return evaluateBasket(quest, answer)
    case 'order':
      return evaluateOrder(quest, answer)
    case 'number':
      return evaluateNumber(quest, answer)
    case 'choice':
      return evaluateChoice(quest, answer)
  }
}

function evaluateAllocate(quest: AllocateQuest, answer: QuestAnswer): QuestOutcome {
  if (answer.kind !== 'allocate') throw new Error('Несовпадение вида задания и ответа')

  const get = (lane: BudgetLane) => answer.lanes[lane] ?? 0
  const total = quest.lanes.reduce((acc, l) => acc + get(l.id), 0)

  if (total > quest.amount) {
    return {
      good: false,
      reward: softReward(quest.baseReward),
      explanation: `Разложено ${total} из ${quest.amount}. Потратить больше, чем есть, нельзя — расходы не должны превышать доходы. ${quest.softExplanation}`,
    }
  }

  const broken = quest.rules.filter((r) => {
    const value = get(r.lane)
    if (r.min !== undefined && value < r.min) return true
    if (r.max !== undefined && value > r.max) return true
    return false
  })

  if (broken.length > 0) {
    return {
      good: false,
      reward: softReward(quest.baseReward),
      explanation: `${broken.map((b) => b.because).join(' ')} ${quest.softExplanation}`,
    }
  }

  return {
    good: true,
    reward: quest.baseReward,
    explanation: quest.goodExplanation,
    effects: { joy: 5 },
  }
}

function evaluateBasket(quest: BasketQuest, answer: QuestAnswer): QuestOutcome {
  if (answer.kind !== 'basket') throw new Error('Несовпадение вида задания и ответа')

  const selected = new Set(answer.selected)
  const spent = quest.options
    .filter((o) => selected.has(o.id))
    .reduce((acc, o) => acc + o.price, 0)

  const missing = quest.mustHave.filter((id) => !selected.has(id))

  if (spent > quest.budget) {
    return {
      good: false,
      reward: softReward(quest.baseReward),
      explanation: `В корзине на ${spent - quest.budget} больше, чем есть денег. ${quest.softExplanation}`,
    }
  }
  if (missing.length > 0) {
    const titles = quest.options
      .filter((o) => missing.includes(o.id))
      .map((o) => `«${o.title}»`)
      .join(', ')
    return {
      good: false,
      reward: softReward(quest.baseReward),
      explanation: `Без обязательного не обойтись: не хватает ${titles}. ${quest.softExplanation}`,
    }
  }

  return {
    good: true,
    reward: quest.baseReward,
    explanation: quest.goodExplanation,
    effects: { joy: 5 },
  }
}

function evaluateOrder(quest: OrderQuest, answer: QuestAnswer): QuestOutcome {
  if (answer.kind !== 'order') throw new Error('Несовпадение вида задания и ответа')

  const exact =
    answer.order.length === quest.correctOrder.length &&
    answer.order.every((id, i) => id === quest.correctOrder[i])

  if (exact) {
    return {
      good: true,
      reward: quest.baseReward,
      explanation: quest.goodExplanation,
      effects: { joy: 5 },
    }
  }

  return {
    good: false,
    reward: softReward(quest.baseReward),
    explanation: quest.softExplanation,
  }
}

function evaluateNumber(quest: NumberQuest, answer: QuestAnswer): QuestOutcome {
  if (answer.kind !== 'number') throw new Error('Несовпадение вида задания и ответа')

  const ok = Math.abs(answer.value - quest.correct) <= quest.tolerance
  if (ok) {
    return {
      good: true,
      reward: quest.baseReward,
      explanation: quest.goodExplanation,
      effects: { joy: 5 },
    }
  }
  return {
    good: false,
    reward: softReward(quest.baseReward),
    explanation: `Твой ответ — ${answer.value}, а верный — ${quest.correct}. ${quest.softExplanation}`,
  }
}

function evaluateChoice(quest: ChoiceQuest, answer: QuestAnswer): QuestOutcome {
  if (answer.kind !== 'choice') throw new Error('Несовпадение вида задания и ответа')

  const option = quest.options.find((o) => o.id === answer.optionId)
  if (!option) throw new Error(`Неизвестный вариант: ${answer.optionId}`)

  return {
    good: option.good,
    reward: option.good
      ? quest.baseReward + (option.rewardDelta ?? 0)
      : softReward(quest.baseReward),
    explanation: option.consequence,
    effects: option.effects,
  }
}
