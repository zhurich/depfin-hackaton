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
