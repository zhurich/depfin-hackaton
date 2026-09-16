import { pluralFinik } from './savings'
import type { ExpenseKind, PurchaseEntry, ShopItem } from './types'

export type PurchaseBlockReason = 'insufficient-funds' | 'limit-reached'

export interface PurchaseOption {
  id: 'quest' | 'withdraw' | 'cheaper' | 'next-period'
  label: string
  hint: string
}

export interface PurchaseCheck {
  allowed: boolean
  reason: PurchaseBlockReason | null
  shortfall: number
  message: string
  options: PurchaseOption[]
}

export interface PurchaseContext {
  balance: number
  purchases: PurchaseEntry[]
  cheaperAlternative: ShopItem | null
  averagePendingQuestReward: number
  activeGoalSaved: number
}

const ALLOWED: PurchaseCheck = {
  allowed: true,
  reason: null,
  shortfall: 0,
  message: '',
  options: [],
}

export function boughtCount(purchases: PurchaseEntry[], itemId: string): number {
  return purchases.filter((p) => p.itemId === itemId).length
}

export function checkPurchase(item: ShopItem, ctx: PurchaseContext): PurchaseCheck {
  if (boughtCount(ctx.purchases, item.id) >= item.perPeriodLimit) {
    return {
      allowed: false,
      reason: 'limit-reached',
      shortfall: 0,
      message: `На этой неделе «${item.title}» у Финни уже достаточно. Попробуй что-то другое.`,
      options: [
        {
          id: 'next-period',
          label: 'Оставить на следующую неделю',
          hint: 'Покупка никуда не денется.',
        },
      ],
    }
  }

  if (item.price > ctx.balance) {
    const shortfall = item.price - ctx.balance
    const options: PurchaseOption[] = []

    if (ctx.averagePendingQuestReward > 0) {
      options.push({
        id: 'quest',
        label: 'Выполнить задание',
        hint: `За задание дают около ${ctx.averagePendingQuestReward} ${pluralFinik(ctx.averagePendingQuestReward)}.`,
      })
    }
    if (ctx.cheaperAlternative) {
      options.push({
        id: 'cheaper',
        label: `Взять «${ctx.cheaperAlternative.title}» за ${ctx.cheaperAlternative.price}`,
        hint: 'Дешевле, а для Финни почти так же полезно.',
      })
    }
    if (ctx.activeGoalSaved > 0) {
      options.push({
        id: 'withdraw',
        label: 'Снять из копилки',
        hint: 'Цель станет дальше. Понадобится отдельное подтверждение.',
      })
    }
    options.push({
      id: 'next-period',
      label: 'Отложить до следующей недели',
      hint: 'Отказаться от желанного — это не ошибка.',
    })

    return {
      allowed: false,
      reason: 'insufficient-funds',
      shortfall,
      message: `Не хватает ${shortfall} ${pluralFinik(shortfall)}. «${item.title}» стоит ${item.price}, а у тебя ${ctx.balance}.`,
      options,
    }
  }

  return ALLOWED
}

export function spentByKind(purchases: PurchaseEntry[], kind: ExpenseKind): number {
  return purchases.filter((p) => p.kind === kind).reduce((acc, p) => acc + p.price, 0)
}

export function findCheaperAlternative(
  item: ShopItem,
  catalog: ShopItem[],
  ctx: { balance: number; purchases: PurchaseEntry[] },
): ShopItem | null {
  const candidates = catalog
    .filter(
      (c) =>
        c.id !== item.id &&
        c.kind === item.kind &&
        c.price <= ctx.balance &&
        boughtCount(ctx.purchases, c.id) < c.perPeriodLimit,
    )
    .sort((a, b) => b.price - a.price)
  return candidates[0] ?? null
}
