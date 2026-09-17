import type { GoalTemplate } from '../domain/types'

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'scooter',
    title: 'Самокат для Финни',
    emoji: '🛴',
    cost: 240,
    caption: 'Будете кататься в парке.',
  },
  {
    id: 'house',
    title: 'Домик Финни',
    emoji: '🏠',
    cost: 360,
    caption: 'Своё уютное место для сна.',
  },
  {
    id: 'telescope',
    title: 'Телескоп',
    emoji: '🔭',
    cost: 480,
    caption: 'Будете смотреть на звёзды.',
  },
  {
    id: 'trip',
    title: 'Поездка к морю',
    emoji: '🏖️',
    cost: 600,
    caption: 'Самая большая мечта Финни.',
  },
]

export const CUSTOM_GOAL_SUBJECTS = [
  { id: 'bike', title: 'Велосипед', emoji: '🚲' },
  { id: 'guitar', title: 'Гитара', emoji: '🎸' },
  { id: 'skates', title: 'Ролики', emoji: '🛼' },
  { id: 'tent', title: 'Палатка', emoji: '⛺' },
  { id: 'camera', title: 'Фотоаппарат', emoji: '📷' },
  { id: 'puzzle', title: 'Большой пазл', emoji: '🧩' },
]

export const CUSTOM_GOAL_COSTS = [150, 250, 350, 500]
