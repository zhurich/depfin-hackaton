import type { GoalTemplate, IconName } from '../domain/types'

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'scooter',
    title: 'Самокат для Финни',
    icon: 'scooter',
    cost: 240,
    caption: 'Будете кататься в парке.',
  },
  {
    id: 'house',
    title: 'Домик Финни',
    icon: 'house',
    cost: 360,
    caption: 'Своё уютное место для сна.',
  },
  {
    id: 'telescope',
    title: 'Телескоп',
    icon: 'telescope',
    cost: 480,
    caption: 'Будете смотреть на звёзды.',
  },
  {
    id: 'trip',
    title: 'Поездка к морю',
    icon: 'beach',
    cost: 600,
    caption: 'Самая большая мечта Финни.',
  },
]

export const CUSTOM_GOAL_SUBJECTS: { id: string; title: string; icon: IconName }[] = [
  { id: 'bike', title: 'Велосипед', icon: 'bike' },
  { id: 'guitar', title: 'Гитара', icon: 'guitar' },
  { id: 'skates', title: 'Ролики', icon: 'skates' },
  { id: 'tent', title: 'Палатка', icon: 'tent' },
  { id: 'camera', title: 'Фотоаппарат', icon: 'camera' },
  { id: 'puzzle', title: 'Большой пазл', icon: 'puzzle' },
]

export const CUSTOM_GOAL_COSTS = [150, 250, 350, 500]
