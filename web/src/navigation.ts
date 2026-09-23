import type { IconName } from './domain/types'

export type Route =
  | 'home'
  | 'budget'
  | 'shop'
  | 'savings'
  | 'quests'
  | 'quest'
  | 'summary'
  | 'progress'
  | 'glossary'
  | 'parent'
  | 'intro'

export interface Location {
  route: Route
  questId?: string
}

export const TAB_ROUTES: { key: Route; label: string; icon: IconName }[] = [
  { key: 'home', label: 'Дом', icon: 'home' },
  { key: 'budget', label: 'План', icon: 'envelope' },
  { key: 'shop', label: 'Покупки', icon: 'cart' },
  { key: 'savings', label: 'Копилка', icon: 'jar' },
  { key: 'quests', label: 'Задания', icon: 'star' },
]

export function isTabRoute(route: Route): boolean {
  return TAB_ROUTES.some((t) => t.key === route)
}
